# MajiLink – Customer Dashboard Module

## File structure

```
src/
├── types/
│   └── index.ts                  # All shared TypeScript types
├── data/
│   └── mockData.ts               # localStorage seed data
├── store/
│   └── useCustomerStore.ts       # Zustand store (persisted to localStorage)
└── components/
    └── customer/
        ├── CustomerDashboard.tsx  # Main dashboard page
        ├── OrderTracker.tsx       # Active order progress rail + driver card
        ├── TopUpModal.tsx         # Wallet top-up sheet
        └── PlaceOrderModal.tsx    # New order flow (vendor select + quantity)
```

## Usage

Drop `CustomerDashboard` into your router:

```tsx
// App.tsx / router config
import CustomerDashboard from "./components/customer/CustomerDashboard";

<Route path="/customer" element={<CustomerDashboard />} />
```

## Zustand store

The store is persisted to `localStorage` under the key `majilink-customer`.
To reset it during development:

```js
localStorage.removeItem("majilink-customer");
```

## Supabase migration (later)

When ready, replace the `persist` middleware storage with Supabase calls:

1. `getActiveOrder` / `getRecentOrders` → `supabase.from("orders").select()`
2. `placeOrder` → `supabase.from("orders").insert()`
3. `cancelOrder` → `supabase.from("orders").update({ status: "cancelled" })`
4. `topUpWallet` → trigger M-Pesa STK push → update `profiles.wallet_balance`

## Dependencies

```bash
npm install zustand lucide-react
```



