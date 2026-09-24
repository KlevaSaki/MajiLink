// supabase/functions/mpesa-callback/index.ts
//
// Deploy: supabase functions deploy mpesa-callback --no-verify-jwt
// (--no-verify-jwt is required: Safaricom calls this URL directly, with
// no Supabase auth header, so the platform's default JWT check would
// reject every real callback.)
//
// Set MPESA_CALLBACK_URL (used by initiate-mpesa-payment) to this
// function's deployed URL:
//   https://<project-ref>.supabase.co/functions/v1/mpesa-callback
//
// Daraja POSTs here once the customer enters their PIN (or cancels, or
// the prompt times out) and expects back exactly {"ResultCode":0,
// "ResultDesc":"Accepted"} regardless of whether the payment itself
// succeeded — that acknowledges receipt of the callback, not the
// payment outcome, and its absence makes Daraja retry.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fare rule, duplicated from src/store/useDriverStore.ts because this
// runs in a separate Deno runtime that can't import the React app's
// source. If the fare rule ever changes, it has to change in both
// places — there is no single source of truth across the two runtimes.
const FARE_BLOCK_KM = 4.5;
const FARE_PER_BLOCK = 50;

function computeFare(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return Math.ceil(distanceKm / FARE_BLOCK_KM) * FARE_PER_BLOCK;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface CallbackItem {
  Name: string;
  Value?: string | number;
}

serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();
    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      console.error("Unrecognized callback shape:", JSON.stringify(payload));
      return acknowledge();
    }

    const checkoutRequestId: string = stkCallback.CheckoutRequestID;
    const resultCode: number = stkCallback.ResultCode;
    const resultDesc: string = stkCallback.ResultDesc;

    const { data: txn } = await admin
      .from("mpesa_transactions")
      .select("id, order_id")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (!txn) {
      // A callback for a checkout request we have no record of — log it
      // and still acknowledge, so Daraja doesn't keep retrying something
      // we can never resolve.
      console.error("No mpesa_transactions row for checkout_request_id:", checkoutRequestId);
      return acknowledge();
    }

    if (resultCode !== 0) {
      await admin
        .from("mpesa_transactions")
        .update({
          status: "failed",
          result_code: resultCode,
          result_desc: resultDesc,
          raw_callback: payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", txn.id);

      await admin
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", txn.order_id);

      return acknowledge();
    }

    // Success — pull the receipt out of Daraja's flat metadata array.
    const items: CallbackItem[] = stkCallback.CallbackMetadata?.Item ?? [];
    const findItem = (name: string) => items.find((i) => i.Name === name)?.Value;
    const mpesaReceipt = String(findItem("MpesaReceiptNumber") ?? "");

    // The split is a property of the route (pickup → dropoff distance),
    // not of who ends up driving it — no driver may even be assigned
    // yet at payment time. Both coordinate pairs come from the order's
    // own joined data.
    const { data: order } = await admin
      .from("orders")
      .select(
        "id, total_amount, delivery_lat, delivery_lng, businesses:business_id ( latitude, longitude )"
      )
      .eq("id", txn.order_id)
      .single();

    let driverPayout = 0;
    const bizLat = order?.businesses?.latitude;
    const bizLng = order?.businesses?.longitude;
    if (order && bizLat != null && bizLng != null && order.delivery_lat != null && order.delivery_lng != null) {
      const distanceKm = haversineKm(bizLat, bizLng, order.delivery_lat, order.delivery_lng);
      driverPayout = computeFare(distanceKm);
    }
    // If either coordinate is missing, driverPayout stays 0 rather than
    // guessing — same "don't invent a number" rule as the client code.
    const vendorPayout = order ? Math.max(0, order.total_amount - driverPayout) : 0;

    await admin
      .from("mpesa_transactions")
      .update({
        status: "success",
        result_code: resultCode,
        result_desc: resultDesc,
        mpesa_receipt: mpesaReceipt,
        raw_callback: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", txn.id);

    await admin
      .from("orders")
      .update({
        payment_status: "paid",
        mpesa_receipt: mpesaReceipt,
        driver_payout: driverPayout,
        vendor_payout: vendorPayout,
        paid_at: new Date().toISOString(),
      })
      .eq("id", txn.order_id);

    return acknowledge();
  } catch (err) {
    console.error("mpesa-callback failed:", err);
    // Still acknowledge — Daraja retries on anything else, and a
    // malformed callback we can't parse will never succeed on retry.
    return acknowledge();
  }
});

function acknowledge(): Response {
  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
}
