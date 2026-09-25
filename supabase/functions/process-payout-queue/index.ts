// supabase/functions/process-payout-queue/index.ts
//
// Deploy: supabase functions deploy process-payout-queue --no-verify-jwt
// Required secrets (in addition to the STK push ones already set):
//   CRON_SECRET                — same one enqueue-payouts uses
//   MPESA_B2C_SHORTCODE        — your B2C-enabled shortcode
//   MPESA_B2C_INITIATOR_NAME   — the API user Safaricom issued for B2C
//   MPESA_B2C_SECURITY_CREDENTIAL — initiator password, RSA-encrypted
//                                    with Safaricom's public cert
//                                    (generated once in the portal —
//                                    see the B2C setup steps)
//   MPESA_B2C_RESULT_URL       — this project's b2c-result-callback URL
//   MPESA_B2C_TIMEOUT_URL      — this project's b2c-timeout-callback URL
//
// Trigger this frequently (e.g. every 1–5 minutes) via the same
// scheduler as enqueue-payouts. It only claims a bounded batch per
// invocation (PAYOUT_BATCH_SIZE, default 20) — that's deliberate:
// Edge Functions have an execution time ceiling, and Safaricom's own
// per-merchant rate tier (set in the portal, not fixed by this code)
// is the real limit on how fast you can push these through. Running
// this on a short interval lets the backlog drain steadily rather than
// trying to force it through in one long-running call.
//
// B2C is asynchronous in both directions: this function only sends the
// request and records Safaricom's synchronous acknowledgement. The
// actual success/failure of the money movement arrives later via
// b2c-result-callback.ts (or b2c-timeout-callback.ts if Safaricom's
// queue itself times out) — a queue row stays "processing" until one
// of those resolves it, not until this function returns.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MPESA_ENV = Deno.env.get("MPESA_ENV") ?? "sandbox";
const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const BATCH_SIZE = Number(Deno.env.get("PAYOUT_BATCH_SIZE") ?? "20");
// A small gap between calls, not a hard rate limiter — your actual
// ceiling is whatever tier Safaricom assigned your account, which this
// code has no way to know. Adjust this once you know that number;
// until then it's a conservative default meant to avoid bursting.
const DELAY_BETWEEN_CALLS_MS = Number(Deno.env.get("PAYOUT_CALL_DELAY_MS") ?? "300");

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  return null;
}

async function getAccessToken(): Promise<string> {
  const key = Deno.env.get("MPESA_CONSUMER_KEY")!;
  const secret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
  const auth = btoa(`${key}:${secret}`);
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Daraja OAuth failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  const cronSecret = req.headers.get("X-Cron-Secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: batch, error: claimError } = await admin.rpc("claim_payout_batch", {
      p_batch_size: BATCH_SIZE,
    });

    if (claimError) {
      console.error("Failed to claim payout batch:", claimError);
      return new Response(JSON.stringify({ error: "Failed to claim batch" }), { status: 500 });
    }
    if (!batch || batch.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken();
    let sent = 0;
    let rejectedImmediately = 0;

    for (const row of batch) {
      const phone = normalizePhone(row.phone);
      if (!phone) {
        // Can't send to an unusable number — this is a data problem,
        // not a transient failure, so it goes straight to dead_letter
        // rather than burning retries on something that will never
        // succeed on its own.
        await admin
          .from("payout_queue")
          .update({
            status: "dead_letter",
            last_error: `Invalid phone number: ${row.phone}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        continue;
      }

      try {
        const res = await fetch(`${BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            InitiatorName: Deno.env.get("MPESA_B2C_INITIATOR_NAME"),
            SecurityCredential: Deno.env.get("MPESA_B2C_SECURITY_CREDENTIAL"),
            CommandID: "BusinessPayment",
            Amount: Math.round(row.amount),
            PartyA: Deno.env.get("MPESA_B2C_SHORTCODE"),
            PartyB: phone,
            Remarks: `MajiLink payout #${row.id}`.slice(0, 100),
            QueueTimeOutURL: Deno.env.get("MPESA_B2C_TIMEOUT_URL"),
            ResultURL: Deno.env.get("MPESA_B2C_RESULT_URL"),
            Occasion: "",
          }),
        });

        const json = await res.json();

        if (res.ok && json.ResponseCode === "0") {
          // Accepted into Safaricom's queue — stays "processing" until
          // the result (or timeout) callback resolves it. Store both
          // ids now so the callback can find this row.
          await admin
            .from("payout_queue")
            .update({
              originator_conversation_id: json.OriginatorConversationID,
              conversation_id: json.ConversationID,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          sent++;
        } else {
          rejectedImmediately++;
          const nextStatus = row.attempts >= row.max_attempts ? "dead_letter" : "failed";
          await admin
            .from("payout_queue")
            .update({
              status: nextStatus,
              last_error: json.errorMessage ?? json.ResponseDescription ?? "B2C request rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
        }
      } catch (err) {
        rejectedImmediately++;
        const nextStatus = row.attempts >= row.max_attempts ? "dead_letter" : "failed";
        await admin
          .from("payout_queue")
          .update({
            status: nextStatus,
            last_error: String(err),
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }

      await sleep(DELAY_BETWEEN_CALLS_MS);
    }

    return new Response(
      JSON.stringify({ claimed: batch.length, sent, rejectedImmediately }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-payout-queue failed:", err);
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
});
