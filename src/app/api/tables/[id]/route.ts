import { NextRequest, NextResponse } from 'next/server';
import { deleteTable, findTableById } from '@/lib/server/dummy-db';

// GET /api/tables/:id -> validate a scanned QR code and get the table label
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const table = findTableById(Number(id));
  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }
  return NextResponse.json({ table });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = deleteTable(Number(id));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Table not found' ? 404 : 409 });
  }
  return NextResponse.json({ success: true });
}
