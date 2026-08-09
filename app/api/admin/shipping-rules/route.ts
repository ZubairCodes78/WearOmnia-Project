import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rules = await prisma.shippingRule.findMany({
      orderBy: { city: 'asc' },
    });
    return NextResponse.json({ rules });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch shipping rules' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { city, province, charge, freeShippingMinAmount } = await req.json();

    if (!city || !province) {
      return NextResponse.json({ error: 'City and Province are required' }, { status: 400 });
    }

    const rule = await prisma.shippingRule.upsert({
      where: { city },
      create: {
        city,
        province,
        charge: parseFloat(charge || '250'),
        freeShippingMinAmount: parseFloat(freeShippingMinAmount || '10000'),
      },
      update: {
        province,
        charge: parseFloat(charge || '250'),
        freeShippingMinAmount: parseFloat(freeShippingMinAmount || '10000'),
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create/update shipping rule' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Shipping rule ID is required' }, { status: 400 });
    }

    await prisma.shippingRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete shipping rule' }, { status: 500 });
  }
}
