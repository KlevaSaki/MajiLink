import { useState } from "react";
import { X, ImageOff, Loader2, Navigation, Check } from "lucide-react";
import type { VendorProfile, InventoryItem } from "../../../types/vendor";
import type { Order } from "../../../types/index";
import { useCustomerStore } from "../../../store/useCustomerStore";
import { getCurrentPosition, GEOLOCATION_MESSAGES } from "../../../lib/geolocation";

interface Props {
  supplier: VendorProfile;
  item: InventoryItem;
  customerId: string;
  onPlace: (order: Order) => Promise<Order>;
  onDone: () => void;
  onClose: () => void;
}

export default function PlaceOrderModal({
  supplier,
  item,
  customerId,
  onPlace,
  onDone,
  onClose,
}: Props) {
  const userLat = useCustomerStore((s) => s.user.latitude);
  const userLng = useCustomerStore((s) => s.user.longitude);
  const setDeliveryLocation = useCustomerStore((s) => s.setDeliveryLocation);

  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const total = item.pricePerUnit * quantity;
  const maxQty = item.stock > 0 ? item.stock : 10;
  // Without this, the order gets created with no delivery point at all —
  // "Address not set" everywhere it's shown, and no way for the driver's
  // fare to be computed since that depends on real pickup/dropoff
  // coordinates. Required here, not just offered, for the same reason
  // vendor onboarding requires a location pin rather than treating it
  // as optional.
  const hasLocation = userLat !== 0 || userLng !== 0;

  async function handleSetLocation() {
    setLocating(true);
    setLocationError(null);
    const result = await getCurrentPosition();
    setLocating(false);

    if (!result.ok) {
      setLocationError(GEOLOCATION_MESSAGES[result.reason]);
      return;
    }
    await setDeliveryLocation(result.coords.latitude, result.coords.longitude);
  }

  async function handlePlace() {
    if (quantity > item.stock) {
      setError(`Only ${item.stock} left in stock`);
      return;
    }
    if (!hasLocation) {
      setError("Set your delivery location first");
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
      // Payment happens after delivery, not now — see PaymentPrompt,
      // triggered from OrderTracker once the driver marks it delivered.
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    };

    setPlacing(true);
    setError("");
    try {
      await onPlace(draft);
      onDone();
    } catch {
      setError("Couldn't place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

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

        {/* Delivery location — required before placing */}
        <div>
          <button
            type="button"
            onClick={handleSetLocation}
            disabled={locating}
            className={`w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm text-left transition-colors disabled:opacity-60 ${
              hasLocation
                ? "border-[#4FD1C5] bg-[#4FD1C5]/5 text-[#134E4A]"
                : "border-[#D6D3D1] text-gray-600 hover:border-[#134E4A]"
            }`}
          >
            {locating ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : hasLocation ? (
              <Check className="w-4 h-4 shrink-0 text-[#0F6E56]" />
            ) : (
              <Navigation className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1 min-w-0">
              {locating
                ? "Finding your location…"
                : hasLocation
                ? "Delivery location set — tap to update"
                : "Set your delivery location"}
            </span>
          </button>
          {locationError && <p className="text-xs text-red-500 mt-1.5">{locationError}</p>}
        </div>

        <p className="text-xs text-gray-400 text-center">
          You'll pay by M-Pesa once your order is delivered.
        </p>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handlePlace}
          disabled={placing || !hasLocation}
          className="w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {placing && <Loader2 className="w-4 h-4 animate-spin" />}
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </div>
  );
}
