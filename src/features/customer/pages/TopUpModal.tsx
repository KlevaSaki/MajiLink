import { useState } from "react";
import { X } from "lucide-react";

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

interface Props {
  onClose: () => void;
  onTopUp: (amount: number) => void;
}

export default function TopUpModal({ onClose, onTopUp }: Props) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    const num = parseInt(amount, 10);
    if (!num || num < 50) {
      setError("Minimum top-up is KSh 50");
      return;
    }
    onTopUp(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#134E4A]">Top Up Wallet</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Quick select</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => { setAmount(String(a)); setError(""); }}
                className={`py-2 rounded-xl text-sm font-medium border transition ${
                  amount === String(a)
                    ? "bg-[#134E4A] text-white border-[#134E4A]"
                    : "border-[#D6D3D1] text-gray-600 hover:border-[#4FD1C5]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            Or enter amount (KSh)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            placeholder="e.g. 750"
            className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] text-sm"
          />
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>

        {/* M-Pesa note */}
        <p className="text-xs text-gray-400 bg-[#FAFAF8] rounded-xl px-3 py-2">
          💳 In production, this will trigger an M-Pesa STK push to your registered number.
        </p>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition"
        >
          Top Up KSh {amount ? parseInt(amount).toLocaleString() : "—"}
        </button>
      </div>
    </div>
  );
}
