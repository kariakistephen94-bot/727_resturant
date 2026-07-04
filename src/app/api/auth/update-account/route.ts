import { NextResponse } from 'next/server';
import { getFakeAdminUser, setFakeAdminSession } from '@/lib/server/fake-auth';

export async function POST(request: Request) {
  try {
    const { email, currentPassword, newPassword, confirmPassword } =
      await request.json();

    const user = await getFakeAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wantsEmailChange =
      typeof email === 'string' &&
      email.trim().length > 0 &&
      email.trim().toLowerCase() !== user.email.toLowerCase();
    const wantsPasswordChange =
      typeof newPassword === 'string' && newPassword.length > 0;

    if (!wantsEmailChange && !wantsPasswordChange) {
      return NextResponse.json({ message: 'No account changes to apply.' });
    }

    if (wantsPasswordChange) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters.' },
          { status: 400 }
        );
      }
      if (
        typeof confirmPassword === 'string' &&
        confirmPassword !== newPassword
      ) {
        return NextResponse.json(
          { error: 'New password and confirmation do not match.' },
          { status: 400 }
        );
      }
      if (currentPassword && newPassword === currentPassword) {
        return NextResponse.json(
          { error: 'Your new password must be different from the current one.' },
          { status: 400 }
        );
      }
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Please enter your current password to make changes.' },
        { status: 400 }
      );
    }

    // No real credential store to verify `currentPassword` against — any
    // non-empty value is accepted, matching the "fake login" approach used
    // for sign in.
    if (wantsEmailChange) {
      await setFakeAdminSession(email.trim());
    }

    const messages: string[] = [];
    if (wantsPasswordChange) messages.push('Your password has been changed.');
    if (wantsEmailChange) messages.push('Your login email has been updated.');

    return NextResponse.json({
      message: messages.join(' ') || 'Account updated successfully.',
      passwordChanged: wantsPasswordChange,
      emailChangePending: false,
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
