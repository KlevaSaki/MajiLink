import { useState } from "react";
import { X, Smartphone, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Order } from "../../../types/index";
import { useCustomerStore } from "../../../store/useCustomerStore";

interface Props {
  order: Order;
  onClose: () => void;
}

function normalizeKenyanPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return (
    (digits.startsWith("254") && digits.length === 12) ||
    (digits.startsWith("0") && digits.length === 10) ||
    (digits.startsWith("7") && digits.length === 9)
  );
}

export default function PaymentPrompt({ order, onClose }: Props) {
  const userPhone = useCustomerStore((s) => s.user.phone);
  const initiatePayment = useCustomerStore((s) => s.initiatePayment);
  // Reactive: the realtime order subscription already running on the
  // customer dashboard keeps this current without any polling here.
  const liveOrder = useCustomerStore((s) => s.orders.find((o) => o.id === order.id)) ?? order;

  const [phone, setPhone] = useState(userPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSent, setPushSent] = useState(false);

  const paymentStatus = liveOrder.paymentStatus;

  async function handleSendPush() {
    if (!normalizeKenyanPhone(phone)) {
      setPhoneError("Enter a valid Kenyan number (e.g. 0712 345 678)");
      return;
    }
    setSendingPush(true);
    setPhoneError("");
    const { error } = await initiatePayment(order.id, phone);
    setSendingPush(false);
    if (error) {
      setPhoneError(error);
      return;
    }
    setPushSent(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#134E4A]">Pay with M-Pesa</h3>
          {paymentStatus !== "pending" && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        <div className="bg-[#FAFAF8] rounded-2xl p-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {liveOrder.item.quantity} × {liveOrder.item.productName}
            </p>
            <p className="text-xs text-gray-400 truncate">{liveOrder.item.vendorName}</p>
          </div>
          <p className="text-sm font-bold text-[#134E4A] shrink-0">
            KSh {liveOrder.totalAmount.toLocaleString()}
          </p>
        </div>

        {paymentStatus === "paid" ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-[#0F6E56] mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">Payment received</p>
            <p className="text-xs text-gray-400 mt-1">Thanks for using MajiLink.</p>
            <button
              onClick={onClose}
              className="w-full mt-4 bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        ) : paymentStatus === "failed" ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">Payment didn't go through</p>
            <p className="text-xs text-gray-400 mt-1">You can try sending the request again.</p>
            <button
              onClick={() => setPushSent(false)}
              className="w-full mt-4 bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition"
            >
              Try again
            </button>
          </div>
        ) : pushSent || paymentStatus === "pending" ? (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 text-[#134E4A] mx-auto mb-3 animate-spin" />
            <p className="text-sm font-semibold text-gray-800">Check your phone</p>
            <p className="text-xs text-gray-400 mt-1">
              Enter your M-Pesa PIN on the prompt sent to {phone} to complete payment.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                M-Pesa phone number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                  placeholder="0712 345 678"
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                    phoneError ? "border-red-400" : "border-[#D6D3D1]"
                  }`}
                />
              </div>
              {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
            </div>

            <button
              onClick={handleSendPush}
              disabled={sendingPush}
              className="w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sendingPush && <Loader2 className="w-4 h-4 animate-spin" />}
              {sendingPush ? "Sending request…" : `Pay KSh ${liveOrder.totalAmount.toLocaleString()}`}
            </button>

            <button
              onClick={onClose}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Remind me later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
