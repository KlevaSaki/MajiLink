// supabase/functions/enqueue-payouts/index.ts
//
// Deploy: supabase functions deploy enqueue-payouts --no-verify-jwt
// (no-verify-jwt because this is triggered by a scheduler, not a
// logged-in user — protected instead by CRON_SECRET below)
//
// Required secrets:
//   CRON_SECRET — any random string; the scheduler must send it as
//                 X-Cron-Secret so this can't be triggered by anyone
//                 who finds the URL.
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — auto-provided.
//
// Trigger this on a schedule (e.g. hourly) via pg_cron calling
// net.http_post, or an external scheduler (GitHub Actions cron,
// cron-job.org, etc.) hitting this URL with the header set. Safaricom
// itself never calls this one — only your own scheduler does.
//
// One open queue entry per recipient at a time, deliberately: if a
// vendor already has a 'queued' or 'processing' row, this run skips
// them rather than creating a second one. Any newly-paid orders that
// arrive while that entry is still in flight simply wait for the next
// run once the current one resolves (success or terminal failure) —
// simpler than trying to merge two in-flight amounts for the same
// recipient, and nothing is lost, just deferred one cycle.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const [vendorsDue, driversDue, openQueue] = await Promise.all([
      admin.from("vendor_payouts_due").select("*"),
      admin.from("driver_payouts_due").select("*"),
      admin
        .from("payout_queue")
        .select("recipient_type, recipient_id")
        .in("status", ["queued", "processing"]),
    ]);

    if (vendorsDue.error || driversDue.error || openQueue.error) {
      console.error("Failed to read due/open queue:", vendorsDue.error, driversDue.error, openQueue.error);
      return new Response(JSON.stringify({ error: "Failed to read payout state" }), { status: 500 });
    }

    const alreadyOpen = new Set(
      (openQueue.data ?? []).map((r) => `${r.recipient_type}:${r.recipient_id}`)
    );

    const newRows: any[] = [];

    for (const v of vendorsDue.data ?? []) {
      const key = `vendor:${v.business_id}`;
      if (alreadyOpen.has(key)) continue;
      if (!v.owner_phone) continue; // nowhere to send it — skip, not silently drop money
      newRows.push({
        recipient_type: "vendor",
        recipient_id: v.business_id,
        phone: v.owner_phone,
        amount: v.total_due,
        order_ids: v.order_ids,
      });
    }

    for (const d of driversDue.data ?? []) {
      const key = `driver:${d.driver_id}`;
      if (alreadyOpen.has(key)) continue;
      if (!d.driver_phone) continue;
      newRows.push({
        recipient_type: "driver",
        recipient_id: d.driver_id,
        phone: d.driver_phone,
        amount: d.total_due,
        order_ids: d.order_ids,
      });
    }

    if (newRows.length === 0) {
      return new Response(JSON.stringify({ enqueued: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await admin.from("payout_queue").insert(newRows);
    if (insertError) {
      console.error("Failed to enqueue payouts:", insertError);
      return new Response(JSON.stringify({ error: "Failed to enqueue payouts" }), { status: 500 });
    }

    return new Response(JSON.stringify({ enqueued: newRows.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enqueue-payouts failed:", err);
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
});
