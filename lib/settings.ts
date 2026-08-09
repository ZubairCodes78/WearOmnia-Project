import { prisma } from '@/lib/prisma';

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
  // PostEx Courier Settings
  postex_enabled: boolean;
  postex_api_url: string;
  postex_api_key: string;
  postex_api_token: string;
  postex_merchant_id: string;
  postex_account_id: string;
  postex_webhook_url: string;
  postex_environment: 'TEST' | 'PRODUCTION';
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
  // PostEx Courier Settings Default (EMPTY credentials)
  postex_enabled: false,
  postex_api_url: '',
  postex_api_key: '',
  postex_api_token: '',
  postex_merchant_id: '',
  postex_account_id: '',
  postex_webhook_url: '',
  postex_environment: 'TEST',
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
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