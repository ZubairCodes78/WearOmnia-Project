import { NextResponse } from 'next/server';
import { getPreOrderCampaignConfig } from '@/lib/coupons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const config = await getPreOrderCampaignConfig();
    return NextResponse.json(
      { success: true, campaign: config },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching pre-order campaign config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch campaign configuration' },
      { status: 500 }
    );
  }
}
