import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { saveProductImage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file was provided for upload.' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPEG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image size exceeds maximum allowed limit of 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saveResult = await saveProductImage(buffer, file.type);

    if (!saveResult.success || !saveResult.url) {
      return NextResponse.json(
        { error: saveResult.error || 'Failed to save product image.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: saveResult.url,
      filename: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading product image:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error uploading product image.' },
      { status: 500 }
    );
  }
}
