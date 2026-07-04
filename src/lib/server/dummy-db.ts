// In-memory dummy "database" used in place of the old Supabase backend.
// State lives for the lifetime of the server process — it resets on restart,
// which is expected for a frontend-only demo build.
import type { SiteSettingsRow } from '@/lib/site-settings';
import { defaultSiteSettings, mapSiteSettingsToRow } from '@/lib/site-settings';

export interface DummyAddon {
  name: string;
  price: number;
}

export interface DummyMenuItem {
  id: number;
  name: string;
  desc: string;
  price: number;
  rating: number;
  badge: string | null;
  image: string;
  addons: DummyAddon[] | null;
}

export interface DummyOrderItem {
  id: string;
  menu_item_id: number | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  addons: DummyAddon[] | null;
}

export type FulfillmentKind = 'delivery' | 'pickup' | 'dine-in';

export interface DummyOrder {
  id: string;
  tracking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment_type: FulfillmentKind;
  fulfillment_address: string | null;
  fulfillment_area: string | null;
  fulfillment_notes: string | null;
  table_number: string | null;
  table_session_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_confirmed: boolean;
  status: string;
  rider_phone: string | null;
  created_at: string;
  updated_at: string;
  order_items: DummyOrderItem[];
}

// ---- Dine-in tables & sessions ----
// A table is a physical table with a QR code pointing at /table/<id>.
// A session groups every order placed from that table between "first order"
// and "admin confirms payment & closes" (eat first, pay after).
export interface DummyTable {
  id: number;
  label: string;
  created_at: string;
}

export interface DummyTableSession {
  id: string;
  table_id: number;
  table_label: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
}

let menuItems: DummyMenuItem[] = [
  { id: 1, name: 'Grilled Fish with Fries & Jollof', desc: 'Char-grilled whole croaker served with golden fries and smoky party jollof rice.', price: 7500, rating: 4.8, badge: 'Best Seller', image: 'catfish-bbq', addons: [{ name: 'Extra Fries', price: 1000 }, { name: 'Extra Pepper Sauce', price: 500 }] },
  { id: 2, name: 'Pounded Yam & Egusi', desc: 'Soft pounded yam with rich egusi soup and assorted meat.', price: 4500, rating: 4.7, badge: 'Popular', image: 'beef-bbq', addons: [{ name: 'Extra Meat', price: 1500 }, { name: 'Extra Pounded Yam', price: 1000 }] },
  { id: 3, name: 'Isi Ewu', desc: 'Spicy goat-head delicacy in rich palm-oil pepper sauce — a 724 classic.', price: 6000, rating: 4.8, badge: 'House Special', image: 'asun-special', addons: null },
  { id: 4, name: 'Asun (Spicy Grilled Goat)', desc: 'Smoky goat meat tossed with fiery scotch bonnet peppers and onions.', price: 4000, rating: 4.7, badge: null, image: 'asun-special', addons: [{ name: 'Extra Pepper Sauce', price: 500 }] },
  { id: 5, name: 'Peppered Grilled Chicken', desc: 'Flame-grilled chicken quarters doused in our signature pepper sauce.', price: 5000, rating: 4.6, badge: null, image: 'bbq-chicken', addons: [{ name: 'Extra Sauce', price: 500 }] },
  { id: 6, name: 'Grilled Turkey Wings', desc: 'Massive turkey wings grilled till golden and served spicy.', price: 5500, rating: 4.6, badge: null, image: 'turkey-bbq', addons: null },
  { id: 7, name: 'Catfish Pepper Soup', desc: 'Fresh catfish simmered in a hot native spice broth.', price: 4500, rating: 4.5, badge: null, image: 'catfish-bbq', addons: null },
  { id: 8, name: 'Chapman (Big Jug)', desc: 'House-mixed Chapman served ice-cold — perfect with any grill.', price: 3500, rating: 4.9, badge: null, image: 'vibe-2', addons: null },
];
let nextMenuItemId = menuItems.length + 1;

