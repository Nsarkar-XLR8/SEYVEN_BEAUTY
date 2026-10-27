'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, Award, Sparkles, MessageCircle, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';
import { BRAND } from '@/lib/constants';

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/');
      openAuthModal();
    }
  }, [mounted, isLoading, isAuthenticated, router, openAuthModal]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C7A97B] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="w-full min-h-[75vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="p-8 sm:p-10 bg-[#F9F6F0] border border-[#E6DFD5] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10">
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
            <span>{t('SEYVEN CLIENT PRIVILEGE', 'গ্রাহক সুবিধা')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
            {user.fullName || t('Cherished Client', 'সম্মানিত গ্রাহক')}
          </h1>
          <p className="text-xs text-[#1C1917]/70 font-light tracking-wide">
            {user.phone} {user.email ? `• ${user.email}` : ''}
          </p>
        </div>

        {/* Luxury Repeat Client Privilege Card (Pure Courtesy, Zero Arcade Spend Thresholds) */}
        <div className="p-6 bg-white border border-[#E6DFD5] rounded-sm space-y-3 shrink-0 z-10 min-w-[280px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#C7A97B] font-semibold">
              {t('CLIENT PRIVILEGE', 'ক্লায়েন্ট প্রিভিলেজ')}
            </span>
            <span className="px-2.5 py-0.5 bg-[#1C1917] text-[#C7A97B] text-[10px] font-mono uppercase font-bold tracking-wider rounded-sm">
              5% COURTESY DISCOUNT
            </span>
          </div>

          <div className="text-base sm:text-lg font-serif text-[#1C1917] tracking-wider font-medium">
            {t('REPEAT CLIENT PRIVILEGE', 'সম্মানিত রিপিট ক্লায়েন্ট প্রিভিলেজ')}
          </div>

          <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
            {t(
              'Perpetual 5% courtesy discount active on all subsequent orders. Pure luxury courtesy with zero arcade spend thresholds.',
              'আপনার অ্যাকাউন্টে প্রতিটি ক্রয়ে আজীবন স্বয়ংক্রিয় ৫% সৌজন্য ছাড় সক্রিয়। কোনো শর্তহীন বিশুদ্ধ লাক্সারি প্রিভিলেজ।'
            )}
          </p>

          <div className="pt-2 border-t border-[#E6DFD5]/70 flex items-center justify-between text-[10px] text-[#78716C] font-mono uppercase tracking-wider">
            <span className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{t('ACTIVE AT CHECKOUT', 'চেকআউটে সক্রিয়')}</span>
            </span>
            <span className="text-[#C7A97B]">★ SEYVEN SANCTUARY</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Card 1: Track Order */}
        <Link
          href="/track-order"
          className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] hover:border-[#C7A97B] transition-all duration-200 group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#1C1917]/5 flex items-center justify-center text-[#C7A97B] group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-medium text-[#1C1917]">
              {t('TRACK YOUR PARCEL', 'অর্ডার ট্র্যাকিং')}
            </h2>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {t('Check real-time dispatch and delivery progress of your skincare order.', 'আপনার পার্সেলটি কোথায় আছে তা সহজেই ট্র্যাক করুন।')}
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-medium pt-2">
            <span>{t('TRACK NOW', 'ট্র্যাক করুন')}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Sanctuary VIP Privileges */}
        <Link
          href="/customer/loyalty"
          className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] hover:border-[#C7A97B] transition-all duration-200 group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#1C1917]/5 flex items-center justify-center text-[#C7A97B] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-medium text-[#1C1917]">
              {t('SANCTUARY VIP PRIVILEGES', 'ভিআইপি মেম্বারশিপ ও সুবিধা')}
            </h2>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {t('Automatic 5% courtesy discount on all repeat curations, private collection previews & concierge advisory.', 'সব পরবর্তী ক্রয়ে আজীবন স্বয়ংক্রিয় ৫% সৌজন্য ছাড় ও প্রাইভেট কালেকশনের এক্সক্লুসিভ অ্যাক্সেস।')}
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-medium pt-2">
            <span>{t('VIEW PRIVILEGES', 'সুবিধাগুলো দেখুন')}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Dynamic Storefront Concierge */}
        <a
          href={concierge.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] hover:border-[#C7A97B] transition-all duration-200 group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#C7A97B]/10 flex items-center justify-center text-[#C7A97B] group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-medium text-[#1C1917]">
              {t(`${concierge.shortLabel} BEAUTY ADVISOR`, `${concierge.shortLabel} কনসাল্টেশন`)}
            </h2>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {t('Speak directly with our skincare concierge for quick orders or advice.', 'যেকোনো প্রশ্ন বা সরাসরি অর্ডারের জন্য আমাদের সাথে কথা বলুন।')}
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-medium pt-2">
            <span>{t(`CHAT ON ${concierge.shortLabel}`, 'মেসেজ দিন')}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </a>

      </div>

      {/* 3. Account Actions & Logout */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-[#E6DFD5]">
        <Link
          href="/catalog"
          className="text-center px-6 py-3 bg-[#1C1917] hover:bg-[#1C1917]/90 text-[#F9F6F0] text-xs uppercase tracking-[0.2em] font-medium transition-colors"
        >
          {t('CONTINUE SHOPPING', 'শপিং করুন')}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded border border-[#E6DFD5] hover:border-red-300 hover:bg-red-50 text-xs uppercase tracking-[0.15em] text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>{t('SIGN OUT OF SEYVEN', 'লগআউট করুন')}</span>
        </button>
      </div>

    </div>
  );
}
