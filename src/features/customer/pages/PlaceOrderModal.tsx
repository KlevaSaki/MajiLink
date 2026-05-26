import { useState } from "react";
import { X, Star } from "lucide-react";
import type { Vendor, Order } from "../../../types/index";
import { MOCK_VENDORS } from "../../../data/mockData";

interface Props {
  onClose: () => void;
  onPlace: (order: Order) => void;
  customerId: string;
  walletBalance: number;
}

export default function PlaceOrderModal({ onClose, onPlace, customerId, walletBalance }: Props) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const availableVendors = MOCK_VENDORS.filter((v) => v.available);
  const total = selectedVendor ? selectedVendor.pricePerJerrican * quantity : 0;

  const handlePlace = () => {
    if (!selectedVendor) { setError("Please select a vendor"); return; }
    if (total > walletBalance) { setError("Insufficient wallet balance. Please top up."); return; }

    const order: Order = {
      id: `ord_${Date.now()}`,
      customerId,
      item: {
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        quantity,
        unitPrice: selectedVendor.pricePerJerrican,
      },
      status: "pending",
      totalAmount: total,
      createdAt: new Date().toISOString(),
    };
    onPlace(order);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#134E4A]">Order Water</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Vendor selection */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Select vendor</p>
          <div className="space-y-2">
            {availableVendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => { setSelectedVendor(vendor); setError(""); }}
                className={`w-full p-3 rounded-2xl border text-left transition ${
                  selectedVendor?.id === vendor.id
                    ? "border-[#134E4A] bg-[#134E4A]/5"
                    : "border-[#D6D3D1] hover:border-[#4FD1C5]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{vendor.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#134E4A]">
                      KSh {vendor.pricePerJerrican}
                    </p>
                    <p className="text-xs text-gray-400">per 20L</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">{vendor.rating}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Number of 20L jerricans</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full border border-[#D6D3D1] flex items-center justify-center text-xl text-[#134E4A] font-medium hover:border-[#4FD1C5] transition"
            >
              −
            </button>
            <span className="text-2xl font-bold text-[#134E4A] w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="w-10 h-10 rounded-full border border-[#D6D3D1] flex items-center justify-center text-xl text-[#134E4A] font-medium hover:border-[#4FD1C5] transition"
            >
              +
            </button>
            <span className="text-sm text-gray-500 ml-1">{quantity * 20}L total</span>
          </div>
        </div>

        {/* Summary */}
        {selectedVendor && (
          <div className="bg-[#FAFAF8] rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{quantity} × KSh {selectedVendor.pricePerJerrican}</span>
              <span>KSh {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[#134E4A] border-t border-[#D6D3D1] pt-2">
              <span>Total</span>
              <span>KSh {total.toLocaleString()}</span>
            </div>
            <p
              className={`text-xs mt-1 ${
                total > walletBalance ? "text-red-500" : "text-gray-400"
              }`}
            >
              Wallet balance: KSh {walletBalance.toLocaleString()}
              {total > walletBalance && " — insufficient funds"}
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handlePlace}
          disabled={!selectedVendor}
          className="w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
