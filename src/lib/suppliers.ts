import { supabase } from "./supabase";
import { haversineKm } from "./geo";
import type { VendorProfile, InventoryItem, InventoryCategory } from "../types/vendor";

export interface Supplier {
  profile: VendorProfile;
  inventory: InventoryItem[];
  /** null when the supplier has no coordinates saved — distance is
   *  genuinely unknown, not zero. */
  distanceKm: number | null;
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function mapProduct(row: any): InventoryItem {
  return {
    id: String(row.id),
    category: (row.category as InventoryCategory) ?? "water",
    name: row.name,
    stock: row.stock,
    maxStock: row.max_stock,
    pricePerUnit: row.price_per_unit,
    unit: row.unit,
    variant: row.variant ?? undefined,
    brand: row.brand ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

/**
 * Fetch suppliers with their inventory, sorted by distance from the
 * customer.
 *
 * Distance is filtered in JavaScript rather than SQL. That's fine at
 * current scale (tens of vendors) but it does mean every business row is
 * pulled on each search — worth moving to PostGIS / an RPC with an
 * earthdistance index before this list gets long.
 */
export async function fetchNearbySuppliers(
  customerLat: number | null,
  customerLng: number | null,
  radiusKm: number | null = null
): Promise<Supplier[]> {
  let data: any[] | null = null;

  try {
    const result = await supabase
      .from("businesses")
      .select(
        `
      id, business_name, location, latitude, longitude, is_open, rating, owner_id,
      product ( id, name, unit, price_per_unit, stock, max_stock, category, brand, variant, image_url )
    `
      );

    if (result.error) {
      console.error("Failed to load suppliers:", result.error);
      return [];
    }
    data = result.data;
  } catch (err) {
    // A network-level failure (not a query-level one) throws instead of
    // returning {error} — most likely on the very first request after a
    // paused Supabase project wakes back up. Returning [] here rather
    // than letting this propagate means a caller that forgets to catch
    // can never hang on this specific failure mode again — though
    // SupplierSearch's own catch is still the real fix for its loading
    // state.
    console.error("Supplier search request failed:", err);
    return [];
  }

  const suppliers: Supplier[] = (data ?? []).map((row: any) => {
    const hasCoords =
      customerLat != null &&
      customerLng != null &&
      row.latitude != null &&
      row.longitude != null;

    return {
      profile: {
        id: String(row.id),
        businessName: row.business_name,
        ownerName: "",
        phone: "",
        location: row.location ?? "",
        latitude: row.latitude ?? 0,
        longitude: row.longitude ?? 0,
        isOpen: row.is_open,
        rating: row.rating ?? 0,
        avatarInitials: initials(row.business_name),
      },
      inventory: (row.product ?? []).map(mapProduct),
      distanceKm: hasCoords
        ? haversineKm(customerLat!, customerLng!, row.latitude, row.longitude)
        : null,
    };
  });

  // Only suppliers with something to sell are worth showing.
  const stocked = suppliers.filter((s) => s.inventory.length > 0);

  const withinRadius =
    radiusKm == null
      ? stocked
      : stocked.filter(
          // Keep unknown-distance suppliers rather than silently hiding
          // them — a vendor who hasn't set coordinates would otherwise be
          // invisible to every customer, which looks like the app being
          // broken rather than a missing setting.
          (s) => s.distanceKm == null || s.distanceKm <= radiusKm
        );

  return withinRadius.sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1; // unknown distance sorts last
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}
