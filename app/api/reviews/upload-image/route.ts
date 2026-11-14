import { NextRequest, NextResponse } from 'next/server';
import { validateReviewToken } from '@/lib/reviews';
import { saveReviewImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get('token') as string;
    const file = formData.get('file') as File | null;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Review invitation token is required.' }, { status: 400 });
    }

    // Verify token validity and order eligibility
    const tokenValidation = await validateReviewToken(token);
    if (!tokenValidation.valid) {
      return NextResponse.json({ error: tokenValidation.error || 'Invalid or expired review invitation.' }, { status: 403 });
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Please select an image file to upload.' }, { status: 400 });
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image file size must not exceed 5MB.' }, { status: 400 });
    }

    // MIME type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await saveReviewImage(buffer, file.type, token.slice(0, 10));

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to save review image.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
    });
  } catch (error: any) {
    console.error('Customer review image upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
