import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    let customToken: string | undefined;
    try {
      const body = await req.json();
      if (body.customToken?.trim()) {
        customToken = body.customToken.trim();
      }
    } catch {
      // JSON body is optional
    }

    const diagnostics = await postexApi.testConnectionAndDiagnose(customToken);

    return NextResponse.json({
      success: diagnostics.configured && diagnostics.citiesCount > 0,
      configured: diagnostics.configured,
      citiesCount: diagnostics.citiesCount,
      addressesCount: diagnostics.addressesCount,
      addresses: diagnostics.addresses,
      message: diagnostics.diagnosticMessage,
      environment: diagnostics.environment,
      baseUrl: diagnostics.baseUrl,
      operationalCitiesSample: diagnostics.operationalCitiesSample,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      configured: false,
      citiesCount: 0,
      addressesCount: 0,
      addresses: [],
      message: error?.message || 'PostEx API connection failed.',
    }, { status: 500 });
  }
}
