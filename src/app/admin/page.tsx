'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  UtensilsCrossed,
  DollarSign,
  Loader2,
  Clock,
  CheckCircle2,
  Flame,
  BarChart3,
  Sun,
  QrCode,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import {
  subDays,
  startOfDay,
  startOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameDay,
  isSameWeek,
  isToday,
  format,
  differenceInCalendarDays,
} from 'date-fns';
import { formatNairaCompact, formatNairaShort, compactNumber, formatNumber } from '@/lib/format';

// Interfaces for fetched data
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tracking_id: string;
  total: number;
  status: string;
  payment_confirmed: boolean;
  created_at: string;
  order_items: OrderItem[];
}

// Time-range options that drive the analytics charts
const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 90 days', days: 90 },
  { value: 'all', label: 'All time', days: null as number | null },
];

const weeklyChartConfig = {
  revenue: { label: 'Revenue', color: '#ea580c' },
  orders: { label: 'Orders', color: '#3b82f6' },
};

const topItemsConfig = {
  revenue: { label: 'Revenue (₦)', color: '#10b981' },
};

const PIE_COLORS = ['#ea580c', '#dc2626', '#f59e0b', '#6366f1', '#8b5cf6', '#10b981'];

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItemsCount, setMenuItemsCount] = useState(0);
  const [openTableSessions, setOpenTableSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trend');
  const [range, setRange] = useState('7');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      const [ordersRes, menuRes, sessionsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/menu-items'),
        fetch('/api/table-sessions?status=open'),
      ]);
      const ordersData = await ordersRes.json();
      const menuData = await menuRes.json();
      const sessionsData = await sessionsRes.json();

      setOrders(ordersData.orders || []);
      setMenuItemsCount(Array.isArray(menuData) ? menuData.length : 0);
      setOpenTableSessions(Array.isArray(sessionsData.sessions) ? sessionsData.sessions.length : 0);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Only orders whose payment has been confirmed count toward money/sales metrics.
  const paidOrders = orders.filter((o) => o.payment_confirmed);

  // ---- All-time business KPIs ----
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length; // operational count — all orders
  const paidOrderCount = paidOrders.length;
  const avgOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  // Today's performance (confirmed payments only)
  const todayPaidOrders = paidOrders.filter((o) => isToday(new Date(o.created_at)));
  const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Revenue for each of the last 7 days (confirmed only, independent of the range selector)
  const last7Data = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfDay(subDays(new Date(), 6)), end: new Date() });
    return days.map((d) => ({
      label: format(d, 'EEE'),
      revenue: orders
        .filter((o) => o.payment_confirmed && isSameDay(new Date(o.created_at), d))
        .reduce((s, o) => s + (Number(o.total) || 0), 0),
    }));
  }, [orders]);
  const last7Total = last7Data.reduce((s, d) => s + d.revenue, 0);

  // Best seller by quantity — confirmed (real) sales only
  const allItemStats: Record<string, number> = {};
  paidOrders.forEach((o) =>
    o.order_items?.forEach((it) => {
      allItemStats[it.name] = (allItemStats[it.name] || 0) + it.quantity;
    })
  );
  const bestSeller =
    Object.entries(allItemStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // ---- Range-filtered analytics ----
  const selectedRange = RANGE_OPTIONS.find((r) => r.value === range) ?? RANGE_OPTIONS[0];

  const { filteredOrders, trendData, rangeRevenue } = useMemo(() => {
    const now = new Date();
    let rangeStart: Date;

    if (selectedRange.days) {
      rangeStart = startOfDay(subDays(now, selectedRange.days - 1));
    } else if (orders.length > 0) {
      const earliest = Math.min(...orders.map((o) => +new Date(o.created_at)));
      rangeStart = startOfDay(new Date(earliest));
    } else {
      rangeStart = startOfDay(subDays(now, 6));
    }

    const filtered = orders.filter(
      (o) => o.payment_confirmed && new Date(o.created_at) >= rangeStart
    );
    const span = differenceInCalendarDays(now, rangeStart);

    let series: { label: string; revenue: number; orders: number }[];

    if (span <= 31) {
      // Daily buckets
      const days = eachDayOfInterval({ start: rangeStart, end: now });
      series = days.map((d) => {
        const bucket = filtered.filter((o) => isSameDay(new Date(o.created_at), d));
        return {
          label: format(d, 'MMM d'),
          revenue: bucket.reduce((s, o) => s + (Number(o.total) || 0), 0),
          orders: bucket.length,
        };
      });
    } else {
      // Weekly buckets for wider ranges
      const weeks = eachWeekOfInterval({ start: rangeStart, end: now });
      series = weeks.map((w) => {
        const bucket = filtered.filter((o) =>
          isSameWeek(new Date(o.created_at), w)
        );
        return {
          label: format(startOfWeek(w), 'MMM d'),
          revenue: bucket.reduce((s, o) => s + (Number(o.total) || 0), 0),
          orders: bucket.length,
        };
      });
    }

    const revenue = filtered.reduce((s, o) => s + (Number(o.total) || 0), 0);
    return { filteredOrders: filtered, trendData: series, rangeRevenue: revenue };
  }, [orders, selectedRange]);

  // Top items + distribution within the selected range
  const itemStats: Record<string, { quantity: number; revenue: number }> = {};
  filteredOrders.forEach((o) =>
    o.order_items?.forEach((it) => {
      if (!itemStats[it.name]) itemStats[it.name] = { quantity: 0, revenue: 0 };
      itemStats[it.name].quantity += it.quantity;
      itemStats[it.name].revenue += it.price * it.quantity;
    })
  );

  const sortedItems = Object.entries(itemStats)
    .map(([name, s]) => ({ name, quantity: s.quantity, revenue: s.revenue, value: s.quantity }))
    .sort((a, b) => b.revenue - a.revenue);

  const topItemsByRevenue = sortedItems.slice(0, 5);
  const pieData = sortedItems.slice(0, 5).map((item, index) => ({
    ...item,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));

  const pieChartConfig = pieData.reduce((acc, item) => {
    acc[item.name.toLowerCase().replace(/\s+/g, '')] = { label: item.name, color: item.color };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const kpis = [
    {
      title: "Today's Revenue",
      value: formatNairaShort(todayRevenue),
      full: formatNairaCompact(todayRevenue),
      sub: `${todayPaidOrders.length} paid order${todayPaidOrders.length === 1 ? '' : 's'} today`,
      icon: Sun,
      tint: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Total Revenue',
      value: formatNairaShort(totalRevenue),
      full: formatNairaCompact(totalRevenue),
      sub: 'Confirmed payments',
      icon: DollarSign,
      tint: 'bg-green-100 text-green-600',
    },
    {
      title: 'Total Orders',
      value: compactNumber(totalOrders),
      full: formatNumber(totalOrders),
      sub: 'All time',
      icon: ShoppingCart,
      tint: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Avg Order Value',
      value: formatNairaShort(avgOrderValue),
      full: formatNairaCompact(Math.round(avgOrderValue)),
      sub: 'Per paid order',
      icon: BarChart3,
      tint: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Pending Orders',
      value: compactNumber(pendingOrders),
      full: formatNumber(pendingOrders),
      sub: 'Awaiting action',
      icon: Clock,
      tint: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Delivered',
      value: compactNumber(deliveredOrders),
      full: formatNumber(deliveredOrders),
      sub: 'Completed orders',
      icon: CheckCircle2,
      tint: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Open Tables',
      value: compactNumber(openTableSessions),
      full: formatNumber(openTableSessions),
      sub: 'Dine-in sessions running',
      icon: QrCode,
      tint: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'Menu Items',
      value: compactNumber(menuItemsCount),
      full: formatNumber(menuItemsCount),
      sub: 'On the menu',
      icon: UtensilsCrossed,
      tint: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Best Seller',
      value: bestSeller,
      full: bestSeller,
      sub: 'Most ordered item',
      icon: Flame,
      tint: 'bg-red-100 text-red-600',
      small: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-none shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-1.5 sm:pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 truncate">
                {kpi.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${kpi.tint}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 min-w-0">
              <div
                className={`font-bold tracking-tight text-slate-900 truncate tabular-nums ${
                  kpi.small ? 'text-base sm:text-lg leading-tight' : 'text-2xl sm:text-3xl'
                }`}
                title={kpi.full}
              >
                {kpi.value}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue — Last 7 Days (bar chart) */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg text-slate-900">Revenue · Last 7 Days</CardTitle>
            <CardDescription className="text-slate-600">Confirmed daily revenue this past week</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">7-day total</p>
            <p className="text-lg font-bold text-slate-900" title={formatNairaCompact(last7Total)}>{formatNairaShort(last7Total)}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer config={weeklyChartConfig} className="w-full h-52 sm:h-60 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Data} margin={{ top: 10, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)}
                  width={38}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                  }
                />
                <Bar dataKey="revenue" fill="#ea580c" name="Revenue" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
              <p className="text-sm text-slate-500 mt-1">
                Showing data for {selectedRange.label.toLowerCase()} · {formatNairaCompact(rangeRevenue)}
              </p>
            </div>
            {/* Sort / filter the graphics by time range */}
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 md:inline-flex md:overflow-hidden md:rounded-full md:border md:border-slate-300 md:bg-slate-100 md:p-1 md:self-start">
            {[
              { id: 'trend', label: 'Revenue Trend' },
              { id: 'topitems', label: 'Top Items' },
              { id: 'distribution', label: 'Distribution' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none rounded-lg md:rounded-full px-3 md:px-4 py-2 text-xs md:text-sm font-semibold transition duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-lg md:bg-white md:text-slate-900 md:shadow-sm'
                    : 'bg-slate-200 text-slate-700 md:bg-transparent md:text-slate-600 hover:bg-slate-300 md:hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'trend' && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Revenue Trend</CardTitle>
              <CardDescription className="text-slate-600">
                Revenue and orders over {selectedRange.label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredOrders.length > 0 ? (
                <ChartContainer config={weeklyChartConfig} className="w-full h-56 sm:h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 8, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        interval="preserveStartEnd"
                        minTickGap={20}
                        dy={5}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)}
                        width={38}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) =>
                              name === 'revenue'
                                ? `₦${Number(value).toLocaleString()}`
                                : `${value} orders`
                            }
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#ea580c"
                        strokeWidth={2.5}
                        fill="url(#revGradient)"
                        name="revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <p className="font-medium">No sales in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'topitems' && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Top Selling Items</CardTitle>
              <CardDescription className="text-slate-600">
                Best performing menu items by revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {topItemsByRevenue.length > 0 ? (
                <ChartContainer config={topItemsConfig} className="w-full h-56 sm:h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topItemsByRevenue}
                      layout="vertical"
                      margin={{ top: 5, right: 16, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 11 }}
                        width={isMobile ? 80 : 110}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                        }
                      />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <p className="font-medium">No sales in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'distribution' && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Sales Distribution</CardTitle>
              <CardDescription className="text-slate-600">Sales quantity by menu item</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {pieData.length > 0 ? (
                <>
                  <ChartContainer
                    config={pieChartConfig}
                    className="w-full h-56 sm:h-64 md:h-80 flex justify-center"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={isMobile ? 70 : 100}
                          innerRadius={isMobile ? 35 : 50}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-center md:gap-3">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 font-medium truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <p className="font-medium">No sales in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders placed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 tracking-tight truncate">{order.tracking_id}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-bold text-slate-900 text-base sm:text-lg">
                    ₦{Number(order.total).toLocaleString()}
                  </p>
                  <span
                    className={`inline-flex px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full capitalize ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-6 text-slate-500">No recent orders found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
