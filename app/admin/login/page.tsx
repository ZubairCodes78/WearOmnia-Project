'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal flex items-center justify-center p-4">
      <div className="bg-offwhite w-full max-w-md p-8 rounded-3xl shadow-2xl border border-champagne/40 space-y-6 text-center">
        <div className="w-16 h-16 bg-teal text-champagne rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8 text-champagne" />
        </div>

        <div>
          <span className="font-serif text-3xl font-bold uppercase text-teal">
            Wear<span className="text-champagne-700">OMNIA</span>
          </span>
          <p className="text-xs uppercase tracking-[0.25em] text-charcoal-muted mt-1 font-sans">
            Admin Portal
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-charcoal block mb-1.5 text-left">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="admin@wearomnia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-sand rounded-xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-charcoal block mb-1.5 text-left">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-sand rounded-xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal text-champagne py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Admin Dashboard'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-charcoal-muted flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" /> Secure Admin Session
        </p>
      </div>
    </div>
  );
}
