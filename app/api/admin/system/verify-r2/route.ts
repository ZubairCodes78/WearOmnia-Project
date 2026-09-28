import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { runR2ProductionVerification } from '@/scripts/verify-r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const testOutcome = await runR2ProductionVerification();

    return NextResponse.json({
      success: testOutcome.success,
      timestamp: new Date().toISOString(),
      results: testOutcome.results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to execute R2 verification' },
      { status: 500 }
    );
  }
}
