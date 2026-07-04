import { NextRequest, NextResponse } from 'next/server';
import { createTable, findOpenSessionForTable, listTables } from '@/lib/server/dummy-db';

// GET /api/tables -> all tables, each with its open session id (if any)
export async function GET() {
  const tables = listTables().map((table) => {
    const openSession = findOpenSessionForTable(table.id);
    return { ...table, open_session_id: openSession?.id ?? null };
  });
  return NextResponse.json({ tables });
}

// POST /api/tables { label? } -> create a table (label defaults to its number)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const table = createTable(typeof body.label === 'string' ? body.label : undefined);
  return NextResponse.json({ table }, { status: 201 });
}
