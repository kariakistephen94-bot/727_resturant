import { NextRequest, NextResponse } from 'next/server';
import { listTableSessions } from '@/lib/server/dummy-db';

// GET /api/table-sessions?status=open -> sessions with their orders and running total
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  const sessions = listTableSessions(
    status === 'open' || status === 'closed' ? status : undefined
  );
  return NextResponse.json({ sessions });
}
