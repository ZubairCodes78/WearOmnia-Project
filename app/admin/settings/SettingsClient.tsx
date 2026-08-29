'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Plus,
  Trash2,
  Phone,
  Truck,
  ShieldAlert,
  Share2,
  Megaphone,
  Info,
  Lock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Loader2,
  KeyRound,
  ShieldCheck,
  Key,
  Copy,
  Download,
  X,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';

interface ShippingRule {
  id: string;
  city: string;
  province: string;
  charge: number;
  freeShippingMinAmount: number;
}

interface AdminProfileData {
  id: string;
  email: string;
  name: string | null;
  twoFactorEnabled: boolean;
  twoFactorEnabledAt: string | null;
}

interface SettingsClientProps {
  initialSettings: SiteSettingsData;
  initialShippingRules: ShippingRule[];
  initialAdmin?: AdminProfileData | null;
}

export function SettingsClient({ initialSettings, initialShippingRules, initialAdmin }: SettingsClientProps) {
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

  // 2FA Management State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialAdmin?.twoFactorEnabled ?? false);
  const [twoFactorEnabledAt, setTwoFactorEnabledAt] = useState<string | null>(initialAdmin?.twoFactorEnabledAt ?? null);
  
  // 2FA Setup Modal State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrCodeUrl, setSetupQrCodeUrl] = useState('');
  const [setupRecoveryCodes, setSetupRecoveryCodes] = useState<string[]>([]);
  const [setupTotpCode, setSetupTotpCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRecoveryCodes, setCopiedRecoveryCodes] = useState(false);
  const [hasConfirmedSavedCodes, setHasConfirmedSavedCodes] = useState(false);

  // Disable 2FA Modal State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');

  // Regenerate Recovery Codes Modal State
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [regenerateTotpCode, setRegenerateTotpCode] = useState('');
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [regenerateError, setRegenerateError] = useState('');
  const [newRegeneratedCodes, setNewRegeneratedCodes] = useState<string[] | null>(null);

  // Shipping Rule Modal / New Row Form
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Punjab');
  const [newCharge, setNewCharge] = useState('250');
  const [newMinAmount, setNewMinAmount] = useState('10000');
  const [addingRule, setAddingRule] = useState(false);

  const handleInitSetup2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError('');
    try {
      const res = await fetch('/api/admin/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: setupPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Failed to verify password.');
      } else {
        setSetupSecret(data.secret);
        setSetupQrCodeUrl(data.qrCodeDataUrl);
        setSetupRecoveryCodes(data.recoveryCodes);
        setSetupStep(2);
      }
    } catch {
      setSetupError('Network error initializing 2FA setup.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError('');
    try {
      const res = await fetch('/api/admin/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupSecret,
          code: setupTotpCode,
          recoveryCodes: setupRecoveryCodes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Invalid 6-digit code. Please try again.');
      } else {
        setTwoFactorEnabled(true);
        setTwoFactorEnabledAt(new Date().toISOString());
        setSetupStep(3);
      }
    } catch {
      setSetupError('Network error enabling 2FA.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableLoading(true);
    setDisableError('');
    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: disableTotpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDisableError(data.error || 'Failed to disable 2FA.');
      } else {
        setTwoFactorEnabled(false);
        setTwoFactorEnabledAt(null);
        setDisableModalOpen(false);
        setDisablePassword('');
        setDisableTotpCode('');
      }
    } catch {
      setDisableError('Network error disabling 2FA.');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenerateLoading(true);
    setRegenerateError('');
    try {
      const res = await fetch('/api/admin/2fa/regenerate-recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: regeneratePassword, code: regenerateTotpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegenerateError(data.error || 'Failed to regenerate recovery codes.');
      } else {
        setNewRegeneratedCodes(data.recoveryCodes);
      }
    } catch {
      setRegenerateError('Network error regenerating codes.');
    } finally {
      setRegenerateLoading(false);
    }
  };

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
        {/* Section: Password Security */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-[#D4AF37]">
            <Lock className="w-5 h-5" />
            <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Password & Login</h2>
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

        {/* Section: Two-Factor Authentication (TOTP) */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <KeyRound className="w-5 h-5" />
                <h2 className="font-serif text-lg font-semibold text-[#FAF8F5]">Two-Factor Authentication</h2>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                twoFactorEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}>
                {twoFactorEnabled ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <ShieldAlert className="w-3 h-3 text-amber-400" />}
                {twoFactorEnabled ? '2FA Active' : '2FA Disabled'}
              </span>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Protect your Admin Panel with industry-standard RFC 6238 TOTP Two-Factor Authentication. Compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Apple Passwords.
            </p>

            {twoFactorEnabled ? (
              <div className="bg-[#0A2528] border border-emerald-500/30 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Two-Factor Authentication is currently protecting this account.
                </div>
                <p className="text-[#FAF8F5]/70 text-[11px]">
                  {twoFactorEnabledAt ? `Enabled on ${new Date(twoFactorEnabledAt).toLocaleDateString()}` : 'Active session enforcement enabled.'}
                </p>
              </div>
            ) : (
              <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-xl p-4 space-y-2 text-xs">
                <p className="text-[#FAF8F5]/80">
                  When enabled, signing in requires both your password and a dynamic 6-digit TOTP verification code from your authenticator app.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            {!twoFactorEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setSetupStep(1);
                  setSetupPassword('');
                  setSetupTotpCode('');
                  setSetupError('');
                  setHasConfirmedSavedCodes(false);
                  setSetupModalOpen(true);
                }}
                className="w-full bg-[#D4AF37] hover:bg-white text-black px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Enable 2FA Security
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRegeneratePassword('');
                    setRegenerateTotpCode('');
                    setRegenerateError('');
                    setNewRegeneratedCodes(null);
                    setRegenerateModalOpen(true);
                  }}
                  className="bg-[#1A1A1A] hover:bg-[#262626] text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Recovery Codes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisablePassword('');
                    setDisableTotpCode('');
                    setDisableError('');
                    setDisableModalOpen(true);
                  }}
                  className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Disable 2FA
                </button>
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
                value={settings.postex_api_url || 'https://api.postex.pk'}
                onChange={(e) => setSettings({ ...settings, postex_api_url: e.target.value })}
                placeholder="https://api.postex.pk"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A3A3A3] uppercase mb-1">API Token (Secret Header)</label>
              <input
                type="password"
                value={settings.postex_api_token || ''}
                onChange={(e) => setSettings({ ...settings, postex_api_token: e.target.value })}
                placeholder="Enter official PostEx Merchant Token"
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] font-mono"
              />
              <p className="text-[11px] text-[#A3A3A3] mt-1">
                Passed securely on the server via <code className="text-[#D4AF37]">token: &lt;token&gt;</code> header.
              </p>
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

      {/* ========================================================================= */}
      {/* 2FA SETUP MODAL */}
      {/* ========================================================================= */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  Two-Factor Authentication Setup
                </h3>
              </div>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {setupError && (
              <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-200 rounded-xl text-xs">
                {setupError}
              </div>
            )}

            {/* STEP 1: PASSWORD CONFIRMATION */}
            {setupStep === 1 && (
              <form onSubmit={handleInitSetup2FA} className="space-y-4 text-xs font-sans">
                <p className="text-[#FAF8F5]/80 leading-relaxed">
                  For your security, please confirm your current admin password to start 2FA configuration.
                </p>
                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase font-bold mb-1.5">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupModalOpen(false)}
                    className="px-4 py-2 text-[#FAF8F5]/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={setupLoading || !setupPassword}
                    className="bg-[#D4AF37] hover:bg-white text-black font-extrabold px-5 py-2.5 rounded-xl uppercase text-xs tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Continue
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: SCAN QR CODE & ENTER TEST CODE */}
            {setupStep === 2 && (
              <form onSubmit={handleEnable2FA} className="space-y-4 text-xs font-sans">
                <div className="space-y-3">
                  <p className="text-[#FAF8F5]/80 leading-relaxed">
                    1. Scan this QR code using your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, etc.):
                  </p>

                  {setupQrCodeUrl && (
                    <div className="flex justify-center p-3 bg-[#FAF8F5] rounded-2xl w-fit mx-auto border-2 border-[#D4AF37]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={setupQrCodeUrl} alt="TOTP QR Code" className="w-44 h-44" />
                    </div>
                  )}

                  <div>
                    <span className="block text-[10px] text-[#A3A3A3] uppercase font-bold mb-1">
                      Manual Setup Key (if camera scan is not possible):
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="bg-[#06191B] border border-[#D4AF37]/30 px-3 py-2 rounded-xl text-xs font-mono text-[#D4AF37] flex-1 break-all select-all">
                        {setupSecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(setupSecret);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] p-2 rounded-xl transition-colors border border-[#D4AF37]/30"
                        title="Copy Secret Key"
                      >
                        {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[10px] text-[#D4AF37] uppercase font-bold mb-1.5">
                      2. Enter the 6-digit code shown in your app to activate:
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={setupTotpCode}
                      onChange={(e) => setSetupTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-[#06191B] rounded-xl text-[#FAF8F5] border border-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="px-4 py-2 text-[#FAF8F5]/60 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={setupLoading || setupTotpCode.length !== 6}
                    className="bg-[#D4AF37] hover:bg-white text-black font-extrabold px-6 py-2.5 rounded-xl uppercase text-xs tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Activate 2FA
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: BACKUP RECOVERY CODES */}
            {setupStep === 3 && (
              <div className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="font-semibold">
                    Two-Factor Authentication is now ENABLED on your account!
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="block text-[11px] text-[#D4AF37] uppercase font-bold">
                    Important: Save Your One-Time Recovery Codes
                  </span>
                  <p className="text-[#FAF8F5]/70 text-[11px] leading-relaxed">
                    If you ever lose access to your authenticator app, each of these 8 codes can be used once to access your account.
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-[#06191B] p-4 rounded-2xl border border-[#D4AF37]/30">
                    {setupRecoveryCodes.map((code, idx) => (
                      <div key={idx} className="font-mono text-center py-1.5 px-2 bg-[#0A2528] rounded-lg border border-white/5 text-[#D4AF37] font-bold text-xs">
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(setupRecoveryCodes.join('\n'));
                        setCopiedRecoveryCodes(true);
                        setTimeout(() => setCopiedRecoveryCodes(false), 2500);
                      }}
                      className="flex-1 bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] py-2 rounded-xl border border-[#D4AF37]/30 transition-all font-bold text-[11px] flex items-center justify-center gap-1.5"
                    >
                      {copiedRecoveryCodes ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedRecoveryCodes ? 'Copied to Clipboard!' : 'Copy All Codes'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([`WearOMNIA Admin 2FA Recovery Codes:\n\n${setupRecoveryCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `wearomnia-recovery-codes-${Date.now()}.txt`;
                        a.click();
                      }}
                      className="flex-1 bg-[#06191B] hover:bg-white/10 text-[#FAF8F5] py-2 rounded-xl border border-white/10 transition-all font-bold text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download (.txt)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmSavedCodes"
                    checked={hasConfirmedSavedCodes}
                    onChange={(e) => setHasConfirmedSavedCodes(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37] rounded"
                  />
                  <label htmlFor="confirmSavedCodes" className="text-[11px] text-[#FAF8F5]/80 select-none cursor-pointer">
                    I have saved these recovery codes in a secure password manager.
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!hasConfirmedSavedCodes}
                  onClick={() => setSetupModalOpen(false)}
                  className="w-full bg-[#D4AF37] hover:bg-white text-black font-extrabold py-3 rounded-xl uppercase text-xs tracking-wider transition-all disabled:opacity-40"
                >
                  Finish & Return to Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DISABLE 2FA MODAL */}
      {/* ========================================================================= */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-[#FAF8F5]">
                  Disable Two-Factor Authentication
                </h3>
              </div>
              <button onClick={() => setDisableModalOpen(false)} className="p-1.5 text-[#FAF8F5]/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#FAF8F5]/70 leading-relaxed">
              Disabling 2FA will reduce account security to password-only authentication. To proceed, please confirm your current credentials:
            </p>

            {disableError && (
              <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-200 rounded-xl text-xs">
                {disableError}
              </div>
            )}

            <form onSubmit={handleDisable2FA} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] text-[#A3A3A3] uppercase font-bold mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#A3A3A3] uppercase font-bold mb-1">
                  6-Digit Authenticator Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={disableTotpCode}
                  onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] font-mono text-lg py-2.5 bg-[#06191B] rounded-xl text-[#FAF8F5] border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="px-4 py-2 text-[#FAF8F5]/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading || !disablePassword || disableTotpCode.length !== 6}
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-2.5 rounded-xl uppercase text-xs tracking-wider transition-all disabled:opacity-40 flex items-center gap-1.5 shadow"
                >
                  {disableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} Disable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REGENERATE RECOVERY CODES MODAL */}
      {/* ========================================================================= */}
      {regenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  Regenerate Recovery Codes
                </h3>
              </div>
              <button onClick={() => setRegenerateModalOpen(false)} className="p-1.5 text-[#FAF8F5]/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!newRegeneratedCodes ? (
              <form onSubmit={handleRegenerateRecoveryCodes} className="space-y-4 text-xs font-sans">
                <p className="text-[#FAF8F5]/70 leading-relaxed">
                  Generating new recovery codes will immediately invalidate all previously issued recovery codes. Please authenticate to continue:
                </p>

                {regenerateError && (
                  <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-200 rounded-xl text-xs">
                    {regenerateError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase font-bold mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase font-bold mb-1">
                    6-Digit Authenticator Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={regenerateTotpCode}
                    onChange={(e) => setRegenerateTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.4em] font-mono text-lg py-2.5 bg-[#06191B] rounded-xl text-[#FAF8F5] border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegenerateModalOpen(false)}
                    className="px-4 py-2 text-[#FAF8F5]/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regenerateLoading || !regeneratePassword || regenerateTotpCode.length !== 6}
                    className="bg-[#D4AF37] hover:bg-white text-black font-extrabold px-5 py-2.5 rounded-xl uppercase text-xs tracking-wider transition-all disabled:opacity-40 flex items-center gap-1.5 shadow"
                  >
                    {regenerateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Generate New Codes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="font-semibold">
                    New recovery codes generated! Old codes are now invalid.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#06191B] p-4 rounded-2xl border border-[#D4AF37]/30">
                  {newRegeneratedCodes.map((code, idx) => (
                    <div key={idx} className="font-mono text-center py-1.5 px-2 bg-[#0A2528] rounded-lg border border-white/5 text-[#D4AF37] font-bold text-xs">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newRegeneratedCodes.join('\n'));
                    }}
                    className="flex-1 bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] py-2 rounded-xl border border-[#D4AF37]/30 transition-all font-bold text-[11px] flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy All Codes
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([`WearOMNIA Admin 2FA Recovery Codes:\n\n${newRegeneratedCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `wearomnia-recovery-codes-${Date.now()}.txt`;
                      a.click();
                    }}
                    className="flex-1 bg-[#06191B] hover:bg-white/10 text-[#FAF8F5] py-2 rounded-xl border border-white/10 transition-all font-bold text-[11px] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.txt)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRegenerateModalOpen(false);
                    setNewRegeneratedCodes(null);
                  }}
                  className="w-full bg-[#D4AF37] hover:bg-white text-black font-extrabold py-3 rounded-xl uppercase text-xs tracking-wider transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
