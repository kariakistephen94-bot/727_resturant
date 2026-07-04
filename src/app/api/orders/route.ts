import { NextRequest, NextResponse } from 'next/server';
import { createOrder, findOrderByTrackingId, findTableById, listOrders } from '@/lib/server/dummy-db';

// GET /api/orders?tracking_id=GJ-XXXXX  -> single order lookup (customer Track page)
// GET /api/orders                       -> all orders (admin dashboard/orders page)
export async function GET(request: NextRequest) {
  const trackingId = request.nextUrl.searchParams.get('tracking_id');

  if (trackingId) {
    const order = findOrderByTrackingId(trackingId);
    if (!order) {
      return NextResponse.json({ order: null }, { status: 404 });
    }
    return NextResponse.json({ order });
  }

  return NextResponse.json({ orders: listOrders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tracking_id,
      customer_name,
      customer_phone,
      customer_email,
      fulfillment_type,
      fulfillment_address,
      fulfillment_area,
      fulfillment_notes,
      table_id,
      subtotal,
      delivery_fee,
      total,
      payment_confirmed,
      status,
      items,
    } = body;

    const isDineIn = fulfillment_type === 'dine-in';

    // Dine-in guests just give a name — they're at the table, so phone/email
    // aren't needed. Delivery/pickup still require full contact details.
    if (!tracking_id || !customer_name || (!isDineIn && (!customer_phone || !customer_email))) {
      return NextResponse.json(
        { error: 'Missing required fields: tracking_id, customer_name, customer_phone, customer_email' },
        { status: 400 }
      );
    }

    if (isDineIn && !findTableById(Number(table_id))) {
      return NextResponse.json(
        { error: 'Invalid table. Please re-scan the QR code on your table.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    const order = createOrder({
      tracking_id,
      customer_name,
      customer_phone: customer_phone || '',
      customer_email: customer_email || '',
      fulfillment_type,
      fulfillment_address: fulfillment_address || null,
      fulfillment_area: fulfillment_area || null,
      fulfillment_notes: fulfillment_notes || null,
      table_id: isDineIn ? Number(table_id) : null,
      subtotal,
      delivery_fee: delivery_fee ?? 0,
      total,
      payment_confirmed: payment_confirmed ?? false,
      status: status || 'pending',
      items,
    });

    return NextResponse.json(
      { success: true, orderId: order.id, trackingId: order.tracking_id },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
