import { useEffect, useMemo, useState } from "react";
import {
  X,
  MapPin,
  Star,
  ChevronLeft,
  Droplet,
  ImageOff,
  Loader2,
  Navigation,
} from "lucide-react";
import { fetchNearbySuppliers, type Supplier } from "../../../lib/suppliers";
import { getCurrentPosition, GEOLOCATION_MESSAGES } from "../../../lib/geolocation";
import { useCustomerStore } from "../../../store/useCustomerStore";
import type { InventoryCategory, InventoryItem } from "../../../types/vendor";
import type { Order } from "../../../types/index";
import PlaceOrderModal from "./PlaceOrderModal";

interface Props {
  onClose: () => void;
  onPlace: (order: Order) => Promise<Order>;
  customerId: string;
  customerLat: number;
  customerLng: number;
}

type CategoryFilter = "all" | InventoryCategory;

const RADIUS_OPTIONS = [5, 10, 25, null] as const; // null = no limit

function CatalogThumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-full h-20 rounded-xl bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-gray-300" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-20 rounded-xl object-cover border border-[#D6D3D1]"
      onError={() => setFailed(true)}
    />
  );
}

function formatDistance(km: number | null): string {
  if (km == null) return "Distance unknown";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function SupplierSearch({
  onClose,
  onPlace,
  customerId,
  customerLat,
  customerLng,
}: Props) {
  const setDeliveryLocation = useCustomerStore((s) => s.setDeliveryLocation);

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [radiusKm, setRadiusKm] = useState<number | null>(10);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
  const [orderingItem, setOrderingItem] = useState<InventoryItem | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);

  const hasLocation = customerLat !== 0 || customerLng !== 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSearchError(null);

    // fetchNearbySuppliers only turns a query-level failure into
    // {error}; a network-level failure (including, per this project's
    // history, the first request after a paused Supabase project wakes
    // back up) makes the underlying fetch() reject instead. Without a
    // catch here, that rejection went unhandled and loading stayed true
    // forever — exactly the "hangs until I refresh" bug this fixes.
    // Belt and braces: fetchNearbySuppliers and its own try/catch should
    // always settle, but a genuinely stuck connection (neither resolves
    // nor rejects) is still possible. Racing against a hard timeout means
    // even that case can't leave the spinner running forever.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 12000)
    );

    Promise.race([
      fetchNearbySuppliers(
        hasLocation ? customerLat : null,
        hasLocation ? customerLng : null,
        hasLocation ? radiusKm : null
      ),
      timeout,
    ])
      .then((result) => {
        if (cancelled) return;
        setSuppliers(result as Supplier[]);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Supplier search failed:", err);
        setLoading(false);
        setSearchError(
          "That took too long — the connection may still be waking up. Try again."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [customerLat, customerLng, radiusKm, hasLocation, searchAttempt]);

  async function handleUseMyLocation() {
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

  const visibleSuppliers = useMemo(
    () =>
      suppliers.filter(
        (s) => category === "all" || s.inventory.some((i) => i.category === category)
      ),
    [suppliers, category]
  );

  // ─── Supplier detail ────────────────────────────────────────────────────
  if (activeSupplier) {
    const itemsToShow = activeSupplier.inventory.filter(
      (i) => category === "all" || i.category === category
    );

    return (
      <div className="fixed inset-0 bg-[#FAFAF8] z-50 overflow-y-auto">
        <div className="bg-[#134E4A] text-white px-5 pt-safe-top pb-6 rounded-b-[2rem]">
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setActiveSupplier(null)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              aria-label="Back to search"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{activeSupplier.profile.businessName}</p>
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {activeSupplier.profile.location}
                  {activeSupplier.distanceKm != null &&
                    ` · ${formatDistance(activeSupplier.distanceKm)} away`}
                </span>
              </p>
            </div>
            {activeSupplier.profile.rating > 0 && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                {activeSupplier.profile.rating}
              </div>
            )}
          </div>
          {!activeSupplier.profile.isOpen && (
            <p className="text-xs text-[#FDE68A] bg-white/10 rounded-xl px-3 py-1.5 mt-3 inline-block">
              Currently closed — orders may be delayed
            </p>
          )}
        </div>

        <div className="px-5 py-5 grid grid-cols-2 gap-3 pb-10">
          {itemsToShow.map((item) => (
            <button
              key={item.id}
              onClick={() => setOrderingItem(item)}
              disabled={item.stock === 0}
              className="bg-white border border-[#D6D3D1] rounded-2xl p-3 text-left space-y-2 hover:border-[#4FD1C5] transition disabled:opacity-40"
            >
              <CatalogThumb src={item.imageUrl} alt={item.name} />
              <div>
                <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                {item.variant && <p className="text-[10px] text-gray-400">{item.variant}</p>}
                <p className="text-sm font-semibold text-[#134E4A] mt-1">
                  KSh {item.pricePerUnit}
                </p>
                <p className="text-[11px] text-gray-400">
                  {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                </p>
              </div>
            </button>
          ))}
          {itemsToShow.length === 0 && (
            <p className="col-span-2 text-sm text-gray-400 text-center py-10">
              No {category === "lpg" ? "LPG" : "water"} products listed by this supplier
            </p>
          )}
        </div>

        {orderingItem && (
          <PlaceOrderModal
            supplier={activeSupplier.profile}
            item={orderingItem}
            customerId={customerId}
            onPlace={onPlace}
            onClose={() => setOrderingItem(null)}
            onDone={() => {
              setOrderingItem(null);
              onClose();
            }}
          />
        )}
      </div>
    );
  }

  // ─── Search / list ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#FAFAF8] z-50 overflow-y-auto">
      <div className="bg-[#134E4A] text-white px-5 pt-safe-top pb-5 rounded-b-[2rem]">
        <div className="flex items-center justify-between pt-4 pb-4">
          <h2 className="font-bold text-lg">Find a supplier</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location — the whole search depends on it, so it's stated plainly */}
        <button
          onClick={handleUseMyLocation}
          disabled={locating}
          className="w-full flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-3 py-2.5 text-sm text-left disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 shrink-0" />
          )}
          <span className="flex-1 min-w-0">
            {locating
              ? "Finding your location…"
              : hasLocation
              ? "Sorted by distance from you — tap to update"
              : "Set your location to see nearby suppliers"}
          </span>
        </button>

        {locationError && (
          <p className="text-xs text-[#FDE68A] mt-2">{locationError}</p>
        )}

        {/* Category */}
        <div className="flex gap-2 mt-4">
          {(["all", "water", "lpg"] as CategoryFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                category === c ? "bg-[#4FD1C5] text-[#134E4A]" : "bg-white/10 text-white/70"
              }`}
            >
              {c === "all" ? "All" : c === "water" ? "Water" : "LPG"}
            </button>
          ))}
        </div>

        {/* Radius — only meaningful once we know where they are */}
        {hasLocation && (
          <div className="flex gap-2 mt-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={String(r)}
                onClick={() => setRadiusKm(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
                  radiusKm === r ? "bg-white text-[#134E4A]" : "bg-white/10 text-white/60"
                }`}
              >
                {r == null ? "Any distance" : `${r} km`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-5 space-y-3 pb-10">
        {searchError ? (
          <div className="text-center py-12 px-6">
            <p className="text-sm text-gray-500">{searchError}</p>
            <button
              onClick={() => setSearchAttempt((n) => n + 1)}
              className="text-sm text-[#134E4A] font-medium mt-3 bg-[#FAFAF8] border border-[#D6D3D1] rounded-full px-4 py-2"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <Loader2 className="w-5 h-5 text-[#134E4A] animate-spin" />
            <p className="text-sm text-gray-400">Finding suppliers…</p>
          </div>
        ) : visibleSuppliers.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-sm text-gray-500">
              {hasLocation
                ? `No suppliers${radiusKm ? ` within ${radiusKm} km` : ""} with ${
                    category === "all" ? "stock" : category === "lpg" ? "LPG" : "water"
                  } right now.`
                : "No suppliers found."}
            </p>
            {hasLocation && radiusKm != null && (
              <button
                onClick={() => setRadiusKm(null)}
                className="text-sm text-[#134E4A] font-medium mt-2"
              >
                Search any distance
              </button>
            )}
          </div>
        ) : (
          visibleSuppliers.map((s) => (
            <button
              key={s.profile.id}
              onClick={() => setActiveSupplier(s)}
              className="w-full bg-white border border-[#D6D3D1] rounded-3xl p-4 text-left hover:border-[#4FD1C5] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#4FD1C5]/20 flex items-center justify-center shrink-0">
                    <Droplet className="w-5 h-5 text-[#134E4A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#134E4A] truncate">
                      {s.profile.businessName}
                    </p>
                    {s.profile.location && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.profile.location}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {s.profile.rating > 0 && (
                        <>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-500">{s.profile.rating}</span>
                        </>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {s.inventory.length} item{s.inventory.length === 1 ? "" : "s"}
                      </span>
                      {!s.profile.isOpen && (
                        <span className="text-[10px] text-red-500 ml-1.5">Closed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#134E4A]">
                    {s.distanceKm != null ? formatDistance(s.distanceKm) : "—"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {s.distanceKm != null ? "away" : "no location"}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