let orders: DummyOrder[] = [
  {
    id: 'ord_seed_1',
    tracking_id: '724-DEMO01',
    customer_name: 'Ada Okafor',
    customer_phone: '08012345678',
    customer_email: 'ada@example.com',
    fulfillment_type: 'delivery',
    fulfillment_address: '12 Adekunle Street',
    fulfillment_area: 'Agidingbi',
    fulfillment_notes: 'Extra pepper please',
    table_number: null,
    table_session_id: null,
    subtotal: 12000,
    delivery_fee: 0,
    total: 12000,
    payment_confirmed: true,
    status: 'delivered',
    rider_phone: '08099998888',
    created_at: '2026-06-28T14:32:00.000Z',
    updated_at: '2026-06-28T15:10:00.000Z',
    order_items: [
      { id: 'item_seed_1', menu_item_id: 1, name: 'Grilled Fish with Fries & Jollof', price: 7500, quantity: 1, image: 'catfish-bbq', addons: [] },
      { id: 'item_seed_2', menu_item_id: 2, name: 'Pounded Yam & Egusi', price: 4500, quantity: 1, image: 'beef-bbq', addons: [] },
    ],
  },
  {
    id: 'ord_seed_2',
    tracking_id: '724-DEMO02',
    customer_name: 'Tunde Bakare',
    customer_phone: '08123456789',
    customer_email: 'tunde@example.com',
    fulfillment_type: 'pickup',
    fulfillment_address: null,
    fulfillment_area: null,
    fulfillment_notes: null,
    table_number: null,
    table_session_id: null,
    subtotal: 6000,
    delivery_fee: 0,
    total: 6000,
    payment_confirmed: true,
    status: 'preparing',
    rider_phone: null,
    created_at: '2026-07-01T10:05:00.000Z',
    updated_at: '2026-07-01T10:05:00.000Z',
    order_items: [
      { id: 'item_seed_3', menu_item_id: 3, name: 'Isi Ewu', price: 6000, quantity: 1, image: 'asun-special', addons: [] },
    ],
  },
  {
    id: 'ord_seed_3',
    tracking_id: '724-DEMO03',
    customer_name: 'Chioma Eze',
    customer_phone: '07098765432',
    customer_email: 'chioma@example.com',
    fulfillment_type: 'delivery',
    fulfillment_address: '5 Balogun Close',
    fulfillment_area: 'Ogba',
    fulfillment_notes: null,
    table_number: null,
    table_session_id: null,
    subtotal: 5000,
    delivery_fee: 0,
    total: 5000,
    payment_confirmed: false,
    status: 'pending',
    rider_phone: null,
    created_at: '2026-07-02T19:47:00.000Z',
    updated_at: '2026-07-02T19:47:00.000Z',
    order_items: [
      { id: 'item_seed_4', menu_item_id: 5, name: 'Peppered Grilled Chicken', price: 5000, quantity: 1, image: 'bbq-chicken', addons: [] },
    ],
  },
];

// Seed a few tables so the dine-in flow works out of the box; admins can add more.
let tables: DummyTable[] = [
  { id: 1, label: '1', created_at: '2026-07-01T09:00:00.000Z' },
  { id: 2, label: '2', created_at: '2026-07-01T09:00:00.000Z' },
  { id: 3, label: '3', created_at: '2026-07-01T09:00:00.000Z' },
  { id: 4, label: '4', created_at: '2026-07-01T09:00:00.000Z' },
];
let nextTableId = tables.length + 1;

let tableSessions: DummyTableSession[] = [];

let siteSettings: SiteSettingsRow = {
  ...mapSiteSettingsToRow(defaultSiteSettings),
  updated_at: new Date(0).toISOString(),
} as SiteSettingsRow;

// ---- Menu items ----
export function listMenuItems(): DummyMenuItem[] {
  return [...menuItems].sort((a, b) => a.id - b.id);
}

export function createMenuItem(data: Omit<DummyMenuItem, 'id'>): DummyMenuItem {
  const item: DummyMenuItem = { id: nextMenuItemId++, ...data };
  menuItems.push(item);
  return item;
}

export function updateMenuItem(id: number, data: Partial<Omit<DummyMenuItem, 'id'>>): DummyMenuItem | null {
  const index = menuItems.findIndex((i) => i.id === id);
  if (index === -1) return null;
  menuItems[index] = { ...menuItems[index], ...data };
  return menuItems[index];
}

export function deleteMenuItem(id: number): boolean {
  const before = menuItems.length;
  menuItems = menuItems.filter((i) => i.id !== id);
  return menuItems.length < before;
}

// ---- Orders ----
export function listOrders(): DummyOrder[] {
  return [...orders].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function findOrderByTrackingId(trackingId: string): DummyOrder | null {
  const normalized = trackingId.trim().toUpperCase();
  return orders.find((o) => o.tracking_id.toUpperCase() === normalized) ?? null;
}

export function findOrderById(id: string): DummyOrder | null {
  return orders.find((o) => o.id === id) ?? null;
}

export interface CreateOrderInput {
  tracking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment_type: FulfillmentKind;
  fulfillment_address: string | null;
  fulfillment_area: string | null;
  fulfillment_notes: string | null;
  table_id?: number | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_confirmed: boolean;
  status: string;
  items: { id: number; name: string; price: number; qty: number; image?: string; addons?: DummyAddon[] }[];
}

export function createOrder(input: CreateOrderInput): DummyOrder {
  const now = new Date().toISOString();

  // Dine-in orders join the table's open session (or start one) so every
  // plate ordered during the meal lands on the same bill.
  let tableNumber: string | null = null;
  let tableSessionId: string | null = null;
  if (input.fulfillment_type === 'dine-in' && input.table_id != null) {
    const session = openSessionForTable(input.table_id);
    if (session) {
      tableNumber = session.table_label;
      tableSessionId = session.id;
    }
  }

  const order: DummyOrder = {
    id: `ord_${crypto.randomUUID()}`,
    tracking_id: input.tracking_id,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    customer_email: input.customer_email,
    fulfillment_type: input.fulfillment_type,
    fulfillment_address: input.fulfillment_address,
    fulfillment_area: input.fulfillment_area,
    fulfillment_notes: input.fulfillment_notes,
    table_number: tableNumber,
    table_session_id: tableSessionId,
    subtotal: input.subtotal,
    delivery_fee: input.delivery_fee,
    total: input.total,
    payment_confirmed: input.payment_confirmed,
    status: input.status,
    rider_phone: null,
    created_at: now,
    updated_at: now,
    order_items: input.items.map((item) => ({
      id: `item_${crypto.randomUUID()}`,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      image: item.image || null,
      addons: Array.isArray(item.addons) ? item.addons : [],
    })),
  };
  orders.push(order);
  return order;
}

export interface OrderPatch {
  status?: string;
  payment_confirmed?: boolean;
  rider_phone?: string | null;
}

export function updateOrder(id: string, patch: OrderPatch): DummyOrder | null {
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index], ...patch, updated_at: new Date().toISOString() };
  return orders[index];
}

