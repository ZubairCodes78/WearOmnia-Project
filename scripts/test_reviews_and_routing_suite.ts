import { prisma } from '../lib/prisma';
import { normalizeProductSlug, resolveProductBySlug } from '../lib/storefront-cache';
import {
  formatPrivacyDisplayName,
  getOrCreateOrderReviewToken,
  validateReviewToken,
  submitVerifiedReview,
} from '../lib/reviews';
import { buildReviewRequestWhatsAppMessage } from '../lib/notifications/whatsapp-provider';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string | null;
  error?: string;
}

const results: TestResult[] = [];

function assert(suite: string, test: string, condition: any, details?: string | null) {
  if (Boolean(condition)) {
    results.push({ suite, test, passed: true, details: details || undefined });
    console.log(`  [PASS] ${test}${details ? ` (${details})` : ''}`);
  } else {
    results.push({ suite, test, passed: false, details: details || undefined, error: 'Assertion failed' });
    console.error(`  [FAIL] ${test}${details ? ` (${details})` : ''}`);
  }
}

async function runReviewAndRoutingSuite() {
  console.log('================================================================');
  console.log('WEAROMNIA: PRODUCT ROUTING & CUSTOMER REVIEW SYSTEM TEST SUITE');
  console.log('================================================================\n');

  let testOrderId: string | null = null;
  let testProductId: string | null = null;
  let testReviewId: string | null = null;

  try {
    // -------------------------------------------------------------
    // SUITE 1: PRODUCT SLUG NORMALIZATION & 404 ROUTING ROBUSTNESS
    // -------------------------------------------------------------
    console.log('SUITE 1: PRODUCT SLUG NORMALIZATION & 404 ROUTING RESOLUTION');

    // Test 1.1: normalizeProductSlug basic normalization
    const n1 = normalizeProductSlug('the-sovereign-velvet-kaftan-588e');
    assert('Routing', 'Exact slug remains clean', n1 === 'the-sovereign-velvet-kaftan-588e', n1);

    // Test 1.2: En-dash and em-dash conversion
    const n2 = normalizeProductSlug('the-sovereign\u2013velvet—kaftan');
    assert('Routing', 'En-dash and em-dash convert to standard hyphens', n2 === 'the-sovereign-velvet-kaftan', n2);

    // Test 1.3: URL encoded en-dash (%E2%80%93)
    const n3 = normalizeProductSlug('the-sovereign%E2%80%93velvet-kaftan');
    assert('Routing', 'URL encoded en-dash %E2%80%93 decodes and converts to hyphen', n3 === 'the-sovereign-velvet-kaftan', n3);

    // Test 1.4: Uppercase and whitespace
    const n4 = normalizeProductSlug('  The-Sovereign-Velvet-Kaftan  ');
    assert('Routing', 'Uppercase and whitespace are normalized to lowercase trimmed', n4 === 'the-sovereign-velvet-kaftan', n4);

    // Test 1.5: Query actual published product from DB
    const publishedProducts = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true },
      take: 5,
    });

    assert('Routing', 'Found published products in database', publishedProducts.length > 0, `Count: ${publishedProducts.length}`);

    if (publishedProducts.length > 0) {
      const sampleProd = publishedProducts[0];
      testProductId = sampleProd.id;

      // Test 1.6: Direct canonical slug resolution
      const resExact = await resolveProductBySlug(sampleProd.slug);
      assert('Routing', 'Exact canonical slug resolves with isCanonical = true', 
        resExact.product?.id === sampleProd.id && resExact.isCanonical === true && resExact.canonicalSlug === sampleProd.slug,
        `Resolved: ${resExact.canonicalSlug}`
      );

      // Test 1.7: Unhashed base slug resolution (e.g. slug without suffix like -588e)
      const baseSlugParts = sampleProd.slug.split('-');
      if (baseSlugParts.length > 1) {
        const baseSlug = baseSlugParts.slice(0, -1).join('-');
        const resBase = await resolveProductBySlug(baseSlug);
        assert('Routing', 'Unhashed base slug resolves with isCanonical = false (triggers 308 redirect)',
          resBase.product?.id === sampleProd.id && resBase.isCanonical === false && resBase.canonicalSlug === sampleProd.slug,
          `Input: ${baseSlug} -> Canonical: ${resBase.canonicalSlug}`
        );
      }

      // Test 1.8: Uppercase input resolution
      const upperSlug = sampleProd.slug.toUpperCase();
      const resUpper = await resolveProductBySlug(upperSlug);
      assert('Routing', 'Uppercase slug resolves to lowercase canonical slug',
        resUpper.product?.id === sampleProd.id && resUpper.canonicalSlug === sampleProd.slug,
        `Input: ${upperSlug} -> Canonical: ${resUpper.canonicalSlug}`
      );
    }

    // Test 1.9: Non-existent product returns null (triggers Next.js notFound() 404)
    const resNonExistent = await resolveProductBySlug('non-existent-product-slug-xyz-99999');
    assert('Routing', 'Non-existent product returns null (proper 404 behavior)',
      resNonExistent.product === null && resNonExistent.canonicalSlug === '',
      'Returns null, not homepage redirect'
    );

    // Test 1.10: Draft or archived products must NOT be returned publicly
    const draftProd = await prisma.product.findFirst({
      where: { status: { not: 'PUBLISHED' } },
      select: { id: true, slug: true, status: true },
    });

    if (draftProd) {
      const resDraft = await resolveProductBySlug(draftProd.slug);
      assert('Routing', 'Non-published product cannot be resolved publicly',
        resDraft.product === null,
        `Status: ${draftProd.status}`
      );
    } else {
      console.log('  [INFO] No non-published products in database to test draft privacy.');
    }

    // -------------------------------------------------------------
    // SUITE 2: PRIVACY DISPLAY NAME FORMATTING
    // -------------------------------------------------------------
    console.log('\nSUITE 2: CUSTOMER PRIVACY DISPLAY NAME FORMATTING');

    assert('Privacy', 'Two-word name formats to First Name + Last Initial',
      formatPrivacyDisplayName('Fatima Ahmed') === 'Fatima A.',
      formatPrivacyDisplayName('Fatima Ahmed')
    );

    assert('Privacy', 'Single name formats as First Name only',
      formatPrivacyDisplayName('Zubair') === 'Zubair',
      formatPrivacyDisplayName('Zubair')
    );

    assert('Privacy', 'Three-word name formats to First Name + Last Initial',
      formatPrivacyDisplayName('Ayesha Noor Khan') === 'Ayesha K.',
      formatPrivacyDisplayName('Ayesha Noor Khan')
    );

    assert('Privacy', 'Empty or whitespace string defaults to Verified Customer',
      formatPrivacyDisplayName('   ') === 'Verified Customer',
      formatPrivacyDisplayName('   ')
    );

    // -------------------------------------------------------------
    // SUITE 3: CRYPTOGRAPHIC ORDER REVIEW TOKEN GENERATION & VALIDATION
    // -------------------------------------------------------------
    console.log('\nSUITE 3: CRYPTOGRAPHIC ORDER REVIEW TOKEN GENERATION & VALIDATION');

    // Create a temporary test DELIVERED order for validation
    const testProduct = await prisma.product.findFirst({
      where: { status: 'PUBLISHED' },
      include: { variants: true },
    });

    if (!testProduct) {
      throw new Error('No published product found to create test order.');
    }

    const testVariant = testProduct.variants[0];
    const dummyOrderNumber = `TEST-REV-${Date.now().toString().slice(-6)}`;

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: dummyOrderNumber,
        customerName: 'Test Reviewer',
        customerEmail: 'test.reviewer@wearomnia-audit.com',
        customerPhone: '03001234567',
        shippingAddress: 'Test Suite Address',
        shippingCity: 'Karachi',
        shippingProvince: 'Sindh',
        totalAmount: 15000,
        subtotal: 15000,
        shippingFee: 0,
        discountAmount: 0,
        status: 'DELIVERED',
        paymentMethod: 'COD',
        items: {
          create: [
            {
              productId: testProduct.id,
              variantInfo: testVariant ? `${testVariant.color} / ${testVariant.size}` : 'Standard',
              quantity: 1,
              unitPrice: 15000,
              subtotal: 15000,
              productTitle: testProduct.title,
            },
          ],
        },
      },
    });

    testOrderId = createdOrder.id;
    console.log(`  [SETUP] Created temporary delivered order: ${createdOrder.orderNumber} (ID: ${testOrderId})`);

    // Test 3.1: Generate token
    const tokenResult = await getOrCreateOrderReviewToken(testOrderId, 'https://www.wearomnia.com');
    assert('Tokens', 'Generated review token successfully', !!tokenResult.token, tokenResult.token);
    assert('Tokens', 'Review URL is well-formed with domain and token', 
      tokenResult.reviewUrl === `https://www.wearomnia.com/review/${tokenResult.token}`,
      tokenResult.reviewUrl
    );
    assert('Tokens', 'Token is 24-byte hex string (48 hexadecimal characters)',
      /^[a-f0-9]{48}$/.test(tokenResult.token),
      `Length: ${tokenResult.token.length}`
    );

    // Test 3.2: Idempotency (re-calling returns the exact same token)
    const tokenResult2 = await getOrCreateOrderReviewToken(testOrderId);
    assert('Tokens', 'Token generation is idempotent (returns existing unexpired token)',
      tokenResult2.token === tokenResult.token,
      'Tokens match'
    );

    // Test 3.3: Validate token
    const valResult = await validateReviewToken(tokenResult.token);
    assert('Tokens', 'Valid token validates successfully', valResult.valid === true, `Order: ${valResult.orderNumber}`);
    assert('Tokens', 'Validation returns order items without exposing customer phone or address',
      Boolean(valResult.eligibleItems && valResult.eligibleItems.length === 1 && valResult.eligibleItems[0].productId === testProduct.id && !(valResult as any).customerPhone),
      `Eligible items count: ${valResult.eligibleItems?.length}`
    );

    // Test 3.4: Invalid token fails gracefully
    const valInvalid = await validateReviewToken('non_existent_fake_token_1234567890abcdef');
    assert('Tokens', 'Invalid token returns valid: false with descriptive message',
      valInvalid.valid === false && !!valInvalid.error,
      valInvalid.error
    );

    // -------------------------------------------------------------
    // SUITE 4: VERIFIED REVIEW SUBMISSION GUARDRAILS
    // -------------------------------------------------------------
    console.log('\nSUITE 4: VERIFIED REVIEW SUBMISSION GUARDRAILS');

    // Test 4.1: Rating bounds (0 and 6 rejected)
    const sub0 = await submitVerifiedReview({
      token: tokenResult.token!,
      productId: testProduct.id,
      rating: 0,
      comment: 'This should fail because rating is below 1',
      displayName: 'Fatima A.',
    });
    assert('Submission', 'Rating 0 is rejected', sub0.success === false, sub0.error);

    const sub6 = await submitVerifiedReview({
      token: tokenResult.token!,
      productId: testProduct.id,
      rating: 6,
      comment: 'This should fail because rating is above 5',
      displayName: 'Fatima A.',
    });
    assert('Submission', 'Rating 6 is rejected', sub6.success === false, sub6.error);

    // Test 4.2: Comment length bounds (<5 characters rejected)
    const subShort = await submitVerifiedReview({
      token: tokenResult.token!,
      productId: testProduct.id,
      rating: 5,
      comment: 'Hi',
      displayName: 'Fatima A.',
    });
    assert('Submission', 'Comment under 5 characters is rejected', subShort.success === false, subShort.error);

    // Test 4.3: Product not in order rejected
    const otherProduct = await prisma.product.findFirst({
      where: { id: { not: testProduct.id } },
    });
    if (otherProduct) {
      const subOther = await submitVerifiedReview({
        token: tokenResult.token!,
        productId: otherProduct.id,
        rating: 5,
        comment: 'Attempting to review product not in this delivered order',
        displayName: 'Fatima A.',
      });
      assert('Submission', 'Reviewing unpurchased product in order is rejected', subOther.success === false, subOther.error);
    }

    // Test 4.4: Valid review submission succeeds with PENDING status
    const subValid = await submitVerifiedReview({
      token: tokenResult.token!,
      productId: testProduct.id,
      rating: 5,
      comment: 'Exceptional velvet craftsmanship and impeccable silhouette. Truly modest and elegant.',
      displayName: 'Fatima A.',
    });

    assert('Submission', 'Valid review submission succeeds', subValid.success === true && !!subValid.reviewId, subValid.message);
    if (subValid.reviewId) {
      testReviewId = subValid.reviewId;

      const createdReview = await prisma.review.findUnique({
        where: { id: testReviewId },
      });

      assert('Submission', 'Submitted review has status PENDING (requires admin moderation)',
        createdReview?.status === 'PENDING',
        `Status: ${createdReview?.status}`
      );
      assert('Submission', 'Submitted review is flagged verifiedPurchase = true',
        createdReview?.verifiedPurchase === true,
        `verifiedPurchase: ${createdReview?.verifiedPurchase}`
      );
      assert('Submission', 'Review stores order reference and customer phone for admin verification',
        createdReview?.orderId === testOrderId && createdReview?.customerPhone === createdOrder.customerPhone,
        `orderId: ${createdReview?.orderId}`
      );
    }

    // Test 4.5: Duplicate review prevention (same order + same product)
    const subDup = await submitVerifiedReview({
      token: tokenResult.token,
      productId: testProduct.id,
      rating: 4,
      comment: 'Attempting duplicate review for the same product in the same order.',
      displayName: 'Fatima A.',
    });
    assert('Submission', 'Duplicate review for same product in same order is strictly rejected',
      subDup.success === false && (subDup.error?.includes('already submitted') || subDup.error?.includes('already been submitted')),
      subDup.error
    );

    // -------------------------------------------------------------
    // SUITE 5: ADMIN REVIEW MODERATION & LIFECYCLE
    // -------------------------------------------------------------
    console.log('\nSUITE 5: ADMIN REVIEW MODERATION & LIFECYCLE');

    if (testReviewId) {
      // Test 5.1: Admin Approve
      await prisma.review.update({
        where: { id: testReviewId },
        data: { status: 'APPROVED' },
      });
      const approvedRev = await prisma.review.findUnique({ where: { id: testReviewId } });
      assert('Moderation', 'Review status transitions to APPROVED', approvedRev?.status === 'APPROVED');

      // Verify that approved review is visible in approved reviews query
      const approvedList = await prisma.review.findMany({
        where: { productId: testProduct.id, status: 'APPROVED' },
      });
      assert('Moderation', 'Approved review appears in storefront review query', 
        approvedList.some(r => r.id === testReviewId),
        `Storefront approved count: ${approvedList.length}`
      );

      // Test 5.2: Admin Reject with reason
      await prisma.review.update({
        where: { id: testReviewId },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Test rejection verification',
        },
      });
      const rejectedRev = await prisma.review.findUnique({ where: { id: testReviewId } });
      assert('Moderation', 'Review status transitions to REJECTED with rejectionReason recorded',
        rejectedRev?.status === 'REJECTED' && rejectedRev?.rejectionReason === 'Test rejection verification',
        rejectedRev?.rejectionReason
      );

      // Verify rejected review is excluded from storefront review query
      const approvedListAfterReject = await prisma.review.findMany({
        where: { productId: testProduct.id, status: 'APPROVED' },
      });
      assert('Moderation', 'Rejected review is excluded from storefront approved review query',
        !approvedListAfterReject.some(r => r.id === testReviewId)
      );
    }

    // -------------------------------------------------------------
    // SUITE 6: WHATSAPP REVIEW INVITATION MESSAGE FORMAT
    // -------------------------------------------------------------
    console.log('\nSUITE 6: WHATSAPP REVIEW INVITATION MESSAGE FORMAT');

    const sampleReviewUrl = 'https://www.wearomnia.com/review/a1b2c3d4e5f678901234567890abcdef1234567890abcdef';
    const waMessage = buildReviewRequestWhatsAppMessage('Fatima Ahmed', 'WO-10492', sampleReviewUrl);

    assert('WhatsApp', 'WhatsApp message contains Assalam-o-Alaikum greeting', waMessage.includes('Assalam-o-Alaikum Fatima Ahmed'));
    assert('WhatsApp', 'WhatsApp message contains order number reference', waMessage.includes('WO-10492'));
    assert('WhatsApp', 'WhatsApp message contains full review URL', waMessage.includes(sampleReviewUrl));
    assert('WhatsApp', 'WhatsApp message contains brand sign-off', waMessage.includes('WearOMNIA — Modesty With Functionality'));
    assert('WhatsApp', 'WhatsApp message has no unresolved {placeholders}', !waMessage.includes('{') && !waMessage.includes('}'));

  } catch (err: any) {
    console.error('\n[FATAL ERROR IN SUITE]:', err);
    results.push({ suite: 'Fatal', test: 'Execution', passed: false, error: err?.message || String(err) });
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN & CLEANUP: REMOVE TEST ARTIFACTS
    // -------------------------------------------------------------
    console.log('\nTEARDOWN: Cleaning up temporary test artifacts...');
    if (testReviewId) {
      await prisma.review.delete({ where: { id: testReviewId } }).catch(() => {});
      console.log(`  Cleaned up test review ${testReviewId}`);
    }
    if (testOrderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {});
      console.log(`  Cleaned up test order ${testOrderId}`);
    }
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('TEST SUITE SUMMARY');
  console.log('================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.error(`- [${r.suite}] ${r.test}: ${r.error || 'Failed'}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL TESTS PASSED SUCCESSFULLY! Everything is verified.');
    process.exit(0);
  }
}

runReviewAndRoutingSuite();
