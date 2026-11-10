import { NextResponse } from 'next/server';
import { getLiveCampaignsFresh } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const campaigns = await getLiveCampaignsFresh(now);

    return NextResponse.json(
      {
        success: true,
        campaigns,
        serverTimeMs: now.getTime(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Active campaigns API error:', error);
    return NextResponse.json(
      { success: false, campaigns: [], serverTimeMs: Date.now() },
      { status: 500 }
    );
  }
}

