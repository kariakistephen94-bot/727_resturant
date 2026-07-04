'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CartAddon {
  name: string;
  price: number;
}

export interface CartItem {
  /** The underlying menu item id. The same dish can appear on several lines
   *  (with different extras), so use `cartId` — not `id` — as the line key. */
  id: number;
  /** Unique per (menu item + chosen extras). */
  cartId: string;
  name: string;
  /** Unit price including any selected extras. */
  price: number;
  /** Unit price of the base dish, before extras. */
  basePrice: number;
  qty: number;
  image: string;
  /** Extras the customer chose for this line. */
  addons: CartAddon[];
}

/** Builds a stable line key from a menu item id and its chosen extras. */
export function buildCartId(id: number, addons: CartAddon[] = []): string {
  if (!addons.length) return String(id);
  const key = addons
    .map((a) => a.name)
    .sort()
    .join('|');
  return `${id}::${key}`;
}

type AddItemInput = {
  id: number;
  name: string;
  price: number;
  image: string;
  basePrice?: number;
  addons?: CartAddon[];
};

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: AddItemInput, qty?: number) => void;
  removeItem: (cartId: string) => void;
  updateQty: (cartId: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = '724-restaurant-cart';

// Older carts (and any hand-rolled items) may be missing the newer fields, so
// fill them in on load to keep line operations working.
function normalizeItem(raw: Partial<CartItem> & { id: number }): CartItem {
  const addons = Array.isArray(raw.addons) ? raw.addons : [];
  const price = Number(raw.price) || 0;
  return {
    id: raw.id,
    cartId: raw.cartId ?? buildCartId(raw.id, addons),
    name: raw.name ?? '',
    price,
    basePrice: Number(raw.basePrice ?? price) || price,
    qty: Number(raw.qty) || 1,
    image: raw.image ?? '',
    addons,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as (Partial<CartItem> & { id: number })[];
        setItems(parsed.map(normalizeItem));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: AddItemInput, qty = 1) => {
    const addons = item.addons ?? [];
    const cartId = buildCartId(item.id, addons);
    const line: CartItem = {
      id: item.id,
      cartId,
      name: item.name,
      price: item.price,
      basePrice: item.basePrice ?? item.price,
      image: item.image,
      addons,
      qty,
    };
    setItems((prev) => {
      const existing = prev.find((i) => i.cartId === cartId);
      if (existing) {
        return prev.map((i) =>
          i.cartId === cartId ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, line];
    });
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  }, []);

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.cartId !== cartId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.cartId === cartId ? { ...i, qty } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }),
    [items, itemCount, subtotal, addItem, removeItem, updateQty, clearCart],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
