import { NextRequest, NextResponse } from 'next/server';
import { closeTableSession, findTableSessionById } from '@/lib/server/dummy-db';

// PATCH /api/table-sessions/:id { action: 'close' }
// Closing confirms payment for the whole table: all session orders are marked
// paid & delivered, then the session ends and the table is free again.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action !== 'close') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }
  if (!findTableSessionById(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const session = closeTableSession(id);
  return NextResponse.json({ session });
}
