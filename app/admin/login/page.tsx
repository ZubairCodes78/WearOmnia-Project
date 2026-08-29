'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Mail, KeyRound, Key, RefreshCw, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  // Step 1 state (Email / Password)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 state (2FA TOTP / Recovery Code)
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid login details');
      } else if (data.requires2FA) {
        // Step 2: 2FA required
        setRequires2FA(true);
        setTotpCode('');
        setError('');
      } else {
        // Direct password-only access (when 2FA is disabled)
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setError('Connection failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const codeToVerify = isRecoveryMode ? recoveryCode.trim() : totpCode.trim();
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToVerify,
          isRecoveryCode: isRecoveryMode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          setError('Session expired. Please log in with password again.');
          setRequires2FA(false);
        } else {
          setError(data.error || 'Invalid verification code.');
        }
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setError('Connection failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06191B] flex items-center justify-center p-4">
      <div className="bg-[#0A2528] text-[#FAF8F5] w-full max-w-md p-8 rounded-3xl shadow-2xl border border-[#D4AF37]/30 space-y-6 text-center">
        {/* Header Icon */}
        <div className="w-16 h-16 bg-[#06191B] text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          {requires2FA ? <KeyRound className="w-8 h-8 text-[#D4AF37] animate-pulse" /> : <Lock className="w-8 h-8 text-[#D4AF37]" />}
        </div>

        <div>
          <span className="font-serif text-3xl font-bold uppercase text-[#FAF8F5]">
            Wear<span className="text-[#D4AF37]">OMNIA</span>
          </span>
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mt-1 font-sans font-bold">
            {requires2FA ? 'Two-Factor Authentication' : 'Secure Admin Portal'}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/80 text-red-200 border border-red-500/50 p-3.5 rounded-2xl text-xs font-semibold animate-in fade-in duration-150 text-left">
            {error}
          </div>
        )}

        {!requires2FA ? (
          /* STEP 1: PASSWORD LOGIN FORM */
          <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#D4AF37]/60 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@wearomnia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D4AF37]/60 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-white text-black py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? 'Verifying Password...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2: 2FA TOTP / RECOVERY CODE FORM */
          <form onSubmit={handle2FAVerify} className="space-y-4 text-left">
            <div className="bg-[#06191B] border border-[#D4AF37]/20 rounded-2xl p-4 text-xs space-y-1">
              <p className="text-[#FAF8F5]/80 font-sans">
                {isRecoveryMode
                  ? 'Enter an 8-character single-use recovery code generated during 2FA enrollment.'
                  : 'Enter the 6-digit verification code from your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password).'}
              </p>
            </div>

            {!isRecoveryMode ? (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1.5">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3.5 bg-[#06191B] rounded-xl text-[#FAF8F5] border border-[#D4AF37]/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#D4AF37]" /> One-Time Recovery Code
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. A1B2-C3D4"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-[0.2em] font-mono text-base py-3.5 bg-[#06191B] rounded-xl text-[#FAF8F5] border border-[#D4AF37]/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isRecoveryMode ? totpCode.length !== 6 : !recoveryCode.trim())}
              className="w-full bg-[#D4AF37] hover:bg-white text-black py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? 'Verifying 2FA...' : 'Verify & Continue'} <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#D4AF37]/15">
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(!isRecoveryMode);
                  setError('');
                }}
                className="text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                {isRecoveryMode ? '← Use Authenticator App' : 'Use Recovery Code →'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setIsRecoveryMode(false);
                  setError('');
                }}
                className="text-[#FAF8F5]/50 hover:text-white"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="pt-2">
          <p className="text-[11px] text-[#FAF8F5]/60 flex items-center justify-center gap-1 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Enterprise Encryption (2FA Enabled)
          </p>
        </div>
      </div>
    </div>
  );
}
