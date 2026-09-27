import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await prisma.preOrderPaymentMethod.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, methods });
  } catch (error: any) {
    console.error('Error fetching admin payment methods:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      displayName,
      methodType,
      accountTitle,
      accountNumber,
      walletNumber,
      bankName,
      iban,
      instructions,
      isActive,
      displayOrder,
    } = body;

    if (!displayName || !methodType || !accountTitle || !accountNumber) {
      return NextResponse.json(
        { error: 'Display Name, Method Type, Account Title, and Account Number are required' },
        { status: 400 }
      );
    }

    const method = await prisma.preOrderPaymentMethod.create({
      data: {
        displayName: displayName.trim(),
        methodType: methodType.trim(),
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim(),
        walletNumber: walletNumber ? walletNumber.trim() : null,
        bankName: bankName ? bankName.trim() : null,
        iban: iban ? iban.trim() : null,
        instructions: instructions ? instructions.trim() : null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      },
    });

    await recordAuditLog(
      'CREATE_PREORDER_PAYMENT_METHOD',
      'PreOrderPaymentMethod',
      method.id,
      `Created payment method: ${method.displayName} (${method.methodType})`
    );

    return NextResponse.json({ success: true, method });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      displayName,
      methodType,
      accountTitle,
      accountNumber,
      walletNumber,
      bankName,
      iban,
      instructions,
      isActive,
      displayOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    const method = await prisma.preOrderPaymentMethod.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName: displayName.trim() }),
        ...(methodType !== undefined && { methodType: methodType.trim() }),
        ...(accountTitle !== undefined && { accountTitle: accountTitle.trim() }),
        ...(accountNumber !== undefined && { accountNumber: accountNumber.trim() }),
        ...(walletNumber !== undefined && { walletNumber: walletNumber ? walletNumber.trim() : null }),
        ...(bankName !== undefined && { bankName: bankName ? bankName.trim() : null }),
        ...(iban !== undefined && { iban: iban ? iban.trim() : null }),
        ...(instructions !== undefined && { instructions: instructions ? instructions.trim() : null }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    await recordAuditLog(
      'UPDATE_PREORDER_PAYMENT_METHOD',
      'PreOrderPaymentMethod',
      method.id,
      `Updated payment method: ${method.displayName}`
    );

    return NextResponse.json({ success: true, method });
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    const deleted = await prisma.preOrderPaymentMethod.delete({
      where: { id },
    });

    await recordAuditLog(
      'DELETE_PREORDER_PAYMENT_METHOD',
      'PreOrderPaymentMethod',
      id,
      `Deleted payment method: ${deleted.displayName}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}
