'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Plus,
  QrCode,
  Trash2,
  Download,
  Utensils,
  ReceiptText,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/format';

interface AdminTable {
  id: number;
  label: string;
  created_at: string;
  open_session_id: string | null;
}

interface SessionOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface SessionOrder {
  id: string;
  tracking_id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  order_items: SessionOrderItem[];
}

interface TableSession {
  id: string;
  table_id: number;
  table_label: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  orders: SessionOrder[];
  total: number;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  );
}

export default function TablesPage() {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [qrTable, setQrTable] = useState<AdminTable | null>(null);
  const [closingSession, setClosingSession] = useState<TableSession | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [tablesRes, sessionsRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/table-sessions?status=open'),
      ]);
      const tablesData = await tablesRes.json();
      const sessionsData = await sessionsRes.json();
      setTables(tablesData.tables || []);
      setSessions(sessionsData.sessions || []);
    } catch {
      toast({ title: 'Error loading tables', description: 'Please try again.', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    refresh();
    // Sessions change as guests order — keep the view fresh while the page is open.
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAddTable = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNewLabel('');
      toast({ title: `Table ${data.table.label} added`, description: 'Print its QR code and place it on the table.' });
      await refresh();
    } catch {
      toast({ title: 'Could not add table', description: 'Please try again.', variant: 'destructive' });
    }
    setAdding(false);
  };

  const handleDeleteTable = async (table: AdminTable) => {
    try {
      const res = await fetch(`/api/tables/${table.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Cannot delete table', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: `Table ${table.label} deleted` });
      await refresh();
    } catch {
      toast({ title: 'Could not delete table', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleCloseSession = async () => {
    if (!closingSession) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/table-sessions/${closingSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: `Table ${closingSession.table_label} session closed`,
        description: `${formatNaira(closingSession.total)} confirmed as paid. The table is free again.`,
      });
      setClosingSession(null);
      await refresh();
    } catch {
      toast({ title: 'Could not close session', description: 'Please try again.', variant: 'destructive' });
    }
    setClosing(false);
  };

  const downloadQr = (table: AdminTable) => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `724-table-${table.label}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const tableUrl = (table: AdminTable) => `${origin}/table/${table.id}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tables &amp; Sessions</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Each table gets a QR code. Guests scan it, order through the meal, and you close the
          session here once they&apos;ve paid.
        </p>
      </div>

      {/* Open sessions — the live bills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-primary" />
            Open table sessions
            <Badge className="bg-primary text-white ml-1">{sessions.length}</Badge>
          </CardTitle>
          <CardDescription>
            Every order from a table lands on its open session. Close the session when the
            guests have paid — that marks all its orders as paid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Utensils className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No open sessions. When a guest orders from a table QR, the bill shows up here.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold flex items-center gap-2">
                        <span className="inline-flex w-8 h-8 rounded-lg bg-primary text-white items-center justify-center text-sm font-bold">
                          {session.table_label}
                        </span>
                        Table {session.table_label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Opened {formatTime(session.opened_at)} · {session.orders.length}{' '}
                        {session.orders.length === 1 ? 'order' : 'orders'}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary shrink-0">{formatNaira(session.total)}</p>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {session.orders.map((order) => (
                      <div key={order.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                        <div className="flex justify-between gap-2 font-medium">
                          <span className="truncate">{order.customer_name}</span>
                          <span className="shrink-0">{formatNaira(order.total)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.order_items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{order.tracking_id}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold"
                    onClick={() => setClosingSession(session)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Payment received — close session
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Tables
            <Badge variant="secondary" className="ml-1">{tables.length}</Badge>
          </CardTitle>
          <CardDescription>
            Add as many tables as you need. Download each QR code, print it, and place it on the table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 max-w-md">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Table number / name (optional — e.g. 5 or VIP 1)"
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTable();
              }}
            />
            <Button onClick={handleAddTable} disabled={adding} className="rounded-xl shrink-0">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span className="ml-1.5 hidden sm:inline">Add table</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tables.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No tables yet — add your first table above.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="rounded-2xl border border-border p-4 flex flex-col items-center text-center gap-3"
                >
                  <div className="w-full flex items-center justify-between">
                    <p className="font-bold">Table {table.label}</p>
                    {table.open_session_id ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">In use</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Free</Badge>
                    )}
                  </div>
                  {origin && (
                    <div className="rounded-xl border border-border p-2 bg-white">
                      <QRCodeCanvas value={tableUrl(table)} size={110} fgColor="#580b1b" />
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full text-xs"
                      onClick={() => setQrTable(table)}
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1" />
                      QR code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTable(table)}
                      aria-label={`Delete table ${table.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Large QR dialog with download */}
      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Table {qrTable?.label} — QR code</DialogTitle>
            <DialogDescription>
              Guests scan this to order from Table {qrTable?.label}. Download it, print it, and
              place it on the table.
            </DialogDescription>
          </DialogHeader>
          {qrTable && origin && (
            <div ref={qrRef} className="flex flex-col items-center gap-3 py-2">
              <div className="rounded-2xl border border-border p-4 bg-white">
                <QRCodeCanvas value={tableUrl(qrTable)} size={512} fgColor="#580b1b" style={{ width: 240, height: 240 }} />
              </div>
              <p className="text-xs text-muted-foreground break-all text-center">{tableUrl(qrTable)}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold"
              onClick={() => qrTable && downloadQr(qrTable)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close-session confirmation */}
      <Dialog open={!!closingSession} onOpenChange={(open) => !open && setClosingSession(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close Table {closingSession?.table_label}?</DialogTitle>
            <DialogDescription>
              This confirms{' '}
              <span className="font-bold text-foreground">
                {closingSession ? formatNaira(closingSession.total) : ''}
              </span>{' '}
              has been paid for {closingSession?.orders.length}{' '}
              {closingSession?.orders.length === 1 ? 'order' : 'orders'}. All orders on this
              session will be marked paid and the table freed up.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setClosingSession(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold"
              onClick={handleCloseSession}
              disabled={closing}
            >
              {closing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirm payment &amp; close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
