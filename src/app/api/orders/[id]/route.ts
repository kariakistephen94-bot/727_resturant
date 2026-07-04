import { NextRequest, NextResponse } from 'next/server';
import { findOrderById, updateOrder } from '@/lib/server/dummy-db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = findOrderById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const body = await request.json();
  const patch: { status?: string; payment_confirmed?: boolean; rider_phone?: string | null } = {};
  if (typeof body.status === 'string') patch.status = body.status;
  if (typeof body.payment_confirmed === 'boolean') patch.payment_confirmed = body.payment_confirmed;
  if (body.rider_phone === null || typeof body.rider_phone === 'string') patch.rider_phone = body.rider_phone;

  const updated = updateOrder(id, patch);
  return NextResponse.json({ order: updated });
}
