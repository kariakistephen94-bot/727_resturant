import { NextRequest, NextResponse } from 'next/server';
import { deleteMenuItem, updateMenuItem } from '@/lib/server/dummy-db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updated = updateMenuItem(Number(id), {
    name: body.name,
    desc: body.desc || '',
    price: Number(body.price) || 0,
    rating: Number(body.rating) || 0,
    badge: body.badge || null,
    image: body.image || '',
    addons: Array.isArray(body.addons) ? body.addons : [],
  });

  if (!updated) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteMenuItem(Number(id));
  if (!ok) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
