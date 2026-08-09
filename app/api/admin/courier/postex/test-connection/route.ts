import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const settings = await getSiteSettings();

    const apiKey = body.postex_api_key ?? settings.postex_api_key ?? '';
    const apiToken = body.postex_api_token ?? settings.postex_api_token ?? '';
    const enabled = body.postex_enabled ?? settings.postex_enabled ?? false;

    if (!enabled || (!apiKey && !apiToken)) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'PostEx API is not configured.',
      });
    }

    // Future Live PostEx API Ping Check Endpoint
    // When official PostEx API endpoint documentation is provided:
    // const res = await fetch(`${baseUrl}/ping`, ...);

    return NextResponse.json({
      success: true,
      configured: true,
      message: 'PostEx API credentials detected. Ready for live endpoint testing.',
    });
  } catch (error) {
    console.error('PostEx Test Connection Error:', error);
    return NextResponse.json({
      success: false,
      configured: false,
      message: 'PostEx API is not configured.',
    }, { status: 500 });
  }
}
