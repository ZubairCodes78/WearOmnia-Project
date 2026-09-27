import assert from 'assert';
import { getPublicSiteSettings, getSiteSettings, SENSITIVE_SETTINGS_KEYS } from '../lib/settings';
import { GET as getPublicRoute } from '../app/api/site-settings/route';
import { NotificationService } from '../lib/notifications/notification-service';

async function runSecurityAudit() {
  console.log('🔒 Starting Site Settings Security & Public Exposure Audit...\n');

  // TEST 1: Direct getPublicSiteSettings() sanitization
  console.log('--- Test 1: getPublicSiteSettings() positive allow-list ---');
  const publicSettings = await getPublicSiteSettings();
  
  for (const sensitiveKey of SENSITIVE_SETTINGS_KEYS) {
    assert(
      (publicSettings as any)[sensitiveKey] === undefined,
      `SECURITY VIOLATION: Sensitive key "${sensitiveKey}" was found in getPublicSiteSettings() output!`
    );
  }
  console.log(`✅ Passed: All ${SENSITIVE_SETTINGS_KEYS.length} sensitive keys are strictly excluded from getPublicSiteSettings().`);

  // TEST 2: Essential storefront fields preserved
  console.log('\n--- Test 2: Essential storefront public fields preserved ---');
  assert(typeof publicSettings.businessName === 'string', 'businessName should be a string');
  assert(typeof publicSettings.whatsappNumber === 'string', 'whatsappNumber should be a string');
  assert(typeof publicSettings.storeEmail === 'string', 'storeEmail should be a string');
  assert(typeof publicSettings.flatShippingFee === 'number', 'flatShippingFee should be a number');
  assert(typeof publicSettings.freeShippingThreshold === 'number', 'freeShippingThreshold should be a number');
  assert(typeof publicSettings.codCharge === 'number', 'codCharge should be a number');
  assert(typeof publicSettings.supportHours === 'string', 'supportHours should be a string');
  console.log('✅ Passed: All required storefront fields (businessName, whatsappNumber, storeEmail, shipping, etc.) are intact.');

  // TEST 3: Direct API Route GET /api/site-settings execution
  console.log('\n--- Test 3: Public API route GET /api/site-settings simulation ---');
  const routeResponse = await getPublicRoute();
  assert.strictEqual(routeResponse.status, 200, 'GET /api/site-settings should return 200 OK');
  
  const responseData = await routeResponse.json();
  assert(responseData.settings, 'Response must contain a "settings" object');
  
  const serializedJson = JSON.stringify(responseData.settings);
  
  for (const sensitiveKey of SENSITIVE_SETTINGS_KEYS) {
    assert(
      responseData.settings[sensitiveKey] === undefined,
      `SECURITY VIOLATION: Public route response contains sensitive key "${sensitiveKey}"!`
    );
    assert(
      !serializedJson.includes(`"${sensitiveKey}":`),
      `SECURITY VIOLATION: Serialized JSON contains key "${sensitiveKey}"!`
    );
  }
  console.log('✅ Passed: Serialized HTTP response contains zero sensitive keys or credentials.');

  // TEST 4: Server-side getSiteSettings() still retains full configuration
  console.log('\n--- Test 4: Server-side getSiteSettings() intact for Admin & Background Services ---');
  const fullServerSettings = await getSiteSettings();
  assert(fullServerSettings !== null, 'getSiteSettings() must return full settings');
  assert(
    'whatsapp_verify_token' in fullServerSettings,
    'Server-side settings must retain whatsapp_verify_token for webhook validation'
  );
  assert(
    'postex_enabled' in fullServerSettings,
    'Server-side settings must retain postex_enabled for shipping calculations'
  );
  console.log('✅ Passed: Server-side getSiteSettings() retains complete administrative and courier settings.');

  // TEST 5: NotificationService.getSettings() properly resolves
  console.log('\n--- Test 5: NotificationService.getSettings() resolves for WhatsApp engine ---');
  const notificationSettings = await NotificationService.getSettings();
  assert(notificationSettings !== null, 'NotificationService.getSettings() must return settings');
  assert(
    typeof notificationSettings.whatsapp_verify_token === 'string',
    'NotificationService must resolve whatsapp_verify_token'
  );
  console.log('✅ Passed: NotificationService.getSettings() successfully loads configuration.');

  console.log('\n========================================');
  console.log('🎉 ALL 5 SECURITY TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runSecurityAudit().catch((err) => {
  console.error('\n❌ Security audit failed:', err);
  process.exit(1);
});
