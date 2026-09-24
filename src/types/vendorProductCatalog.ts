import type { InventoryCategory } from "../types/vendor";

/**
 * Shared product catalog.
 *
 * The point of this file is that every vendor selling "K-gas 6kg" or
 * "Dasani 1L" shows the exact same product image — vendors pick from a
 * fixed list instead of typing a free-text name, so images stay
 * consistent across the whole marketplace.
 *
 * Image paths below are placeholders (`/product-images/...`). Drop the
 * real photos into `public/product-images/...` using these exact
 * filenames, or swap `imageUrl` for hosted URLs — nothing else in the
 * app needs to change.
 */

export type LpgVariant = "Refill" | "New cylinder + gas";

export interface CatalogItem {
  /** Stable id — also used as the React key when listing options */
  id: string;
  /** Brand / product line, e.g. "K-gas", "Dasani", "Accessories" */
  brand: string;
  /** Full display name shown to the vendor and, later, the customer */
  label: string;
  /** Unit used for stock counts, e.g. "cylinder", "bottle", "piece" */
  unit: string;
  /** Shared image — same for every vendor selling this exact product */
  imageUrl: string;
  /** Only set for LPG cylinders */
  variant?: LpgVariant;
}

export interface CatalogBrand {
  brand: string;
  items: CatalogItem[];
}

// ─── Water ──────────────────────────────────────────────────────────────────

export const WATER_CATALOG: CatalogBrand[] = [
  {
    brand: "Dasani",
    items: [
      {
        id: "dasani-500ml",
        brand: "Dasani",
        label: "Dasani 500ml",
        unit: "bottle",
        imageUrl: "/product-images/water/dasani-500ml.png",
      },
      {
        id: "dasani-1l",
        brand: "Dasani",
        label: "Dasani 1L",
        unit: "bottle",
        imageUrl: "/product-images/water/dasani-1l.png",
      },
      {
        id: "dasani-5l",
        brand: "Dasani",
        label: "Dasani 5L",
        unit: "bottle",
        imageUrl: "/product-images/water/dasani-5l.png",
      },
      {
        id: "dasani-20l",
        brand: "Dasani",
        label: "Dasani 20L",
        unit: "bottle",
        imageUrl: "/product-images/water/dasani-20l.png",
      },
    ],
  },
  {
    brand: "Refill",
    items: [
      {
        id: "refill-water-20l",
        brand: "Refill",
        label: "Refilling Water 20L",
        unit: "jerrican",
        imageUrl: "/product-images/water/refill-20l.png",
      },
    ],
  },
];

// ─── LPG ────────────────────────────────────────────────────────────────────

const LPG_BRANDS = ["K-gas", "Total", "Rubis", "Hass", "Afrigas"] as const;
const LPG_SIZES = ["3kg", "6kg"] as const;
const LPG_VARIANTS: LpgVariant[] = ["Refill", "New cylinder + gas"];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildLpgCylinderBrands(): CatalogBrand[] {
  return LPG_BRANDS.map((brand) => ({
    brand,
    items: LPG_SIZES.flatMap((size) =>
      LPG_VARIANTS.map((variant) => ({
        id: `${slugify(brand)}-${size}-${variant === "Refill" ? "refill" : "new"}`,
        brand,
        label: `${brand} ${size}${variant === "New cylinder + gas" ? " (New cylinder + gas)" : ""}`,
        unit: "cylinder",
        // Same image for every brand at a given size — cylinders look the
        // same regardless of brand, so the size is what determines the photo.
        imageUrl: `/product-images/lpg/${size}.png`,
        variant,
      }))
    ),
  }));
}

const LPG_ACCESSORIES: CatalogBrand = {
  brand: "Accessories",
  items: [
    {
      id: "gas-pipe",
      brand: "Accessories",
      label: "Gas Pipe",
      unit: "piece",
      imageUrl: "/product-images/lpg/gas-pipe.png",
    },
    {
      id: "gas-burner",
      brand: "Accessories",
      label: "Gas Burner",
      unit: "piece",
      imageUrl: "/product-images/lpg/gas-burner.png",
    },
  ],
};

export const LPG_CATALOG: CatalogBrand[] = [...buildLpgCylinderBrands(), LPG_ACCESSORIES];

// ─── Lookup helper ──────────────────────────────────────────────────────────

export function getCatalog(category: InventoryCategory): CatalogBrand[] {
  return category === "water" ? WATER_CATALOG : LPG_CATALOG;
}
