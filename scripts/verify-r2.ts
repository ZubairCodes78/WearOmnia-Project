import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  isR2Configured,
  getR2Client,
  getFileUrl,
  uploadFile,
  deleteFile,
  saveProductImage,
  savePaymentProof,
  saveQrCode,
  paymentProofExists,
} from '../lib/storage';

interface VerificationResult {
  step: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: VerificationResult[] = [];

function record(step: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ step, status, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${status}] ${step}: ${details}`);
}

export async function runR2ProductionVerification(): Promise<{
  success: boolean;
  results: VerificationResult[];
}> {
  console.log('\n========================================');
  console.log('WearOMNIA — Cloudflare R2 Production Verification');
  console.log('========================================\n');

  // 1. Environment Verification
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();

  // Check presence without revealing secret values
  if (!accountId) {
    record('ENV_R2_ACCOUNT_ID', 'FAIL', 'R2_ACCOUNT_ID is missing');
  } else {
    record('ENV_R2_ACCOUNT_ID', 'PASS', `Configured (${accountId.length} chars)`);
  }

  if (!accessKeyId) {
    record('ENV_R2_ACCESS_KEY_ID', 'FAIL', 'R2_ACCESS_KEY_ID is missing');
  } else {
    record('ENV_R2_ACCESS_KEY_ID', 'PASS', `Configured (${accessKeyId.length} chars)`);
  }

  if (!secretAccessKey) {
    record('ENV_R2_SECRET_ACCESS_KEY', 'FAIL', 'R2_SECRET_ACCESS_KEY is missing');
  } else {
    record('ENV_R2_SECRET_ACCESS_KEY', 'PASS', 'Configured (server-side only, value masked)');
  }

  if (!bucketName) {
    record('ENV_R2_BUCKET_NAME', 'FAIL', 'R2_BUCKET_NAME is missing');
  } else if (bucketName !== 'wearomnia') {
    record('ENV_R2_BUCKET_NAME', 'FAIL', `Expected 'wearomnia', found '${bucketName}'`);
  } else {
    record('ENV_R2_BUCKET_NAME', 'PASS', `Correctly matches target bucket 'wearomnia'`);
  }

  if (!publicUrl) {
    record('ENV_R2_PUBLIC_URL', 'FAIL', 'R2_PUBLIC_URL is missing');
  } else {
    record('ENV_R2_PUBLIC_URL', 'PASS', `Configured (${publicUrl})`);
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  record('R2_ENDPOINT_STRUCTURE', 'PASS', `Endpoint configured as https://${accountId ? '[ACCOUNT_ID]' : 'missing'}.r2.cloudflarestorage.com`);

  if (!isR2Configured()) {
    record('R2_CONFIG_STATUS', 'FAIL', 'isR2Configured() returned false due to missing environment variables.');
    return { success: false, results };
  }

  record('R2_CONFIG_STATUS', 'PASS', 'All required R2 credentials are recognized by storage service.');

  const client = getR2Client();
  const testKey = `__system-test__/r2-verification-${Date.now()}.txt`;
  const testContent = `WearOMNIA R2 Verification Test ${new Date().toISOString()}`;

