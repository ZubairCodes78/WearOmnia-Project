import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!postexApi.isConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'PostEx API is not configured. POSTEX_API_TOKEN is missing in server environment.',
      });
    }

    // Live connectivity check against PostEx Operational Cities API
    const pingRes = await postexApi.getOperationalCities();

    if (!pingRes.success) {
      return NextResponse.json({
        success: false,
        configured: true,
        message: `PostEx API Error: ${pingRes.message || 'Could not connect to PostEx API.'}`,
      });
    }

    const cityCount = pingRes.cities?.length || 0;

    return NextResponse.json({
      success: true,
      configured: true,
      citiesCount: cityCount,
      message: `PostEx connection successful! Connected to ${cityCount} operational delivery cities.`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      configured: false,
      message: error?.message || 'PostEx API connection failed.',
    }, { status: 500 });
  }
}

