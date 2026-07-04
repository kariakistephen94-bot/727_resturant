import type { CartItem } from '@/context/cart-context';

export type FulfillmentType = 'delivery' | 'pickup' | 'dine-in';

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email: string;
}

export interface OrderFulfillment {
  type: FulfillmentType;
  address: string;
  area: string;
  notes: string;
  /** Set for dine-in orders placed from a table QR code. */
  tableNumber?: string | null;
}

export interface Order {
  trackingId: string;
  createdAt: string;
  customer: OrderCustomer;
  fulfillment: OrderFulfillment;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentConfirmed: boolean;
  riderPhone?: string | null;
}

const ORDERS_KEY = '724-restaurant-orders';
const LAST_ORDER_KEY = '724-restaurant-last-order';

export function generateTrackingId(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `724-${time.slice(-5)}${rand}`;
}

export function saveOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  const existing = getOrders();
  existing.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(existing.slice(0, 50)));
  sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
}

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function getLastOrder(): Order | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function getOrderByTrackingId(trackingId: string): Order | null {
  const normalized = trackingId.trim().toUpperCase();
  return (
    getOrders().find((o) => o.trackingId.toUpperCase() === normalized) ?? null
  );
}
