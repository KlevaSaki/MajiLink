import { Star } from "lucide-react";
import type { RatingBreakdown } from "../../../types/driver";

interface Props {
  rating: number;
  totalReviews: number;
  breakdown: RatingBreakdown;
}

export default function RatingCard({ rating, totalReviews, breakdown }: Props) {
  const bars: { label: number; pct: number }[] = [
    { label: 5, pct: breakdown.five },
    { label: 4, pct: breakdown.four },
    { label: 3, pct: breakdown.three },
    { label: 2, pct: breakdown.two },
    { label: 1, pct: breakdown.one },
  ];

  const barColor = (pct: number) =>
    pct >= 60 ? "bg-[#134E4A]" : pct >= 20 ? "bg-[#4FD1C5]" : "bg-red-400";

  return (
    <div className="bg-white border border-[#D6D3D1] rounded-2xl p-4 flex items-center gap-5">
      {/* Score */}
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold text-[#134E4A] leading-none">
          {rating.toFixed(1)}
        </p>
        <div className="flex items-center justify-center gap-0.5 my-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-3.5 h-3.5 ${
                n <= Math.round(rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-200 fill-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">{totalReviews} reviews</p>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-[#F0EFED]" />

      {/* Breakdown */}
      <div className="flex-1 space-y-1.5 min-w-0">
        {bars.map(({ label, pct }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-3 shrink-0">
              {label}
            </span>
            <div className="flex-1 h-1.5 bg-[#F0EFED] rounded-full overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${barColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 w-7 text-right shrink-0">
              {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
