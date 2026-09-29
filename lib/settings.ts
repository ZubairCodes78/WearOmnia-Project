import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export interface SiteSettingsData {
  businessName: string;
  whatsappNumber: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  logoUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  supportHours: string;
  flatShippingFee: number;
  freeShippingThreshold: number;
  codCharge: number;
  estimatedDeliveryTime: string;
  deliveryInstructions: string;
  announcementText: string;
  announcementEnabled: boolean;
  announcementLink: string;
  footerAboutText: string;
  copyrightText: string;
  whatsapp_mode: 'DEVELOPMENT' | 'PRODUCTION';
  whatsapp_phone_number_id: string;
  whatsapp_access_token: string;
  whatsapp_verify_token: string;
  whatsapp_app_secret: string;
  whatsapp_admin_phone: string;
  whatsapp_auto_confirm_enabled: boolean;
  whatsapp_customer_notify_enabled: boolean;
  whatsapp_admin_notify_enabled: boolean;
  whatsapp_sound_enabled: boolean;
  // Official PostEx Courier Settings (M-v4.1.9 Specification)
  postex_enabled: boolean;
  postex_api_url: string;
  postex_api_token: string;
  postex_webhook_url: string;
  postex_environment: 'TEST' | 'PRODUCTION';
  postex_pickup_address_code: string;
  postex_store_address_code: string;
  postex_pickup_address_name?: string;
  postex_store_address_name?: string;
  // Legacy optional fields preserved for data compatibility
  postex_api_key?: string;
  postex_merchant_id?: string;
  postex_account_id?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  businessName: 'WearOMNIA',
  whatsappNumber: '03180633323',
  storePhone: '03180633323',
  storeEmail: 'wearomniaa@gmail.com',
  storeAddress: 'Lahore, Pakistan',
  logoUrl: '/logo.png',
  instagramUrl: 'https://www.instagram.com/wearomnia_/',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61579169068040',
  tiktokUrl: 'https://www.tiktok.com/@wearomnia_',
  youtubeUrl: 'https://youtube.com/@wearomnia',
  supportHours: 'Monday – Saturday: 10:00 AM – 8:00 PM',
  flatShippingFee: 250,
  freeShippingThreshold: 10000,
  codCharge: 0,
  estimatedDeliveryTime: '2–3 Business Days',
  deliveryInstructions: 'Please inspect the parcel upon delivery. Cash On Delivery available nationwide across Pakistan.',
  announcementText: 'Nationwide Express Cash On Delivery Across Pakistan • Free Delivery On Orders Above Rs. 10,000',
  announcementEnabled: true,
  announcementLink: '/shop',
  footerAboutText: 'WearOMNIA is a modern luxury fashion brand defining Pakistani fashion with elegant embroidery, rich velvet silhouettes, and premium unstitched lawn collections.',
  copyrightText: '© 2026 WearOMNIA. All Rights Reserved.',
  whatsapp_mode: 'DEVELOPMENT',
  whatsapp_phone_number_id: '',
  whatsapp_access_token: '',
  whatsapp_verify_token: 'wearomnia_secure_webhook_token_2026',
  whatsapp_app_secret: '',
  whatsapp_admin_phone: '923180633323',
  whatsapp_auto_confirm_enabled: true,
  whatsapp_customer_notify_enabled: true,
  whatsapp_admin_notify_enabled: true,
  whatsapp_sound_enabled: true,
  // PostEx Courier Settings Default (Strictly Official M-v4.1.9 Specification)
  postex_enabled: false,
  postex_api_url: 'https://api.postex.pk',
  postex_api_token: '',
  postex_webhook_url: '',
  postex_environment: 'TEST',
  postex_pickup_address_code: '',
  postex_store_address_code: '',
  postex_pickup_address_name: '',
  postex_store_address_name: '',
};

async function _getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { key: 'site_config' },
    });
    if (record) {
      return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(record.value) };
    }
  } catch (e) {
    console.error('Failed to read site settings:', e);
  }
  return DEFAULT_SITE_SETTINGS;
}

