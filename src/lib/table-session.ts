// Client-side "which table am I sitting at?" context, set when a customer
// scans the QR code on their table (/table/<id>). Stored in sessionStorage so
// it lasts for the visit but doesn't leak into a later at-home order.

export interface TableContext {
  tableId: number;
  tableLabel: string;
}

const TABLE_CONTEXT_KEY = '724-table-context';

export function saveTableContext(ctx: TableContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TABLE_CONTEXT_KEY, JSON.stringify(ctx));
}

export function getTableContext(): TableContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(TABLE_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TableContext;
    return typeof parsed?.tableId === 'number' && parsed?.tableLabel ? parsed : null;
  } catch {
    return null;
  }
}

export function clearTableContext(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TABLE_CONTEXT_KEY);
}
