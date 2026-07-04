'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Loader2, ChevronLeft, ChevronRight, CheckCircle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  addons: { name: string; price: number }[] | null;
}

interface Order {
  id: string;
  tracking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment_type: string;
  fulfillment_address: string;
  fulfillment_area: string;
  table_number?: string | null;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_confirmed: boolean;
  rider_phone: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [riderPhone, setRiderPhone] = useState('');
  const [savingRider, setSavingRider] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, preparing: 0, delivered: 0, totalRevenue: 0 });
  const ITEMS_PER_PAGE = 10;

  const { toast } = useToast();

  const fetchAllOrders = async (): Promise<Order[]> => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      return (data.orders || []) as Order[];
    } catch {
      toast({ title: 'Error fetching orders', description: 'Please try again.', variant: 'destructive' });
      return [];
    }
  };

  const fetchStats = async () => {
    const data = await fetchAllOrders();
    setStats({
      total: data.length,
      pending: data.filter(o => o.status === 'pending').length,
      confirmed: data.filter(o => o.status === 'confirmed').length,
      preparing: data.filter(o => o.status === 'preparing').length,
      delivered: data.filter(o => o.status === 'delivered').length,
      // Revenue counts only orders whose payment has been confirmed.
      totalRevenue: data
        .filter(o => o.payment_confirmed)
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const all = await fetchAllOrders();

    let filtered = all;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter((o) =>
        o.tracking_id.toLowerCase().includes(term) ||
        o.customer_name.toLowerCase().includes(term) ||
        o.customer_phone.toLowerCase().includes(term)
      );
    }

    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    setOrders(filtered.slice(from, from + ITEMS_PER_PAGE));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, debouncedSearch]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setRiderPhone(order.rider_phone || '');
    setDialogOpen(true);
  };

  const handleSaveRiderPhone = async (orderId: string) => {
    const trimmed = riderPhone.trim();
    setSavingRider(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rider_phone: trimmed || null }),
    });
    setSavingRider(false);

    if (!res.ok) {
      toast({ title: 'Error', description: 'Failed to save rider phone number.', variant: 'destructive' });
      return;
    }

    const newValue = trimmed || null;
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, rider_phone: newValue } : order
    ));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, rider_phone: newValue });
    }
    toast({ title: 'Success', description: 'Rider phone number saved.' });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
      return;
    }

    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: newStatus as Order['status'] }
        : order
    ));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        status: newStatus as Order['status'],
      });
    }
    fetchStats();
    toast({ title: 'Success', description: 'Order status updated.' });
  };

  const handlePaymentConfirmToggle = async (orderId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const updates: { payment_confirmed: boolean; status?: string } = { payment_confirmed: newStatus };
    const order = orders.find(o => o.id === orderId);

    if (newStatus && order?.status === 'pending') {
      updates.status = 'confirmed';
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      toast({ title: 'Error', description: 'Failed to update payment status.', variant: 'destructive' });
      return;
    }

    setOrders(orders.map(o =>
      o.id === orderId
        ? { ...o, payment_confirmed: newStatus, status: (updates.status as Order['status']) || o.status }
        : o
    ));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        payment_confirmed: newStatus,
        status: (updates.status as Order['status']) || selectedOrder.status,
      });
    }
    if (updates.status) fetchStats();
    toast({ title: 'Success', description: 'Payment status updated.' });
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₦{(stats.totalRevenue / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Manage and track all customer orders</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchOrders}>
              Refresh Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by tracking ID, customer name, or phone..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="md:hidden space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-900">{order.tracking_id}</p>
                        <p className="text-sm text-slate-600">{order.customer_name}</p>
                        {order.fulfillment_type === 'dine-in' && order.table_number && (
                          <p className="text-xs font-bold text-primary">🍽 Table {order.table_number}</p>
                        )}
                      </div>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-slate-500">Total</p>
                        <p className="font-bold">₦{Number(order.total).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Items</p>
                        <p className="font-bold">{order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Payment</p>
                        <p className="font-bold text-xs">{order.payment_confirmed ? '✓ Paid' : '⏳ Pending'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrder(order)}
                      className="w-full gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.tracking_id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{order.customer_name}</p>
                            <p className={`text-sm ${order.fulfillment_type === 'dine-in' && order.table_number ? 'font-bold text-primary' : 'text-slate-500'}`}>
                              {order.fulfillment_type === 'dine-in' && order.table_number
                                ? `🍽 Table ${order.table_number}`
                                : order.customer_phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</TableCell>
                        <TableCell className="font-medium">₦{Number(order.total).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.payment_confirmed ? 'default' : 'secondary'}>
                            {order.payment_confirmed ? '✓ Paid' : '⏳ Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {orders.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No orders found.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order {selectedOrder.tracking_id}</DialogTitle>
                <DialogDescription>
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Name</p>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-medium">{selectedOrder.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="font-medium">{selectedOrder.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fulfillment Type</p>
                      <p className="font-medium capitalize">
                        {selectedOrder.fulfillment_type === 'dine-in' && selectedOrder.table_number
                          ? `Dine-in · Table ${selectedOrder.table_number}`
                          : selectedOrder.fulfillment_type}
                      </p>
                    </div>
                    {selectedOrder.fulfillment_type === 'delivery' && (
                      <div className="md:col-span-2">
                        <p className="text-slate-500">Delivery Address</p>
                        <p className="font-medium">{selectedOrder.fulfillment_address} ({selectedOrder.fulfillment_area})</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          {Array.isArray(item.addons) && item.addons.length > 0 && (
                            <p className="text-xs text-orange-600">
                              Extras: {item.addons.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  {/* Order Status */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-slate-500">Update Status</h3>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Payment Info */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-slate-500">Payment</h3>
                    <Button
                      variant={selectedOrder.payment_confirmed ? 'default' : 'outline'}
                      className={selectedOrder.payment_confirmed ? 'w-full gap-1.5' : 'w-full gap-1.5 text-yellow-600 border-yellow-300'}
                      onClick={() => handlePaymentConfirmToggle(selectedOrder.id, selectedOrder.payment_confirmed)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {selectedOrder.payment_confirmed ? 'Payment Confirmed' : 'Confirm Payment'}
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">
                      {selectedOrder.payment_confirmed
                        ? 'Customer can track this order.'
                        : 'Customer sees “payment not yet confirmed” until you confirm.'}
                    </p>
                  </div>
                </div>

                {/* Rider contact — shown when the order is out for delivery */}
                {selectedOrder.status === 'out_for_delivery' && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-600" />
                      Delivery Rider
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Add the rider&apos;s phone number so the customer can call them while tracking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="tel"
                        placeholder="e.g. 0803 123 4567"
                        value={riderPhone}
                        onChange={(e) => setRiderPhone(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleSaveRiderPhone(selectedOrder.id)}
                        disabled={savingRider || riderPhone.trim() === (selectedOrder.rider_phone || '')}
                        className="gap-2 shrink-0"
                      >
                        {savingRider ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                        Save Rider
                      </Button>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">₦{Number(selectedOrder.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
