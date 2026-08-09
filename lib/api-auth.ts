import { NextResponse } from 'next/server';
import { verifyAdminSession } from './auth';

export async function withAdminAuth(handler: () => Promise<NextResponse>) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return await handler();
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}