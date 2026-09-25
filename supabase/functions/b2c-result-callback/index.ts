// supabase/functions/b2c-result-callback/index.ts
//
// Deploy: supabase functions deploy b2c-result-callback --no-verify-jwt
// (Safaricom calls this directly, same reasoning as mpesa-callback.ts)
//
// Set MPESA_B2C_RESULT_URL (used by process-payout-queue) to this
// function's deployed URL.
//
// This is a different payload shape from the STK push callback — B2C
// wraps everything in "Result" with a flat "ResultParameters" array
// instead of "stkCallback"/"CallbackMetadata". Don't reuse the STK
// parsing logic here; the field names genuinely differ.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ResultParameter {
  Key: string;
  Value?: string | number;
}

serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();
    const result = payload?.Result;
    if (!result) {
      console.error("Unrecognized B2C result shape:", JSON.stringify(payload));
      return acknowledge();
    }

    const conversationId: string = result.ConversationID;
    const resultCode: number = result.ResultCode;
    const resultDesc: string = result.ResultDesc;

    const { data: row } = await admin
      .from("payout_queue")
      .select("*")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (!row) {
      console.error("No payout_queue row for ConversationID:", conversationId);
      return acknowledge();
    }

    if (resultCode !== 0) {
      const nextStatus = row.attempts >= row.max_attempts ? "dead_letter" : "failed";
      await admin
        .from("payout_queue")
        .update({
          status: nextStatus,
          last_error: resultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return acknowledge();
    }

    // Success — pull the receipt out of B2C's flat ResultParameters.
    const params: ResultParameter[] = result.ResultParameters?.ResultParameter ?? [];
    const findParam = (key: string) => params.find((p) => p.Key === key)?.Value;
    const mpesaReceipt = String(findParam("TransactionReceipt") ?? "");

    await admin
      .from("payout_queue")
      .update({
        status: "success",
        mpesa_receipt: mpesaReceipt,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    // Mark every order this payout covered as settled for whichever
    // side (vendor or driver) it was for — this is what actually keeps
    // vendor_payouts_due/driver_payouts_due from showing it again.
    const column = row.recipient_type === "vendor" ? "vendor_paid_out_at" : "driver_paid_out_at";
    await admin
      .from("orders")
      .update({ [column]: new Date().toISOString() })
      .in("id", row.order_ids);

    return acknowledge();
  } catch (err) {
    console.error("b2c-result-callback failed:", err);
    return acknowledge();
  }
});

function acknowledge(): Response {
  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
}
