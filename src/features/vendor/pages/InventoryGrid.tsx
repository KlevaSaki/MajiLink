import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X, Check, ImageOff } from "lucide-react";
import type { InventoryItem, InventoryCategory } from "../../../types/vendor";
import { getCatalog, type CatalogItem } from "../../../data/vendorProductCatalog";

interface Props {
  category: InventoryCategory;
  inventory: InventoryItem[];
  onUpdateStock: (id: string, stock: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onAdd: (item: InventoryItem) => void;
  onRemove: (id: string) => void;
}

function StockBar({ stock, maxStock }: { stock: number; maxStock: number }) {
  const pct = Math.min(100, (stock / maxStock) * 100);
  const color =
    pct < 20 ? "bg-red-400" : pct < 40 ? "bg-yellow-400" : "bg-[#134E4A]";
  return (
    <div className="h-1 bg-[#E8E6E0] rounded-full mt-2">
      <div
        className={`h-1 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Small product thumbnail with a graceful fallback if the image is missing. */
function ProductThumb({ src, alt, size = "w-8 h-8" }: { src?: string; alt: string; size?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`${size} rounded-lg bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center shrink-0`}>
        <ImageOff className="w-3.5 h-3.5 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-lg object-cover shrink-0 bg-[#FAFAF8] border border-[#D6D3D1]`}
      onError={() => setFailed(true)}
    />
  );
}

interface EditState {
  stock: string;
  price: string;
}

export default function InventoryGrid({
  category,
  inventory,
  onUpdateStock,
  onUpdatePrice,
  onAdd,
  onRemove,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ stock: "", price: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState("");

  // Catalog-driven selection: brand first, then the specific item (which
  // carries the size/variant and the shared image).
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const catalog = getCatalog(category);
  const itemsForBrand = catalog.find((b) => b.brand === selectedBrand)?.items ?? [];
  const selectedCatalogItem: CatalogItem | undefined = itemsForBrand.find(
    (i) => i.id === selectedItemId
  );

  // Reset the picker whenever the category tab changes so a leftover LPG
  // brand can't get carried into the water form (or vice versa).
  useEffect(() => {
    setShowAddForm(false);
    setSelectedBrand("");
    setSelectedItemId("");
    setNewStock("");
    setNewPrice("");
    setAddError("");
  }, [category]);

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditState({ stock: String(item.stock), price: String(item.pricePerUnit) });
  }

  function saveEdit(item: InventoryItem) {
    const stock = parseInt(editState.stock, 10);
    const price = parseInt(editState.price, 10);
    if (!isNaN(stock)) onUpdateStock(item.id, stock);
    if (!isNaN(price)) onUpdatePrice(item.id, price);
    setEditingId(null);
  }

  function handleAdd() {
    if (!selectedBrand) {
      setAddError(category === "lpg" ? "Select a brand" : "Select a product line");
      return;
    }
    if (!selectedCatalogItem) {
      setAddError("Select a size / type");
      return;
    }
    const stock = parseInt(newStock, 10);
    const price = parseInt(newPrice, 10);
    if (isNaN(stock) || stock < 0) {
      setAddError("Enter a valid stock number");
      return;
    }
    if (isNaN(price) || price < 1) {
      setAddError("Enter a valid price");
      return;
    }

    onAdd({
      id: `inv_${Date.now()}`,
      category,
      name: selectedCatalogItem.label,
      stock,
      maxStock: Math.max(stock, 200),
      pricePerUnit: price,
      unit: selectedCatalogItem.unit,
      variant: selectedCatalogItem.variant,
      brand: selectedCatalogItem.brand,
      imageUrl: selectedCatalogItem.imageUrl,
    });

    setSelectedBrand("");
    setSelectedItemId("");
    setNewStock("");
    setNewPrice("");
    setAddError("");
    setShowAddForm(false);
  }

  return (
    <div className="space-y-3">
      {/* Single column on mobile so each product takes the full width of the
          screen; two columns from sm: up. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {inventory.map((item) => {
          const isEditing = editingId === item.id;
          const isLow = item.stock / item.maxStock < 0.2;

          return (
            <div
              key={item.id}
              className="bg-white border border-[#D6D3D1] rounded-2xl p-3.5 space-y-1"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 pr-2">
                  <ProductThumb src={item.imageUrl} alt={item.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-[10px] text-gray-400">{item.variant}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="w-6 h-6 rounded-lg border border-[#D6D3D1] flex items-center justify-center hover:border-[#4FD1C5] transition"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="w-6 h-6 rounded-lg border border-[#D6D3D1] flex items-center justify-center hover:border-red-300 transition"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3 h-3 text-gray-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(item)}
                        className="w-6 h-6 rounded-lg bg-[#134E4A] flex items-center justify-center"
                        aria-label="Save"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-6 h-6 rounded-lg border border-[#D6D3D1] flex items-center justify-center"
                        aria-label="Cancel"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stock */}
              {isEditing ? (
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] text-gray-400">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={editState.stock}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, stock: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#D6D3D1] px-2 py-1.5 text-sm bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">
                      Price (KSh)
                    </label>
                    <input
                      type="number"
                      value={editState.price}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, price: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#D6D3D1] px-2 py-1.5 text-sm bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold text-[#134E4A] leading-none">
                    {item.stock.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      {item.unit}
                    </span>
                  </p>
                  <StockBar stock={item.stock} maxStock={item.maxStock} />
                  <p
                    className={`text-xs mt-1 ${
                      isLow ? "text-red-500" : "text-[#0F6E56]"
                    }`}
                  >
                    KSh {item.pricePerUnit} / {item.unit.replace(/s$/, "")}
                    {isLow && " · Low stock"}
                  </p>
                </>
              )}
            </div>
          );
        })}

        {/* Add product tile — full width on mobile, its own cell from sm: up */}
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-white border border-dashed border-[#C5C3BB] rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 hover:border-[#4FD1C5] transition min-h-25"
        >
          <div className="w-7 h-7 rounded-full bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center">
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-xs text-gray-400">
            Add {category === "lpg" ? "cylinder" : "product"}
          </span>
        </button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <div className="bg-white border border-[#D6D3D1] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#134E4A]">
              {category === "lpg" ? "New LPG listing" : "New water listing"}
            </p>
            <button onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedItemId("");
                }}
                className="w-full rounded-2xl border border-[#D6D3D1] px-3 py-2.5 text-sm bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
              >
                <option value="">
                  {category === "lpg" ? "Select brand" : "Select product line"}
                </option>
                {catalog.map((b) => (
                  <option key={b.brand} value={b.brand}>
                    {b.brand}
                  </option>
                ))}
              </select>

              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                disabled={!selectedBrand}
                className="w-full rounded-2xl border border-[#D6D3D1] px-3 py-2.5 text-sm bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] disabled:opacity-50"
              >
                <option value="">Select size / type</option>
                {itemsForBrand.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedCatalogItem && (
              <div className="flex items-center gap-2.5 bg-[#FAFAF8] border border-[#D6D3D1] rounded-2xl px-3 py-2.5">
                <ProductThumb src={selectedCatalogItem.imageUrl} alt={selectedCatalogItem.label} size="w-10 h-10" />
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
                placeholder="Stock quantity"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full rounded-2xl border border-[#D6D3D1] px-3 py-2.5 text-sm bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
              />
              <input
                type="number"
                placeholder="Price (KSh)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full rounded-2xl border border-[#D6D3D1] px-3 py-2.5 text-sm bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
              />
            </div>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <button
            onClick={handleAdd}
            className="w-full bg-[#134E4A] text-white rounded-2xl py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            {category === "lpg" ? "Add cylinder" : "Add product"}
          </button>
        </div>
      )}
    </div>
  );
}
