// Lightweight stand-in for Supabase auth. There is no real credential store —
// any non-empty email/password "logs in" — we only track *whether* an admin
// session cookie is present so /admin/* stays gated behind the login screen.
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'gj_admin_session';

export interface FakeAdminUser {
  email: string;
}

export async function getFakeAdminUser(): Promise<FakeAdminUser | null> {
  const store = await cookies();
  const value = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    return { email: decodeURIComponent(value) };
  } catch {
    return null;
  }
}

export async function setFakeAdminSession(email: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, encodeURIComponent(email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearFakeAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}
