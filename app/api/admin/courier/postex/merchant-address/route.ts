import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cityName = searchParams.get('cityName') || undefined;

    const res = await postexApi.getMerchantAddresses({ cityName });
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to fetch merchant addresses from PostEx' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      addresses: res.addresses,
      total: res.addresses.length,
      message: res.message,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching merchant addresses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { address, addressTypeId, cityName, contactPersonName, phone1, phone2, phone3, wareHouseManagerName } = body;

    if (!address || !cityName || !contactPersonName || !phone1 || !phone2) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: address, cityName, contactPersonName, phone1, and phone2 are required.' },
        { status: 400 }
      );
    }

    const res = await postexApi.createMerchantAddress({
      address,
      addressTypeId: addressTypeId === 1 ? 1 : 2, // 1 = Return, 2 = Pickup
      cityName,
      contactPersonName,
      phone1,
      phone2,
      phone3,
      wareHouseManagerName,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to create merchant address on PostEx' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.data, message: res.message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error creating merchant address' }, { status: 500 });
  }
}
