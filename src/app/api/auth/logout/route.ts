import { NextResponse } from 'next/server';
import { clearFakeAdminSession } from '@/lib/server/fake-auth';

export async function POST() {
  try {
    await clearFakeAdminSession();
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
