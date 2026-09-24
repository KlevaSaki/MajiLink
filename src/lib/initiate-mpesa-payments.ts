// supabase/functions/initiate-mpesa-payment/index.ts
//
// Deploy: supabase functions deploy initiate-mpesa-payment
// Required secrets (supabase secrets set NAME=value):
//   MPESA_CONSUMER_KEY       — from your Daraja app
//   MPESA_CONSUMER_SECRET    — from your Daraja app
//   MPESA_SHORTCODE          — your Paybill/Till number (sandbox: 174379)
//   MPESA_PASSKEY             — Daraja's Lipa Na M-Pesa passkey
//   MPESA_ENV                — "sandbox" or "production"
//   MPESA_CALLBACK_URL        — this project's mpesa-callback function URL,
//                                e.g. https://<project-ref>.supabase.co/functions/v1/mpesa-callback
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — already present in every
//                                Edge Function's environment automatically.
//
// This function must run with the service role (not the anon key) for
// the orders/mpesa_transactions writes, since customers have no INSERT
// policy on mpesa_transactions by design — only server code that has
// actually talked to Safaricom may create a payment record. The caller's
// own JWT is still checked, to confirm they own the order being paid for.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MPESA_ENV = Deno.env.get("MPESA_ENV") ?? "sandbox";
const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** Kenyan numbers in various shapes → Daraja's required 2547XXXXXXXX. */
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

serve(async (req) => {
  try {
    const { order_id, phone } = await req.json();
    if (!order_id || !phone) {
      return new Response(JSON.stringify({ error: "order_id and phone are required" }), {
        status: 400,
      });
    }

    const normalizedPhone = normalizePhone(String(phone));
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ error: "Enter a valid Kenyan phone number" }), {
        status: 400,
      });
    }

    // Two clients: one scoped to the caller's own JWT (to verify they
    // own the order), one on the service role (to write the payment
    // record, which the caller's own role can't do — see the RLS note
    // in the migration).
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await callerClient
      .from("orders")
      .select("id, customer_id, total_amount, payment_status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }
    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "This order is already paid" }), {
        status: 409,
      });
    }

    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
    const passkey = Deno.env.get("MPESA_PASSKEY")!;
    const timestamp = formatTimestamp(new Date());
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const accessToken = await getAccessToken();

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(order.total_amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: Deno.env.get("MPESA_CALLBACK_URL"),
        AccountReference: `MajiLink-${order.id}`,
        TransactionDesc: `MajiLink order #${order.id}`,
      }),
    });

    const stkJson = await stkRes.json();

    if (!stkRes.ok || stkJson.ResponseCode !== "0") {
      console.error("STK push rejected by Daraja:", stkJson);
      return new Response(
        JSON.stringify({ error: stkJson.errorMessage ?? "M-Pesa request was rejected" }),
        { status: 502 }
      );
    }

    // Record the attempt and mark the order as awaiting confirmation.
    // Both writes use the service-role client — the anon/authenticated
    // role genuinely cannot perform the first one (see the migration's
    // RLS comment), and using it consistently for both keeps this one
    // function's writes in one place instead of split across two roles.
    await adminClient.from("mpesa_transactions").insert({
      order_id: order.id,
      checkout_request_id: stkJson.CheckoutRequestID,
      merchant_request_id: stkJson.MerchantRequestID,
      phone: normalizedPhone,
      amount: order.total_amount,
      status: "pending",
    });

    await adminClient
      .from("orders")
      .update({
        payment_status: "pending",
        mpesa_checkout_request_id: stkJson.CheckoutRequestID,
      })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ success: true, checkoutRequestId: stkJson.CheckoutRequestID }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("initiate-mpesa-payment failed:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
    });
  }
});
