import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Droplets,
  Droplet,
  Flame,
  MapPin,
  Store,
  Trash2,
  Loader2,
  Check,
  ImageOff,
  Navigation,
} from "lucide-react";
import { useVendorStore } from "../../../store/useVendorStore";
import { getCatalog, getBrands, type CatalogItem } from "../../../data/vendorProductCatalog";
import { getCurrentPosition, GEOLOCATION_MESSAGES } from "../../../lib/geolocation";
import type { InventoryCategory } from "../../../types/vendor";

// ─── Types ────────────────────────────────────────────────────────────────

interface DraftItem {
  id: string;
  category: InventoryCategory;
  name: string;
  unit: string;
  price: number;
  stock: number;
  brand?: string;
  variant?: string;
  imageUrl?: string;
}

const STEPS = ["Business info", "Location", "Inventory", "Review"] as const;

/** Small product thumbnail with a graceful fallback if the image is missing. */
function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-10 h-10 rounded-lg bg-white border border-[#D6D3D1] flex items-center justify-center shrink-0">
        <ImageOff className="w-4 h-4 text-gray-300" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 rounded-lg object-cover border border-[#D6D3D1] shrink-0 bg-white"
      onError={() => setFailed(true)}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const updateProfile = useVendorStore((s) => s.updateProfile);
  const addInventoryItem = useVendorStore((s) => s.addInventoryItem);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — business info
  const [businessName, setBusinessName] = useState("");
  const [sellsWater, setSellsWater] = useState(true);
  const [sellsLpg, setSellsLpg] = useState(false);
  const [phone, setPhone] = useState("");

  // Step 2 — location
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(5);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Step 3 — inventory (catalog-driven, same source as the dashboard's Inventory tab)
  const [items, setItems] = useState<DraftItem[]>([]);

  const categories: InventoryCategory[] = [
    ...(sellsWater ? (["water"] as const) : []),
    ...(sellsLpg ? (["lpg"] as const) : []),
  ];
  const [addCategory, setAddCategory] = useState<InventoryCategory>("water");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addError, setAddError] = useState("");

  const activeAddCategory = categories.includes(addCategory) ? addCategory : categories[0];
  const brands = activeAddCategory ? getBrands(activeAddCategory) : [];
  const itemsForBrand = activeAddCategory
    ? getCatalog(activeAddCategory).find((b) => b.brand === selectedBrand)?.items ?? []
    : [];
  const selectedCatalogItem: CatalogItem | undefined = itemsForBrand.find(
    (i) => i.id === selectedItemId
  );

  function handleAddCategoryChange(cat: InventoryCategory) {
    setAddCategory(cat);
    setSelectedBrand("");
    setSelectedItemId("");
    setAddError("");
  }

  function handleBrandChange(brand: string) {
    setSelectedBrand(brand);
    setSelectedItemId("");
  }

  function addCatalogItem() {
    if (!activeAddCategory) return;
    if (!selectedBrand) { setAddError("Select a brand"); return; }
    if (!selectedCatalogItem) { setAddError("Select a size / type"); return; }
    const stock = Number(newStock) || 0;
    const price = Number(newPrice) || 0;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: activeAddCategory,
        name: selectedCatalogItem.label,
        unit: selectedCatalogItem.unit,
        price,
        stock,
        brand: selectedCatalogItem.brand,
        variant: selectedCatalogItem.variant,
        imageUrl: selectedCatalogItem.imageUrl,
      },
    ]);
    setSelectedBrand("");
    setSelectedItemId("");
    setNewStock("");
    setNewPrice("");
    setAddError("");
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleUseMyLocation() {
    setLocating(true);
    setLocationError(null);
    const result = await getCurrentPosition();
    setLocating(false);

    if (!result.ok) {
      setLocationError(GEOLOCATION_MESSAGES[result.reason]);
      return;
    }
    setCoords({ lat: result.coords.latitude, lng: result.coords.longitude });
  }

  function canProceed(): boolean {
    if (step === 0) return businessName.trim().length > 0 && phone.trim().length > 0 && categories.length > 0;
    // Coordinates are required, not optional: without them this business
    // can't appear in any customer's nearby search.
    if (step === 1) return address.trim().length > 0 && area.trim().length > 0 && coords !== null;
    if (step === 2) return items.length > 0;
    return true;
  }

  async function handleFinish() {
    setSubmitting(true);
    // Await this — it creates the business row on first save, and the
    // inventory inserts below need that row's id to exist first.
    await updateProfile({
      businessName,
      phone,
      location: `${address}, ${area}`,
      latitude: coords?.lat,
      longitude: coords?.lng,
      isOpen: true,
    });
    items.forEach((item) => {
      addInventoryItem({
        id: item.id,
        category: item.category,
        name: item.name,
        unit: item.unit,
        pricePerUnit: item.price,
        stock: item.stock,
        maxStock: Math.max(item.stock, 200),
        brand: item.brand,
        variant: item.variant,
        imageUrl: item.imageUrl,
      });
    });
    setSubmitting(false);
    navigate("/vendor/invite");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* ── Header ── */}
      <div className="bg-[#134E4A] px-5 sm:px-8 py-5">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#4FD1C5] flex items-center justify-center">
            <Droplets className="w-5 h-5 text-[#134E4A]" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">MajiLink</span>
        </div>
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  i < step
                    ? "bg-[#4FD1C5] text-[#134E4A]"
                    : i === step
                    ? "bg-white text-[#134E4A]"
                    : "bg-white/15 text-white/50"
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-[#4FD1C5]" : "bg-white/15"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex justify-center px-5 sm:px-8 py-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-[#134E4A] mb-1">{STEPS[step]}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {step === 0 && "Tell us about your business so customers know who they're ordering from."}
            {step === 1 && "Where should we route deliveries and match nearby customers?"}
            {step === 2 && "Add what you sell so customers can order right away. You can edit this anytime."}
            {step === 3 && "Check everything looks right before you go live."}
          </p>

          {/* Step 1 */}
          {step === 0 && (
            <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5 space-y-4">
              <Field label="Business name">
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kilimani Water Depot"
                  className={inputClass}
                />
              </Field>
              <Field label="Contact phone">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className={inputClass}
                />
              </Field>
              <Field label="What do you sell?">
                <div className="flex gap-3">
                  <CategoryToggle
                    icon={Droplet}
                    label="Water"
                    active={sellsWater}
                    onClick={() => setSellsWater((v) => !v)}
                  />
                  <CategoryToggle
                    icon={Flame}
                    label="LPG"
                    active={sellsLpg}
                    onClick={() => setSellsLpg((v) => !v)}
                  />
                </div>
              </Field>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5 space-y-4">
              <Field label="Street / building address">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Argwings Kodhek Rd, next to Yaya Centre"
                  className={inputClass}
                />
              </Field>
              <Field label="Area / neighbourhood">
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Kilimani, Nairobi"
                  className={inputClass}
                />
              </Field>
              <Field label={`Delivery radius — ${deliveryRadiusKm} km`}>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
                  className="w-full accent-[#134E4A]"
                />
              </Field>
              <div className="pt-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pin your location
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className={`w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm text-left transition-colors disabled:opacity-60 ${
                    coords
                      ? "border-[#4FD1C5] bg-[#4FD1C5]/5 text-[#134E4A]"
                      : "border-[#D6D3D1] text-gray-600 hover:border-[#134E4A]"
                  }`}
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  ) : coords ? (
                    <Check className="w-4 h-4 shrink-0 text-[#0F6E56]" />
                  ) : (
                    <Navigation className="w-4 h-4 shrink-0" />
                  )}
                  <span className="flex-1 min-w-0">
                    {locating
                      ? "Finding your location…"
                      : coords
                      ? "Location set — tap to update"
                      : "Use my current location"}
                  </span>
                </button>

                {locationError && (
                  <p className="text-xs text-red-500 mt-1.5">{locationError}</p>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Customers find suppliers by distance, so without this your
                  business won't appear in their search. Set it while you're at
                  your premises.
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — catalog-driven, same source as the dashboard's Inventory tab */}
          {step === 2 && (
            <div className="space-y-5">
              {categories.length > 1 && (
                <div className="flex bg-white border border-[#D6D3D1] rounded-xl p-1 w-fit">
                  {categories.map((cat) => {
                    const Icon = cat === "water" ? Droplet : Flame;
                    return (
                      <button
                        key={cat}
                        onClick={() => handleAddCategoryChange(cat)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeAddCategory === cat
                            ? "bg-[#134E4A] text-white"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat === "water" ? "Water" : "LPG"}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  Add {activeAddCategory === "lpg" ? "an LPG listing" : "a water product"}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">
                      {activeAddCategory === "lpg" ? "Select brand" : "Select product line"}
                    </option>
                    {brands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    disabled={!selectedBrand}
                    className={`${inputClass} disabled:opacity-50`}
                  >
                    <option value="">Select size / type</option>
                    {itemsForBrand.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>

                {selectedCatalogItem && (
                  <div className="flex items-center gap-2.5 bg-[#FAFAF8] border border-[#D6D3D1] rounded-2xl px-3 py-2.5">
                    <ProductThumb src={selectedCatalogItem.imageUrl} alt={selectedCatalogItem.label} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{selectedCatalogItem.label}</p>
                      <p className="text-[11px] text-gray-400">
                        Same image is used for every vendor selling this product
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Starting stock"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Price (KSh)"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {addError && <p className="text-xs text-red-500">{addError}</p>}
                <button
                  onClick={addCatalogItem}
                  className="w-full bg-[#134E4A] text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition"
                >
                  Add item
                </button>
              </div>

              {items.length > 0 && (
                <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <ProductThumb src={item.imageUrl} alt={item.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{item.name}</p>
                        {item.variant && <p className="text-[10px] text-gray-400">{item.variant}</p>}
                      </div>
                      <input
                        value={item.price || ""}
                        onChange={(e) => updateItem(item.id, { price: Number(e.target.value) || 0 })}
                        placeholder="Price"
                        inputMode="numeric"
                        className="w-20 text-sm text-right border border-[#D6D3D1] rounded-lg px-2 py-1"
                      />
                      <input
                        value={item.stock || ""}
                        onChange={(e) => updateItem(item.id, { stock: Number(e.target.value) || 0 })}
                        placeholder="Stock"
                        inputMode="numeric"
                        className="w-16 text-sm text-right border border-[#D6D3D1] rounded-lg px-2 py-1"
                      />
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — review */}
          {step === 3 && (
            <div className="space-y-4">
              <ReviewCard icon={Store} title="Business">
                <p className="text-sm text-gray-700">{businessName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sells: {categories.map((c) => (c === "water" ? "Water" : "LPG")).join(" & ")}
                </p>
              </ReviewCard>
              <ReviewCard icon={MapPin} title="Location">
                <p className="text-sm text-gray-700">{address}</p>
                <p className="text-xs text-gray-400 mt-0.5">{area} · {deliveryRadiusKm}km delivery radius</p>
                {coords && (
                  <p className="text-xs text-[#0F6E56] mt-0.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Location pinned
                  </p>
                )}
              </ReviewCard>
              <ReviewCard icon={Droplets} title={`Inventory (${items.length} items)`}>
                <ul className="text-sm text-gray-700 space-y-2 mt-1">
                  {items.map((i) => (
                    <li key={i.id} className="flex justify-between items-center gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <ProductThumb src={i.imageUrl} alt={i.name} />
                        <span className="truncate">{i.name}</span>
                      </span>
                      <span className="text-gray-400 shrink-0">KSh {i.price} · stock {i.stock}</span>
                    </li>
                  ))}
                </ul>
              </ReviewCard>
            </div>
          )}

          {/* ── Nav buttons ── */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm font-medium text-gray-500 disabled:opacity-0 px-4 py-2.5"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="bg-[#134E4A] hover:bg-[#0D3633] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-6 py-2.5 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="bg-[#134E4A] hover:bg-[#0D3633] disabled:opacity-60 text-white text-sm font-semibold rounded-xl px-6 py-2.5 flex items-center gap-2 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Setting up your store…" : "Go live"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small pieces ────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-[#D6D3D1] bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/40 focus:border-[#4FD1C5] transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function CategoryToggle({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Droplet;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-[#134E4A] bg-[#134E4A]/5 text-[#134E4A]"
          : "border-[#D6D3D1] text-gray-500"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ReviewCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Store;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5">
      <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}
