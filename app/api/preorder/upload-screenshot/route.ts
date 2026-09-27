import { NextRequest, NextResponse } from 'next/server';
import { savePaymentProof } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No screenshot file provided' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum limit of 5MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await savePaymentProof(buffer, file.type || 'image/jpeg');

    if (!result.success || !result.filename) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save screenshot' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      screenshotKey: result.filename,
    });
  } catch (error: any) {
    console.error('Error uploading pre-order screenshot:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while uploading screenshot' },
      { status: 500 }
    );
  }
}
