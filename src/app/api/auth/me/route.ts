import { NextResponse } from 'next/server';
import { getFakeAdminUser } from '@/lib/server/fake-auth';

export async function GET() {
  const user = await getFakeAdminUser();
  return NextResponse.json({ user });
}
