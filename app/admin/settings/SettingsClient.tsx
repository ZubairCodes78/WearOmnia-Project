'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, Phone, Truck, ShieldAlert, Share2, Megaphone, Info, Lock, MapPin, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';

interface ShippingRule {
  id: string;
  city: string;
  province: string;
  charge: number;
  freeShippingMinAmount: number;
}

interface SettingsClientProps {
  initialSettings: SiteSettingsData;
  initialShippingRules: ShippingRule[];
}

export function SettingsClient({ initialSettings, initialShippingRules }: SettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettingsData>(initialSettings);
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>(initialShippingRules);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState('');
  
  // PostEx test connection state
  const [testingPostEx, setTestingPostEx] = useState(false);
  const [postExTestMessage, setPostExTestMessage] = useState('');

  // PostEx Merchant Addresses state
  const [merchantAddresses, setMerchantAddresses] = useState<Array<{
    addressCode?: string;
    pickupAddressCode?: string;
    cityName: string;
    address: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    isDefault?: boolean;
  }>>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Shipping Rule Modal / New Row Form
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Punjab');
  const [newCharge, setNewCharge] = useState('250');
  const [newMinAmount, setNewMinAmount] = useState('10000');
  const [addingRule, setAddingRule] = useState(false);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage('Settings saved successfully! Storefront updated live.');
        router.refresh();
      } else {
        setMessage('Failed to save settings');
      }
    } catch (e) {
      setMessage('Network error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddShippingRule = async () => {
    if (!newCity || !newProvince) return;
    setAddingRule(true);
    try {
      const res = await fetch('/api/admin/shipping-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: newCity.trim(),
          province: newProvince,
          charge: parseFloat(newCharge || '250'),
          freeShippingMinAmount: parseFloat(newMinAmount || '10000'),
        }),
      });
      const data = await res.json();
      if (res.ok && data.rule) {
        setShippingRules((prev) => {
          const filtered = prev.filter((r) => r.city.toLowerCase() !== data.rule.city.toLowerCase());
          return [...filtered, data.rule];
        });
        setNewCity('');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteShippingRule = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shipping-rules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShippingRules((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    setPasswordMessage('');
    
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPasswordMessage('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage(data.error || 'Failed to change password');
      }
    } catch (e) {
      setPasswordMessage('Network error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTestPostExConnection = async () => {
    setTestingPostEx(true);
    setPostExTestMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customToken: settings.postex_api_token || undefined }),
      });
      const data = await res.json();
      setPostExTestMessage(data.message || (data.success ? 'PostEx connected successfully!' : 'PostEx API is not configured.'));
      if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
        setMerchantAddresses(data.addresses);
        if (!settings.postex_pickup_address_code) {
          const def = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
          const code = def.addressCode || def.pickupAddressCode || '';
          const name = `${def.cityName} - ${def.address}`;
          setSettings((prev) => ({
            ...prev,
            postex_pickup_address_code: code,
            postex_pickup_address_name: name,
          }));
        }
      }
    } catch (e) {
      setPostExTestMessage('PostEx API connection error.');
    } finally {
      setTestingPostEx(false);
    }
  };

  const handleFetchMerchantAddresses = async () => {
    setLoadingAddresses(true);
    setAddressMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/merchant-address');
      const data = await res.json();
      if (!res.ok) {
        setAddressMessage(data.error || 'Failed to fetch PostEx merchant addresses.');
      } else {
        const addresses = data.addresses || [];
        setMerchantAddresses(addresses);
        if (addresses.length > 0) {
          setAddressMessage(`✓ Successfully retrieved ${addresses.length} merchant address(es) from PostEx.`);
          // If no pickup address code is set, auto-select default or first address
          if (!settings.postex_pickup_address_code) {
            const def = addresses.find((a: any) => a.isDefault) || addresses[0];
            const code = def.addressCode || def.pickupAddressCode || '';
            const name = `${def.cityName} - ${def.address}`;
            setSettings((prev) => ({
              ...prev,
              postex_pickup_address_code: code,
              postex_pickup_address_name: name,
            }));
          }
        } else {
          setAddressMessage('No merchant addresses returned from PostEx account.');
        }
      }
    } catch (e) {
      setAddressMessage('Network error fetching PostEx merchant addresses.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] p-6 border border-[#262626] rounded-xl">
        <div>
          <h1 className="text-2xl font-serif text-[#FAF8F5]">Admin & Site Settings</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">Configure business profile, WhatsApp automation number, shipping rates, COD fees, announcement bar, and footer.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C5A028] text-black px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section: Security & Password */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-[#D4AF37]">
            <Lock className="w-5 h-5" />
            <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Security Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">New Password (min 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>

            {passwordMessage && (
              <div className={`text-xs p-2 rounded ${passwordMessage.includes('success') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {passwordMessage}
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Contact Details & Social Media */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-[#D4AF37]">
            <Phone className="w-5 h-5" />
            <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Contact Details & Social Media</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#D4AF37] uppercase font-semibold mb-1">
                WhatsApp Number (Customer Support) *
              </label>
              <input
                type="text"
                required
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="03180633323"
                className="w-full bg-[#1A1A1A] border border-[#D4AF37]/50 rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
              />
              <p className="text-[11px] text-[#A3A3A3] mt-1">
                Format: 03180633323 (for Pakistan). This number will be used for WhatsApp button and customer support.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Support Hours</label>
                <input
                  type="text"
                  value={settings.supportHours}
                  onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                  placeholder="Monday – Saturday: 10:00 AM – 8:00 PM"
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#D4AF37] uppercase font-semibold mb-2">Social Media URLs</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={settings.instagramUrl}
                    onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                    placeholder="https://www.instagram.com/wearomnia_/"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Facebook URL</label>
                  <input
                    type="text"
                    value={settings.facebookUrl}
                    onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                    placeholder="https://www.facebook.com/profile.php?id=61579169068040"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">TikTok URL</label>
                  <input
                    type="text"
                    value={settings.tiktokUrl}
                    onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                    placeholder="https://www.tiktok.com/@wearomnia_"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">YouTube URL (Optional)</label>
                  <input
                    type="text"
                    value={settings.youtubeUrl}
                    onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/@wearomnia"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Meta WhatsApp Business Cloud API & Webhook Automation */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3 text-[#D4AF37]">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Meta WhatsApp Cloud API & Automation Engine</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
              settings.whatsapp_mode === 'PRODUCTION'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              Mode: {settings.whatsapp_mode || 'DEVELOPMENT'}
            </span>
          </div>

          {/* Webhook Endpoint Copy Helper */}
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626] space-y-2">
            <label className="block text-xs text-[#D4AF37] font-semibold uppercase">Meta Webhook Callback URL (Copy to Meta Developer Console)</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                className="flex-1 bg-[#141414] border border-[#333333] rounded-lg px-3.5 py-2 text-xs font-mono text-emerald-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/whatsapp`);
                    alert('Webhook URL copied to clipboard!');
                  }
                }}
                className="bg-[#262626] hover:bg-[#333333] text-[#FAF8F5] px-4 py-2 rounded-lg text-xs font-medium border border-[#404040]"
              >
                Copy Webhook URL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Automation Engine Mode</label>
              <select
                value={settings.whatsapp_mode || 'DEVELOPMENT'}
                onChange={(e) => setSettings({ ...settings, whatsapp_mode: e.target.value as any })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="DEVELOPMENT">Development (Simulated WhatsApp & Logging)</option>
                <option value="PRODUCTION">Production (Meta WhatsApp Cloud API Live)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Meta Phone Number ID</label>
              <input
                type="text"
                value={settings.whatsapp_phone_number_id || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_phone_number_id: e.target.value })}
                placeholder="e.g. 109283749281"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Webhook Verify Token</label>
              <input
                type="text"
                value={settings.whatsapp_verify_token || 'wearomnia_secure_webhook_token_2026'}
                onChange={(e) => setSettings({ ...settings, whatsapp_verify_token: e.target.value })}
                placeholder="wearomnia_secure_webhook_token_2026"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Meta Permanent Access Token</label>
              <input
                type="password"
                value={settings.whatsapp_access_token || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_access_token: e.target.value })}
                placeholder="EAA..."
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Meta App Secret (HMAC Validation)</label>
              <input
                type="password"
                value={settings.whatsapp_app_secret || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_app_secret: e.target.value })}
                placeholder="3a8b..."
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Admin Notification WhatsApp Phone</label>
              <input
                type="text"
                value={settings.whatsapp_admin_phone || '923001234567'}
                onChange={(e) => setSettings({ ...settings, whatsapp_admin_phone: e.target.value })}
                placeholder="923001234567"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>
          </div>

          {/* Automation Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-[#262626]">
            <label className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#262626] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp_auto_confirm_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, whatsapp_auto_confirm_enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs font-semibold text-[#FAF8F5]">Auto-Confirm Orders</span>
            </label>

            <label className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#262626] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp_customer_notify_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, whatsapp_customer_notify_enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs font-semibold text-[#FAF8F5]">Customer Notifications</span>
            </label>

            <label className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#262626] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp_admin_notify_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, whatsapp_admin_notify_enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs font-semibold text-[#FAF8F5]">Admin WhatsApp Alerts</span>
            </label>

            <label className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#262626] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp_sound_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, whatsapp_sound_enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs font-semibold text-[#FAF8F5]">Dashboard Audio Sound</span>
            </label>
          </div>
        </div>

        {/* Section: PostEx Courier Integration Settings */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#262626] pb-3 text-[#D4AF37]">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Shipping / PostEx Courier Settings</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                settings.postex_enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
              }`}>
                {settings.postex_enabled ? 'PostEx Enabled' : 'PostEx Disabled'}
              </span>
              <button
                type="button"
                onClick={handleTestPostExConnection}
                disabled={testingPostEx}
                className="bg-[#262626] hover:bg-[#333333] text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {testingPostEx ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {postExTestMessage && (
            <div className={`p-3 rounded-lg text-xs font-medium ${
              postExTestMessage.includes('detected') ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
            }`}>
              {postExTestMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#262626]">
              <input
                type="checkbox"
                id="postexEnableToggle"
                checked={settings.postex_enabled ?? false}
                onChange={(e) => setSettings({ ...settings, postex_enabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <label htmlFor="postexEnableToggle" className="text-xs font-semibold text-[#FAF8F5] cursor-pointer">
                Enable PostEx Courier Integration
              </label>
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Environment</label>
              <select
                value={settings.postex_environment || 'TEST'}
                onChange={(e) => setSettings({ ...settings, postex_environment: e.target.value as any })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="TEST">Test Environment</option>
                <option value="PRODUCTION">Production Live</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">API Base URL</label>
              <input
                type="text"
                value={settings.postex_api_url || ''}
                onChange={(e) => setSettings({ ...settings, postex_api_url: e.target.value })}
                placeholder="Leave empty by default"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">API Key</label>
              <input
                type="password"
                value={settings.postex_api_key || ''}
                onChange={(e) => setSettings({ ...settings, postex_api_key: e.target.value })}
                placeholder="Leave empty by default"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">API Token</label>
              <input
                type="password"
                value={settings.postex_api_token || ''}
                onChange={(e) => setSettings({ ...settings, postex_api_token: e.target.value })}
                placeholder="Leave empty by default"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Merchant ID</label>
              <input
                type="text"
                value={settings.postex_merchant_id || ''}
                onChange={(e) => setSettings({ ...settings, postex_merchant_id: e.target.value })}
                placeholder="Leave empty by default"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Account ID</label>
              <input
                type="text"
                value={settings.postex_account_id || ''}
                onChange={(e) => setSettings({ ...settings, postex_account_id: e.target.value })}
                placeholder="Leave empty by default"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/postex` : '/api/webhooks/postex'}
                  className="flex-1 bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2 text-xs text-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/postex`);
                      alert('PostEx Webhook URL copied to clipboard!');
                    }
                  }}
                  className="bg-[#262626] hover:bg-[#333333] text-[#FAF8F5] px-3 py-2 rounded-lg text-xs font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* PostEx Merchant Address Selection */}
            <div className="sm:col-span-2 lg:col-span-4 bg-[#1A1A1A] p-5 rounded-xl border border-[#262626] space-y-4 mt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FAF8F5]">
                    PostEx Merchant Pickup & Store Addresses
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleFetchMerchantAddresses}
                  disabled={loadingAddresses}
                  className="bg-[#262626] hover:bg-[#333333] text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {loadingAddresses ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching Addresses...</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5" /> Load / Refresh Addresses</>
                  )}
                </button>
              </div>

              {addressMessage && (
                <div className={`p-3 rounded-lg text-xs font-medium ${
                  addressMessage.includes('✓') || addressMessage.includes('Successfully')
                    ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                }`}>
                  {addressMessage}
                </div>
              )}

              {!settings.postex_pickup_address_code && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Action Required:</strong> PostEx pickup address is not configured. Click <strong>&quot;Load / Refresh Addresses&quot;</strong> above and select your pickup address code to enable 1-click order shipping.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Address Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-amber-400 uppercase">
                    PostEx Pickup Address (Required for Shipping) *
                  </label>
                  {merchantAddresses.length > 0 && (
                    <select
                      value={settings.postex_pickup_address_code || ''}
                      onChange={(e) => {
                        const code = e.target.value;
                        const matched = merchantAddresses.find(
                          (a) => (a.addressCode || a.pickupAddressCode) === code
                        );
                        setSettings({
                          ...settings,
                          postex_pickup_address_code: code,
                          postex_pickup_address_name: matched ? `${matched.cityName} - ${matched.address}` : '',
                        });
                      }}
                      className="w-full bg-[#141414] border border-amber-500/50 rounded-lg px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Select Pickup Address --</option>
                      {merchantAddresses.map((addr, idx) => {
                        const code = addr.addressCode || addr.pickupAddressCode || `ADDR-${idx}`;
                        return (
                          <option key={code} value={code}>
                            {addr.cityName ? `${addr.cityName} - ` : ''}{addr.address} (Code: {code}){addr.isDefault ? ' [Default]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.postex_pickup_address_code || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, postex_pickup_address_code: e.target.value })
                      }
                      placeholder="Pickup Address Code (e.g. 001)"
                      className="flex-1 bg-[#141414] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {settings.postex_pickup_address_name && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {settings.postex_pickup_address_name}
                    </p>
                  )}
                </div>

                {/* Store Address Selector */}
                <div className="space-y-2">
                  <label className="block text-xs text-[#A3A3A3] uppercase">
                    PostEx Store Address (Optional / Secondary)
                  </label>
                  {merchantAddresses.length > 0 && (
                    <select
                      value={settings.postex_store_address_code || ''}
                      onChange={(e) => {
                        const code = e.target.value;
                        const matched = merchantAddresses.find(
                          (a) => (a.addressCode || a.pickupAddressCode) === code
                        );
                        setSettings({
                          ...settings,
                          postex_store_address_code: code,
                          postex_store_address_name: matched ? `${matched.cityName} - ${matched.address}` : '',
                        });
                      }}
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">-- Optional / None --</option>
                      {merchantAddresses.map((addr, idx) => {
                        const code = addr.addressCode || addr.pickupAddressCode || `ADDR-${idx}`;
                        return (
                          <option key={code} value={code}>
                            {addr.cityName ? `${addr.cityName} - ` : ''}{addr.address} (Code: {code}){addr.isDefault ? ' [Default]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.postex_store_address_code || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, postex_store_address_code: e.target.value })
                      }
                      placeholder="Store Address Code (Optional)"
                      className="flex-1 bg-[#141414] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  {settings.postex_store_address_name && (
                    <p className="text-[11px] text-[#A3A3A3]">
                      {settings.postex_store_address_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Global Shipping & COD Settings */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-[#D4AF37]">
            <Truck className="w-5 h-5" />
            <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Shipping Rules & COD Charges</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Default Flat Shipping Fee (PKR)</label>
                <input
                  type="number"
                  value={settings.flatShippingFee}
                  onChange={(e) => setSettings({ ...settings, flatShippingFee: parseFloat(e.target.value || '0') })}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Free Shipping Threshold (PKR)</label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value || '0') })}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Cash On Delivery (COD) Fee (PKR)</label>
                <input
                  type="number"
                  value={settings.codCharge}
                  onChange={(e) => setSettings({ ...settings, codCharge: parseFloat(e.target.value || '0') })}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Estimated Delivery Time</label>
                <input
                  type="text"
                  value={settings.estimatedDeliveryTime}
                  onChange={(e) => setSettings({ ...settings, estimatedDeliveryTime: e.target.value })}
                  placeholder="e.g. 2–3 Business Days"
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Delivery & Inspection Instructions</label>
              <textarea
                rows={2}
                value={settings.deliveryInstructions}
                onChange={(e) => setSettings({ ...settings, deliveryInstructions: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Announcement Bar & Footer */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-[#D4AF37]">
            <Megaphone className="w-5 h-5" />
            <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Announcement Bar & Footer Text</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="announcementToggle"
                checked={settings.announcementEnabled}
                onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#D4AF37] rounded"
              />
              <label htmlFor="announcementToggle" className="text-sm text-[#FAF8F5]">Enable Store Announcement Bar Header</label>
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Announcement Text</label>
              <input
                type="text"
                value={settings.announcementText}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Footer Brand Mission Statement</label>
              <textarea
                rows={2}
                value={settings.footerAboutText}
                onChange={(e) => setSettings({ ...settings, footerAboutText: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Footer Copyright Notice</label>
              <input
                type="text"
                value={settings.copyrightText}
                onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: City & Province Specific Shipping Rules */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">City & Province Shipping Rates Table</h2>
            <p className="text-xs text-[#A3A3A3] mt-1">Override default shipping rates for specific cities (e.g., Lahore, Karachi, Islamabad)</p>
          </div>
        </div>

        {/* Add City Shipping Rule Form */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
          <input
            type="text"
            placeholder="City (e.g. Lahore)"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAF8F5]"
          />
          <select
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAF8F5]"
          >
            <option value="Punjab">Punjab</option>
            <option value="Sindh">Sindh</option>
            <option value="KPK">Khyber Pakhtunkhwa</option>
            <option value="Balochistan">Balochistan</option>
            <option value="Islamabad">Islamabad Capital</option>
          </select>
          <input
            type="number"
            placeholder="Charge (PKR)"
            value={newCharge}
            onChange={(e) => setNewCharge(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAF8F5]"
          />
          <input
            type="number"
            placeholder="Free Shipping Above (PKR)"
            value={newMinAmount}
            onChange={(e) => setNewMinAmount(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAF8F5]"
          />
          <button
            type="button"
            onClick={handleAddShippingRule}
            disabled={addingRule}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-semibold rounded-lg px-4 py-2 text-xs flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>

        {/* Existing Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A3A3A3]">
            <thead className="bg-[#1A1A1A] uppercase tracking-wider text-[#737373] border-b border-[#262626]">
              <tr>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Province</th>
                <th className="py-3 px-4">Shipping Charge</th>
                <th className="py-3 px-4">Free Shipping Min Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {shippingRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#737373]">
                    No custom city rules added yet. Standard flat shipping fee will apply.
                  </td>
                </tr>
              ) : (
                shippingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#1A1A1A]/50">
                    <td className="py-3 px-4 font-semibold text-[#FAF8F5]">{rule.city}</td>
                    <td className="py-3 px-4">{rule.province}</td>
                    <td className="py-3 px-4 font-mono text-[#D4AF37]">Rs. {rule.charge}</td>
                    <td className="py-3 px-4 font-mono">Rs. {rule.freeShippingMinAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteShippingRule(rule.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
