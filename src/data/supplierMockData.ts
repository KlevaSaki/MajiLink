import type { VendorProfile, InventoryItem, InventoryCategory } from "../types/vendor";
import { findCatalogItem } from "./vendorProductCatalog";
import { MOCK_VENDOR_PROFILE, MOCK_INVENTORY } from "./vendorMockData";

export interface Supplier {
  profile: VendorProfile;
  inventory: InventoryItem[];
}

/** Build an InventoryItem from a catalog entry (guarantees the shared image/name are used). */
function fromCatalog(
  category: InventoryCategory,
  catalogId: string,
  id: string,
  stock: number,
  price: number
): InventoryItem {
  const item = findCatalogItem(category, catalogId);
  if (!item) throw new Error(`Unknown catalog item: ${category}/${catalogId}`);
  return {
    id,
    category,
    name: item.label,
    stock,
    maxStock: Math.max(stock, 200),
    pricePerUnit: price,
    unit: item.unit,
    variant: item.variant,
    brand: item.brand,
    imageUrl: item.imageUrl,
  };
}

export const MOCK_SUPPLIERS: Supplier[] = [
  // Reuse the vendor's own live profile + inventory so the customer- and
  // vendor-side demos stay in sync with each other.
  {
    profile: MOCK_VENDOR_PROFILE,
    inventory: MOCK_INVENTORY,
  },
  {
    profile: {
      id: "vnd_002",
      businessName: "Uasin Springs",
      ownerName: "Faith Chebet",
      phone: "+254722556677",
      location: "Langas, Eldoret",
      latitude: 0.487,
      longitude: 35.26,
      isOpen: true,
      rating: 4.5,
      avatarInitials: "US",
    },
    inventory: [
      fromCatalog("water", "dasani-500ml", "sup2_inv_001", 120, 60),
      fromCatalog("water", "dasani-1l", "sup2_inv_002", 90, 100),
      fromCatalog("water", "dasani-20l", "sup2_inv_003", 45, 350),
      fromCatalog("water", "refill-water-20l", "sup2_inv_004", 70, 180),
    ],
  },
  {
    profile: {
      id: "vnd_003",
      businessName: "Eldoret Water Co.",
      ownerName: "Brian Kiptoo",
      phone: "+254733889900",
      location: "Huruma, Eldoret",
      latitude: 0.53,
      longitude: 35.305,
      isOpen: false,
      rating: 4.2,
      avatarInitials: "EW",
    },
    inventory: [
      fromCatalog("water", "dasani-5l", "sup3_inv_001", 60, 250),
      fromCatalog("water", "refill-water-20l", "sup3_inv_002", 30, 190),
    ],
  },
  {
    profile: {
      id: "vnd_004",
      businessName: "Rift Valley Gas Depot",
      ownerName: "Dennis Kiplagat",
      phone: "+254744112233",
      location: "Kapsoya, Eldoret",
      latitude: 0.5,
      longitude: 35.29,
      isOpen: true,
      rating: 4.7,
      avatarInitials: "RV",
    },
    inventory: [
      fromCatalog("lpg", "k-gas-6kg-refill", "sup4_inv_001", 25, 1200),
      fromCatalog("lpg", "k-gas-3kg-refill", "sup4_inv_002", 40, 650),
      fromCatalog("lpg", "total-6kg-refill", "sup4_inv_003", 18, 1250),
      fromCatalog("lpg", "rubis-6kg-new", "sup4_inv_004", 10, 4200),
      fromCatalog("lpg", "gas-pipe", "sup4_inv_005", 50, 250),
      fromCatalog("lpg", "gas-burner", "sup4_inv_006", 22, 800),
    ],
  },
];