export const getSiteSettings = unstable_cache(
  _getSiteSettings,
  ['site-settings'],
  { revalidate: 120, tags: ['site-settings'] },
);

export async function updateSiteSettings(data: Partial<SiteSettingsData>): Promise<SiteSettingsData> {
  const current = await getSiteSettings();
  const updated = { ...current, ...data };

  await prisma.siteSettings.upsert({
    where: { key: 'site_config' },
    update: { value: JSON.stringify(updated) },
    create: { key: 'site_config', value: JSON.stringify(updated) },
  });

  return updated;
}

/**
 * Public Customer-Facing Site Settings (Strict Positive Allow-List)
 * NEVER includes tokens, secrets, credentials, or internal courier/WhatsApp keys.
 */
export interface PublicSiteSettings {
  businessName: string;
  whatsappNumber: string;
  storePhone: string;
  storeEmail: string;
  supportEmail?: string;
  storeAddress: string;
  logoUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  supportHours: string;
  flatShippingFee: number;
  freeShippingThreshold: number;
  codCharge: number;
  estimatedDeliveryTime: string;
  deliveryInstructions: string;
  announcementText: string;
  announcementEnabled: boolean;
  announcementLink: string;
  footerAboutText: string;
  copyrightText: string;
  shippingPolicyText?: string;
  returnsPolicyText?: string;
  refundPolicyText?: string;
  heroSlides?: any[];
}

/**
 * Sensitive Credential & Internal Keys that MUST NEVER be serialized in public responses
 */
export const SENSITIVE_SETTINGS_KEYS = [
  'whatsapp_access_token',
  'whatsapp_app_secret',
  'whatsapp_verify_token',
  'whatsapp_phone_number_id',
  'whatsapp_admin_phone',
  'whatsapp_mode',
  'whatsapp_auto_confirm_enabled',
  'whatsapp_customer_notify_enabled',
  'whatsapp_admin_notify_enabled',
  'whatsapp_sound_enabled',
  'postex_api_token',
  'postex_api_key',
  'postex_merchant_id',
  'postex_account_id',
  'postex_webhook_url',
  'postex_api_url',
  'postex_pickup_address_code',
  'postex_store_address_code',
  'postex_pickup_address_name',
  'postex_store_address_name',
  'postex_environment',
  'postex_enabled',
] as const;

/**
 * Filters any settings object to return ONLY safe public storefront properties.
 */
export function getPublicSafeSiteSettings(settings: Partial<SiteSettingsData> | Record<string, any>): PublicSiteSettings {
  const safe: PublicSiteSettings = {
    businessName: settings.businessName || DEFAULT_SITE_SETTINGS.businessName,
    whatsappNumber: settings.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber,
    storePhone: settings.storePhone || DEFAULT_SITE_SETTINGS.storePhone,
    storeEmail: settings.storeEmail || DEFAULT_SITE_SETTINGS.storeEmail,
    supportEmail: settings.storeEmail || DEFAULT_SITE_SETTINGS.storeEmail,
    storeAddress: settings.storeAddress || DEFAULT_SITE_SETTINGS.storeAddress,
    logoUrl: settings.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl,
    instagramUrl: settings.instagramUrl || DEFAULT_SITE_SETTINGS.instagramUrl,
    facebookUrl: settings.facebookUrl || DEFAULT_SITE_SETTINGS.facebookUrl,
    tiktokUrl: settings.tiktokUrl || DEFAULT_SITE_SETTINGS.tiktokUrl,
    youtubeUrl: settings.youtubeUrl || DEFAULT_SITE_SETTINGS.youtubeUrl,
    supportHours: settings.supportHours || DEFAULT_SITE_SETTINGS.supportHours,
    flatShippingFee: typeof settings.flatShippingFee === 'number' ? settings.flatShippingFee : DEFAULT_SITE_SETTINGS.flatShippingFee,
    freeShippingThreshold: typeof settings.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : DEFAULT_SITE_SETTINGS.freeShippingThreshold,
    codCharge: typeof settings.codCharge === 'number' ? settings.codCharge : DEFAULT_SITE_SETTINGS.codCharge,
    estimatedDeliveryTime: settings.estimatedDeliveryTime || DEFAULT_SITE_SETTINGS.estimatedDeliveryTime,
    deliveryInstructions: settings.deliveryInstructions || DEFAULT_SITE_SETTINGS.deliveryInstructions,
    announcementText: settings.announcementText || DEFAULT_SITE_SETTINGS.announcementText,
    announcementEnabled: typeof settings.announcementEnabled === 'boolean' ? settings.announcementEnabled : DEFAULT_SITE_SETTINGS.announcementEnabled,
    announcementLink: settings.announcementLink || DEFAULT_SITE_SETTINGS.announcementLink,
    footerAboutText: settings.footerAboutText || DEFAULT_SITE_SETTINGS.footerAboutText,
    copyrightText: settings.copyrightText || DEFAULT_SITE_SETTINGS.copyrightText,
  };

  if ((settings as any).shippingPolicyText) {
    safe.shippingPolicyText = (settings as any).shippingPolicyText;
  }
  if ((settings as any).returnsPolicyText) {
    safe.returnsPolicyText = (settings as any).returnsPolicyText;
  }
  if ((settings as any).refundPolicyText) {
    safe.refundPolicyText = (settings as any).refundPolicyText;
  }
  if (Array.isArray((settings as any).heroSlides)) {
    safe.heroSlides = (settings as any).heroSlides;
  }

  return safe;
}

