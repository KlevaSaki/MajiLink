// supabase/functions/b2c-timeout-callback/index.ts
//
// Deploy: supabase functions deploy b2c-timeout-callback --no-verify-jwt
//
// Set MPESA_B2C_TIMEOUT_URL (used by process-payout-queue) to this
// function's deployed URL.
//
// Safaricom calls THIS url (not b2c-result-callback) when its own
// internal queue is overloaded and can't process the request at all —
// a genuinely different situation from "we processed it and it
// failed." Both end up marking the row retriable, but keeping them as
// two functions matches how Safaricom actually models the two cases,
// and gives last_error a truthful reason if you're ever debugging why
// a payout is stuck.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();
    const result = payload?.Result;
    const conversationId: string | undefined = result?.ConversationID;

    if (!conversationId) {
      console.error("Unrecognized B2C timeout shape:", JSON.stringify(payload));
      return acknowledge();
    }

    const { data: row } = await admin
      .from("payout_queue")
      .select("id, attempts, max_attempts")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (!row) {
      console.error("No payout_queue row for ConversationID:", conversationId);
      return acknowledge();
    }

    const nextStatus = row.attempts >= row.max_attempts ? "dead_letter" : "failed";
    await admin
      .from("payout_queue")
      .update({
        status: nextStatus,
        last_error: "Timed out in Safaricom's processing queue",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return acknowledge();
  } catch (err) {
    console.error("b2c-timeout-callback failed:", err);
    return acknowledge();
  }
});

function acknowledge(): Response {
  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
}