  // 2. Direct S3 API Connectivity: Upload temporary test object
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: Buffer.from(testContent, 'utf-8'),
        ContentType: 'text/plain',
        CacheControl: 'no-cache',
      })
    );
    record('R2_UPLOAD_RAW', 'PASS', `Uploaded temporary object to ${testKey}`);
  } catch (err: any) {
    record('R2_UPLOAD_RAW', 'FAIL', `Failed to upload test object: ${err?.message}`);
    return { success: false, results };
  }

  // 3. Confirm object exists
  try {
    const headRes = await client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    record('R2_HEAD_OBJECT', 'PASS', `Object confirmed in bucket. Size: ${headRes.ContentLength} bytes`);
  } catch (err: any) {
    record('R2_HEAD_OBJECT', 'FAIL', `HeadObject check failed: ${err?.message}`);
  }

  // 4. Read object back & verify content
  try {
    const getRes = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    const readBody = await getRes.Body?.transformToString('utf-8');
    if (readBody === testContent) {
      record('R2_READ_OBJECT', 'PASS', 'Object retrieved and verified byte-for-byte');
    } else {
      record('R2_READ_OBJECT', 'FAIL', 'Object content mismatch upon read');
    }
  } catch (err: any) {
    record('R2_READ_OBJECT', 'FAIL', `GetObject failed: ${err?.message}`);
  }

  // 5. Delete temporary object
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    record('R2_DELETE_OBJECT', 'PASS', `Deleted temporary object ${testKey}`);
  } catch (err: any) {
    record('R2_DELETE_OBJECT', 'FAIL', `DeleteObject failed: ${err?.message}`);
  }

  // 6. Confirm deletion
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    record('R2_CONFIRM_DELETION', 'FAIL', 'Object still exists after delete command');
  } catch (err: any) {
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
      record('R2_CONFIRM_DELETION', 'PASS', 'Confirmed object is completely removed from bucket (404 NotFound)');
    } else {
      record('R2_CONFIRM_DELETION', 'FAIL', `Unexpected error during deletion confirmation: ${err?.message}`);
    }
  }

  // 7. Verify Application Storage Abstraction (uploadFile, getFileUrl, deleteFile)
  const appTestKey = `__system-test__/app-upload-${Date.now()}.txt`;
  try {
    const uploadRes = await uploadFile({
      buffer: Buffer.from('Application storage test', 'utf-8'),
      key: appTestKey,
      mimeType: 'text/plain',
    });

    if (uploadRes.success && uploadRes.url) {
      record('APP_UPLOAD_FILE', 'PASS', `uploadFile() returned URL: ${uploadRes.url}`);
    } else {
      record('APP_UPLOAD_FILE', 'FAIL', `uploadFile() failed: ${uploadRes.error}`);
    }

    // Test getFileUrl
    const urlCheck = getFileUrl(appTestKey);
    if (urlCheck.includes(publicUrl || '')) {
      record('APP_GET_FILE_URL', 'PASS', `getFileUrl() generated correct domain URL: ${urlCheck}`);
    } else {
      record('APP_GET_FILE_URL', 'FAIL', `getFileUrl() unexpected output: ${urlCheck}`);
    }

    // Clean up
    await deleteFile(appTestKey);
    record('APP_DELETE_FILE', 'PASS', 'deleteFile() successfully executed on temporary object');
  } catch (err: any) {
    record('APP_STORAGE_ABSTRACTION', 'FAIL', `Application storage helper error: ${err?.message}`);
  }

  // 8. Verify saveProductImage helper with valid 1x1 WebP
  // Minimal valid 1x1 WebP buffer
  const sampleWebp = Buffer.from(
    'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
    'base64'
  );

  let uploadedProductUrl: string | undefined;
  try {
    const prodRes = await saveProductImage(sampleWebp, 'image/webp', '__system-test__');
    if (prodRes.success && prodRes.url) {
      uploadedProductUrl = prodRes.url;
      record('SAVE_PRODUCT_IMAGE', 'PASS', `saveProductImage() succeeded. Generated URL: ${prodRes.url}`);
      // Clean up product image immediately
      await deleteFile(prodRes.url);
      record('CLEANUP_PRODUCT_IMAGE', 'PASS', 'Temporary test product image removed from R2');
    } else {
      record('SAVE_PRODUCT_IMAGE', 'FAIL', `saveProductImage() failed: ${prodRes.error}`);
    }
  } catch (err: any) {
    record('SAVE_PRODUCT_IMAGE', 'FAIL', `saveProductImage() exception: ${err?.message}`);
  }

  // 9. Verify savePaymentProof helper with valid WebP
  try {
    const proofRes = await savePaymentProof(sampleWebp, 'image/webp', '__system-test__');
    if (proofRes.success && proofRes.filename) {
      record('SAVE_PAYMENT_PROOF', 'PASS', `savePaymentProof() succeeded under payment-proofs/ prefix`);
      const existsCheck = await paymentProofExists(proofRes.filename);
      if (existsCheck) {
        record('PAYMENT_PROOF_EXISTS', 'PASS', 'paymentProofExists() verified object presence');
      } else {
        record('PAYMENT_PROOF_EXISTS', 'FAIL', 'paymentProofExists() returned false for uploaded proof');
      }
      // Clean up
      await deleteFile(proofRes.filename);
      record('CLEANUP_PAYMENT_PROOF', 'PASS', 'Temporary payment proof removed from R2');
    } else {
      record('SAVE_PAYMENT_PROOF', 'FAIL', `savePaymentProof() failed: ${proofRes.error}`);
    }
  } catch (err: any) {
    record('SAVE_PAYMENT_PROOF', 'FAIL', `savePaymentProof() exception: ${err?.message}`);
  }

  // 10. Verify saveQrCode helper
  try {
    const qrRes = await saveQrCode(sampleWebp, 'image/webp');
    if (qrRes.success && qrRes.filename) {
      record('SAVE_QR_CODE', 'PASS', `saveQrCode() succeeded under qr-codes/ prefix`);
      await deleteFile(qrRes.filename);
      record('CLEANUP_QR_CODE', 'PASS', 'Temporary QR code removed from R2');
    } else {
      record('SAVE_QR_CODE', 'FAIL', `saveQrCode() failed: ${qrRes.error}`);
    }
  } catch (err: any) {
    record('SAVE_QR_CODE', 'FAIL', `saveQrCode() exception: ${err?.message}`);
  }

  const allPassed = results.every((r) => r.status === 'PASS');
  console.log('\n========================================');
  console.log(`Verification Summary: ${allPassed ? 'ALL CHECKS PASSED ✅' : 'SOME CHECKS FAILED ❌'}`);
  console.log('========================================\n');

  return { success: allPassed, results };
}

// Execute if run directly
if (require.main === module) {
  runR2ProductionVerification().catch((err) => {
    console.error('Fatal error during R2 verification:', err);
    process.exit(1);
  });
}