/**
 * Public Customer-Facing Site Settings (Strict Positive Allow-List)
 * NEVER includes tokens, secrets, credentials, or internal courier/WhatsApp keys.
 */
export interface PublicStoreSettings extends PublicSiteSettings {
  preorder_enabled: boolean;
  preorder_advance_percent: number;
  preorder_payment_instructions: string;
}

/**
 * Retrieves only the sanitized public site settings for client consumption.
 */
export async function getPublicSiteSettings(): Promise<PublicStoreSettings> {
  const [fullSettings, preOrderSettings] = await Promise.all([
    getSiteSettings(),
    getPreOrderSettings(),
  ]);
  const safe = getPublicSafeSiteSettings(fullSettings);
  return {
    ...safe,
    preorder_enabled: Boolean(preOrderSettings.preorder_enabled),
    preorder_advance_percent: typeof preOrderSettings.preorder_advance_percent === 'number' ? preOrderSettings.preorder_advance_percent : 50,
    preorder_payment_instructions: preOrderSettings.preorder_payment_instructions || DEFAULT_PREORDER_SETTINGS.preorder_payment_instructions,
  };
}

/**
 * Pre-Order Configuration Settings
 */
export interface PreOrderSettings {
  preorder_enabled: boolean;
  preorder_advance_percent: number; // 1-100, default 50
  preorder_payment_instructions: string;
}

export const DEFAULT_PREORDER_SETTINGS: PreOrderSettings = {
  preorder_enabled: false,
  preorder_advance_percent: 50,
  preorder_payment_instructions: 'Please transfer the required 50% advance payment to any of our official payment accounts below and upload the payment proof screenshot. Your pre-order will be verified by our team within 24 hours.',
};

async function _getPreOrderSettings(): Promise<PreOrderSettings> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { key: 'preorder_config' },
    });
    if (record) {
      return { ...DEFAULT_PREORDER_SETTINGS, ...JSON.parse(record.value) };
    }
  } catch (e) {
    console.error('Failed to read pre-order settings:', e);
  }
  return DEFAULT_PREORDER_SETTINGS;
}

export const getPreOrderSettings = unstable_cache(
  _getPreOrderSettings,
  ['preorder-settings'],
  { revalidate: 120, tags: ['preorder-settings'] },
);

export async function updatePreOrderSettings(data: Partial<PreOrderSettings>): Promise<PreOrderSettings> {
  const current = await getPreOrderSettings();
  const updated = { ...current, ...data };

  await prisma.siteSettings.upsert({
    where: { key: 'preorder_config' },
    update: { value: JSON.stringify(updated) },
    create: { key: 'preorder_config', value: JSON.stringify(updated) },
  });

  return updated;
}