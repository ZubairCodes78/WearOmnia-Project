import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionWithDevice } from '@/lib/auth';
import { saveCampaignAsset } from '@/lib/storage';
import { recordAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawVariant = String(formData.get('variant') || 'desktop').toLowerCase();
    const variant: 'desktop' | 'mobile' = rawVariant === 'mobile' ? 'mobile' : 'desktop';

    if (!file) {
      return NextResponse.json({ error: 'No banner image file provided.' }, { status: 400 });
    }

    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPEG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Banner size exceeds maximum allowed limit of 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveCampaignAsset(buffer, file.type, variant);

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload campaign asset.' },
        { status: 400 }
      );
    }

    await recordAuditLog(
      'CAMPAIGN_ASSET_UPLOADED',
      'Campaign',
      undefined,
      `Uploaded ${variant} campaign banner (${file.name}, ${file.size} bytes) -> ${result.url}`
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      variant,
      filename: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Campaign asset upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload campaign asset.' },
      { status: 500 }
    );
  }
}

