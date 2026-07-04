import { NextResponse } from 'next/server';
import { createMenuItem, listMenuItems } from '@/lib/server/dummy-db';

export async function GET() {
  return NextResponse.json(listMenuItems());
}

export async function POST(request: Request) {
  const body = await request.json();
  const item = createMenuItem({
    name: body.name,
    desc: body.desc || '',
    price: Number(body.price) || 0,
    rating: Number(body.rating) || 0,
    badge: body.badge || null,
    image: body.image || '',
    addons: Array.isArray(body.addons) ? body.addons : [],
  });
  return NextResponse.json(item, { status: 201 });
}
