import { useState } from "react";
import { X, ImageOff, Loader2, Smartphone, CheckCircle2, AlertTriangle } from "lucide-react";
import type { VendorProfile, InventoryItem } from "../../../types/vendor";
import type { Order } from "../../../types/index";
import { useCustomerStore } from "../../../store/useCustomerStore";

interface Props {
  supplier: VendorProfile;
  item: InventoryItem;
  customerId: string;
  /** Inserts the order and returns the real, DB-backed order. */
  onPlace: (order: Order) => Promise<Order>;
  /** Called once the whole flow is finished — paid, failed-and-given-up,
   *  or explicitly deferred. Always closes the search overlay too. */
  onDone: () => void;
  /** Called only if the customer backs out before the order is even
   *  created (the confirm step's close button). */
  onClose: () => void;
}

type Step = "confirm" | "paying";

function normalizeKenyanPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return (
    (digits.startsWith("254") && digits.length === 12) ||
    (digits.startsWith("0") && digits.length === 10) ||
    (digits.startsWith("7") && digits.length === 9)
  );
}

export default function PlaceOrderModal({
  supplier,
  item,
  customerId,
  onPlace,
  onDone,
  onClose,
}: Props) {
  const userPhone = useCustomerStore((s) => s.user.phone);
  const initiatePayment = useCustomerStore((s) => s.initiatePayment);

  const [step, setStep] = useState<Step>("confirm");
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const [realOrder, setRealOrder] = useState<Order | null>(null);
  const [phone, setPhone] = useState(userPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSent, setPushSent] = useState(false);

  // Reactive: once the realtime subscription (set up by the dashboard
  // that opened this modal) refreshes orders, this picks up the real
  // payment_status without the modal needing its own polling logic.
  const liveOrder = useCustomerStore((s) =>
    realOrder ? s.orders.find((o) => o.id === realOrder.id) : undefined
  );

  const total = item.pricePerUnit * quantity;
  const maxQty = item.stock > 0 ? item.stock : 10;
  const paymentStatus = liveOrder?.paymentStatus ?? realOrder?.paymentStatus ?? "unpaid";

  async function handlePlace() {
    if (quantity > item.stock) {
      setError(`Only ${item.stock} left in stock`);
      return;
    }

    const draft: Order = {
      id: `ord_${Date.now()}`,
      customerId,
      item: {
        vendorId: supplier.id,
        vendorName: supplier.businessName,
        productId: item.id,
        productName: item.name,
        category: item.category,
        quantity,
        unitPrice: item.pricePerUnit,
        unit: item.unit,
      },
      status: "pending",
      totalAmount: total,
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    };

    setPlacing(true);
    setError("");
    try {
      const created = await onPlace(draft);
      setRealOrder(created);
      setStep("paying");
    } catch {
      setError("Couldn't place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  async function handleSendPush() {
    if (!normalizeKenyanPhone(phone)) {
      setPhoneError("Enter a valid Kenyan number (e.g. 0712 345 678)");
      return;
    }
    if (!realOrder) return;

    setSendingPush(true);
    setPhoneError("");
    const { error: pushError } = await initiatePayment(realOrder.id, phone);
    setSendingPush(false);

    if (pushError) {
      setPhoneError(pushError);
      return;
    }
    setPushSent(true);
  }

  // ── Step: confirm quantity, then place the order ──────────────────────────
  if (step === "confirm") {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#134E4A]">Confirm order</h3>
            <button
              onClick={onClose}
              disabled={placing}
              className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="bg-[#FAFAF8] rounded-2xl p-4 flex items-center gap-3">
            {item.imageUrl && !imageFailed ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#D6D3D1] shrink-0"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white border border-[#D6D3D1] flex items-center justify-center shrink-0">
                <ImageOff className="w-4 h-4 text-gray-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
              <p className="text-xs text-gray-500 truncate">{supplier.businessName}</p>
              <p className="text-sm font-semibold text-[#134E4A] mt-0.5">
                KSh {item.pricePerUnit} / {item.unit.replace(/s$/, "")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={placing}
                className="w-10 h-10 rounded-full border border-[#D6D3D1] flex items-center justify-center text-xl text-[#134E4A] font-medium hover:border-[#4FD1C5] transition disabled:opacity-50"
              >
                −
              </button>
              <span className="text-2xl font-bold text-[#134E4A] w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={placing}
                className="w-10 h-10 rounded-full border border-[#D6D3D1] flex items-center justify-center text-xl text-[#134E4A] font-medium hover:border-[#4FD1C5] transition disabled:opacity-50"
              >
                +
              </button>
              <span className="text-xs text-gray-400 ml-1">{item.stock} in stock</span>
            </div>
          </div>

          <div className="bg-[#FAFAF8] rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{quantity} × KSh {item.pricePerUnit}</span>
              <span>KSh {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[#134E4A] border-t border-[#D6D3D1] pt-2">
              <span>Total</span>
              <span>KSh {total.toLocaleString()}</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handlePlace}
            disabled={placing}
            className="w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {placing && <Loader2 className="w-4 h-4 animate-spin" />}
            {placing ? "Placing order…" : "Continue to payment"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: pay via M-Pesa ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#134E4A]">Pay with M-Pesa</h3>
          {paymentStatus !== "pending" && (
            <button
              onClick={onDone}
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
              {quantity} × {item.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{supplier.businessName}</p>
          </div>
          <p className="text-sm font-bold text-[#134E4A] shrink-0">
            KSh {total.toLocaleString()}
          </p>
        </div>

        {paymentStatus === "paid" ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-[#0F6E56] mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">Payment received</p>
            <p className="text-xs text-gray-400 mt-1">Your order is confirmed.</p>
            <button
              onClick={onDone}
              className="w-full mt-4 bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        ) : paymentStatus === "failed" ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">Payment didn't go through</p>
            <p className="text-xs text-gray-400 mt-1">
              You can try sending the request again.
            </p>
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
              {sendingPush ? "Sending request…" : `Pay KSh ${total.toLocaleString()}`}
            </button>

            <button
              onClick={onDone}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Pay later — order is saved
            </button>
          </>
        )}
      </div>
    </div>
  );
}
