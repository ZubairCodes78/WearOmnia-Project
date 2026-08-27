import { NextResponse } from 'next/server';
import { verifyAdminSession, hashPassword, verifyPassword, getAdminById, COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';
import { clearFailedLoginAttempts } from '@/lib/rate-limit';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Get current admin
    const cookieStore = await cookies();
    const adminId = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!adminId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, admin.password);
    if (!isValidPassword) {
      await recordAuditLog('PASSWORD_CHANGE_FAILED', 'AdminAuth', adminId, 'Invalid current password');
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedNewPassword }
    });

    await clearFailedLoginAttempts(admin.email, adminId);
    await recordAuditLog('PASSWORD_CHANGED', 'AdminAuth', adminId, 'Admin password changed successfully');

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}