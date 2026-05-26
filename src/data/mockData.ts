import type { User, Order, Vendor, WalletState } from "../types/index";

export const MOCK_USER: User = {
  id: "usr_001",
  fullName: "Jane Muthoni",
  email: "jane.muthoni@gmail.com",
  phone: "+254712345678",
  role: "customer",
  avatarInitials: "JM",
  location: "Eldoret, Uasin Gishu",
};

export const MOCK_WALLET: WalletState = {
  balance: 1250,
  bonusCredit: 200,
};

export const MOCK_VENDORS: Vendor[] = [
  {
    id: "vnd_001",
    name: "Maji Fresh Vendors",
    location: "Eldoret Town",
    rating: 4.8,
    pricePerJerrican: 200,
    available: true,
  },
  {
    id: "vnd_002",
    name: "Uasin Springs",
    location: "Langas, Eldoret",
    rating: 4.5,
    pricePerJerrican: 180,
    available: true,
  },
  {
    id: "vnd_003",
    name: "Eldoret Water Co.",
    location: "Huruma, Eldoret",
    rating: 4.2,
    pricePerJerrican: 200,
    available: false,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord_001",
    customerId: "usr_001",
    item: {
      vendorId: "vnd_001",
      vendorName: "Maji Fresh Vendors",
      quantity: 2,
      unitPrice: 200,
    },
    status: "en_route",
    driver: {
      id: "drv_001",
      name: "Kipchoge Otieno",
      initials: "KO",
      phone: "+254798765432",
      vehicle: "Boda boda",
      etaMinutes: 12,
    },
    totalAmount: 400,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ord_002",
    customerId: "usr_001",
    item: {
      vendorId: "vnd_001",
      vendorName: "Maji Fresh Vendors",
      quantity: 3,
      unitPrice: 200,
    },
    status: "delivered",
    totalAmount: 600,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  },
  {
    id: "ord_003",
    customerId: "usr_001",
    item: {
      vendorId: "vnd_002",
      vendorName: "Uasin Springs",
      quantity: 1,
      unitPrice: 180,
    },
    status: "delivered",
    totalAmount: 180,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
  },
  {
    id: "ord_004",
    customerId: "usr_001",
    item: {
      vendorId: "vnd_003",
      vendorName: "Eldoret Water Co.",
      quantity: 2,
      unitPrice: 200,
    },
    status: "cancelled",
    totalAmount: 400,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
