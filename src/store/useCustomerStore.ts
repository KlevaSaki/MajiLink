import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Order, User, WalletState, MonthlyStats } from "../types/index";
import { MOCK_USER, MOCK_WALLET, MOCK_ORDERS } from "../data/mockData";

interface CustomerStore {
  // State
  user: User;
  wallet: WalletState;
  orders: Order[];
  isNotifOpen: boolean;

  // Computed helpers (called as functions)
  getActiveOrder: () => Order | undefined;
  getRecentOrders: () => Order[];
  getMonthlyStats: () => MonthlyStats;

  // Actions
  topUpWallet: (amount: number) => void;
  placeOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => void;
  toggleNotif: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      user: MOCK_USER,
      wallet: MOCK_WALLET,
      orders: MOCK_ORDERS,
      isNotifOpen: false,

      getActiveOrder: () => {
        return get().orders.find(
          (o) => o.status === "pending" || o.status === "confirmed" || o.status === "en_route"
        );
      },

      getRecentOrders: () => {
        return get()
          .orders.filter((o) => o.status === "delivered" || o.status === "cancelled")
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      },

      getMonthlyStats: (): MonthlyStats => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyOrders = get().orders.filter(
          (o) =>
            o.status === "delivered" &&
            new Date(o.createdAt) >= monthStart
        );
        return {
          totalLitres: monthlyOrders.reduce((sum, o) => sum + o.item.quantity * 20, 0),
          totalOrders: monthlyOrders.length,
          totalSpent: monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        };
      },

      topUpWallet: (amount: number) => {
        set((state) => ({
          wallet: { ...state.wallet, balance: state.wallet.balance + amount },
        }));
      },

      placeOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders],
          wallet: {
            ...state.wallet,
            balance: state.wallet.balance - order.totalAmount,
          },
        }));
      },

      cancelOrder: (orderId: string) => {
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const refund = order ? order.totalAmount : 0;
          return {
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, status: "cancelled" as const } : o
            ),
            wallet: {
              ...state.wallet,
              balance: state.wallet.balance + refund,
            },
          };
        });
      },

      toggleNotif: () => {
        set((state) => ({ isNotifOpen: !state.isNotifOpen }));
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },
    }),
    {
      name: "majilink-customer",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
