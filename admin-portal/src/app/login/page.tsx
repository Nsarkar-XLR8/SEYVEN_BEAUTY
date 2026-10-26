'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { STAFF_USERS } from '@/data/admin-data';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await login(email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Invalid staff credentials. Access restricted to authorized operators.');
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    const result = await login(demoEmail, 'demo');
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Demo login failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Emblem */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#C7A97B] bg-[#1C1917] p-2 shadow-lg overflow-hidden">
            <Image
              src="/images/seyven-monogram.png"
              alt="SEYVEN Monogram"
              width={48}
              height={70}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-serif text-2xl tracking-[0.2em] font-semibold text-[#1C1917] uppercase">
            SEYVEN
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-[#C7A97B] font-mono">
            The Sanctuary of Beauty
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-[#E6DFD5] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-lg text-[#1C1917] font-medium tracking-wide">
              Staff Operator Authentication
            </h2>
            <p className="text-[11px] text-[#1C1917]/60 font-light">
              Enter your authorized executive credentials to access live order fulfillment and catalog governance.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#1C1917]/70 block">
                Operator Email or Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
                <input
                  type="text"
                  required
                  placeholder="operator@theseyven.com or 017XXXXXXXX"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F9F6F0] border border-[#E6DFD5] text-xs font-mono text-[#1C1917] placeholder:text-[#1C1917]/30 focus:border-[#C7A97B] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#1C1917]/70 block">
                Security Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your security passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-[#F9F6F0] border border-[#E6DFD5] text-xs font-mono text-[#1C1917] placeholder:text-[#1C1917]/30 focus:border-[#C7A97B] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40 hover:text-[#1C1917] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-medium uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Operations Desk'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Staff Shift Selector (Simulated Operator) */}
          <div className="pt-4 border-t border-[#E6DFD5] space-y-2">
            <span className="text-[9px] uppercase tracking-wider font-mono text-[#1C1917]/50 block text-center">
              Quick Shift Access (Authorized Roles)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {STAFF_USERS.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleQuickDemo(s.email)}
                  className="p-2 border border-[#E6DFD5] hover:border-[#C7A97B] bg-[#F9F6F0] text-left transition-colors truncate"
                  title={`Sign in as ${s.name} (${s.role})`}
                >
                  <div className="font-semibold text-[#1C1917] truncate">{s.name}</div>
                  <div className="text-[8px] text-[#C7A97B] tracking-wider truncate">{s.role.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-[#1C1917]/50 font-mono text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>Restricted Portal · Encrypted Session · IP Monitored</span>
        </div>
      </div>
    </div>
  );
}