// ---- Tables ----
export function listTables(): DummyTable[] {
  return [...tables].sort((a, b) => a.id - b.id);
}

export function findTableById(id: number): DummyTable | null {
  return tables.find((t) => t.id === id) ?? null;
}

export function createTable(label?: string): DummyTable {
  const id = nextTableId++;
  const table: DummyTable = {
    id,
    label: (label ?? '').trim() || String(id),
    created_at: new Date().toISOString(),
  };
  tables.push(table);
  return table;
}

// A table with an open session can't be deleted — the bill must be settled first.
export function deleteTable(id: number): { ok: boolean; error?: string } {
  if (!findTableById(id)) return { ok: false, error: 'Table not found' };
  if (findOpenSessionForTable(id)) {
    return { ok: false, error: 'This table has an open session. Close it before deleting the table.' };
  }
  tables = tables.filter((t) => t.id !== id);
  return { ok: true };
}

// ---- Table sessions ----
export function findOpenSessionForTable(tableId: number): DummyTableSession | null {
  return tableSessions.find((s) => s.table_id === tableId && s.status === 'open') ?? null;
}

export function findTableSessionById(id: string): DummyTableSession | null {
  return tableSessions.find((s) => s.id === id) ?? null;
}

// Find-or-create: the first order from a table opens its session.
export function openSessionForTable(tableId: number): DummyTableSession | null {
  const table = findTableById(tableId);
  if (!table) return null;
  const existing = findOpenSessionForTable(tableId);
  if (existing) return existing;
  const session: DummyTableSession = {
    id: `ts_${crypto.randomUUID()}`,
    table_id: table.id,
    table_label: table.label,
    status: 'open',
    opened_at: new Date().toISOString(),
    closed_at: null,
  };
  tableSessions.push(session);
  return session;
}

export function listOrdersForSession(sessionId: string): DummyOrder[] {
  return orders
    .filter((o) => o.table_session_id === sessionId)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
}

export interface TableSessionWithOrders extends DummyTableSession {
  orders: DummyOrder[];
  total: number;
}

export function listTableSessions(status?: 'open' | 'closed'): TableSessionWithOrders[] {
  return tableSessions
    .filter((s) => (status ? s.status === status : true))
    .sort((a, b) => +new Date(b.opened_at) - +new Date(a.opened_at))
    .map((s) => {
      const sessionOrders = listOrdersForSession(s.id);
      return {
        ...s,
        orders: sessionOrders,
        total: sessionOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      };
    });
}

// Closing a session = payment received for the whole table: mark every order
// on the session as paid & delivered, then close the session.
export function closeTableSession(sessionId: string): TableSessionWithOrders | null {
  const index = tableSessions.findIndex((s) => s.id === sessionId);
  if (index === -1) return null;
  if (tableSessions[index].status === 'open') {
    tableSessions[index] = {
      ...tableSessions[index],
      status: 'closed',
      closed_at: new Date().toISOString(),
    };
    const now = new Date().toISOString();
    orders = orders.map((o) =>
      o.table_session_id === sessionId
        ? { ...o, payment_confirmed: true, status: 'delivered', updated_at: now }
        : o
    );
  }
  const closed = tableSessions[index];
  const sessionOrders = listOrdersForSession(closed.id);
  return {
    ...closed,
    orders: sessionOrders,
    total: sessionOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
  };
}

// ---- Site settings ----
export function getSiteSettingsRow(): SiteSettingsRow {
  return siteSettings;
}

export function updateSiteSettingsRow(row: Partial<SiteSettingsRow>): SiteSettingsRow {
  siteSettings = { ...siteSettings, ...row, id: 1, updated_at: new Date().toISOString() } as SiteSettingsRow;
  return siteSettings;
}
