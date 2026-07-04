import { NextResponse } from 'next/server';
import { setFakeAdminSession } from '@/lib/server/fake-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await setFakeAdminSession(email.trim());

    return NextResponse.json({
      message: 'Login successful',
      user: { email: email.trim() },
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
