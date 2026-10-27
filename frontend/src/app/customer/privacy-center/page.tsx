'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock, Trash2, CheckCircle2, Phone, HeartHandshake, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';

export default function PrivacyCenterPage() {
  const { lang, t } = useLanguage();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isClientAuth = mounted && isAuthenticated;

  const [isErasureModalOpen, setIsErasureModalOpen] = useState(false);
  const [erasureRequested, setErasureRequested] = useState(false);

  const handleConfirmErasure = () => {
    setErasureRequested(true);
    setIsErasureModalOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10 pb-28 lg:pb-16">
      
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('Back to Sanctuary', 'হোমে ফিরে যান')}</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#E6DFD5]/40 border border-[#E6DFD5] text-[9px] uppercase tracking-[0.3em] font-medium text-[#C7A97B]">
          <Shield className="w-3.5 h-3.5" />
          <span>{t('CLIENT PRIVACY COMMITMENT', 'ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা')}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif uppercase tracking-[0.18em] font-light text-[#1C1917]">
          {t('YOUR PRIVACY & ACCOUNT CARE', 'আপনার তথ্য ও নিরাপত্তা')}
        </h1>

        <p className="text-xs sm:text-sm text-[#1C1917]/70 font-light leading-relaxed">
          {t(
            'Your personal information, delivery addresses, and beauty consultation history are always treated with utmost discretion and confidentiality.',
            'আপনার মোবাইল নম্বর, ডেলিভারি ঠিকানা এবং অর্ডারের তথ্য সম্পূর্ণ সুরক্ষিত এবং গোপনীয় রাখা হয়।'
          )}
        </p>
      </div>

      {/* Main Privacy Cards */}
      <div className="space-y-6">
        
        {/* Card 1: Confidentiality Guarantee */}
        <div className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#E6DFD5]/50 flex items-center justify-center text-[#C7A97B]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
                {t('100% PRIVATE & CONFIDENTIAL', 'শতভাগ সুরক্ষিত ও গোপনীয়')}
              </h2>
              <p className="text-[11px] text-[#C7A97B] uppercase tracking-wider font-medium">
                {t('ZERO SPAM • ZERO DATA SHARING', 'কোনো স্প্যাম নয় • তথ্য কখনোই বিক্রি করা হয় না')}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#1C1917]/75 font-light leading-relaxed pl-12">
            <p>
              {t(
                'We only collect the contact information necessary to deliver your skincare parcel and provide skin advisory support.',
                'আমরা শুধুমাত্র পার্সেল নিরাপদে পৌঁছে দেওয়া এবং স্কিন কনসালটেশনের জন্যই আপনার নাম ও ফোন নম্বর ব্যবহার করি।'
              )}
            </p>
            <p>
              {t(
                'Your phone number is never shared with third-party advertisers or marketing data brokers.',
                'আপনার অনুমতি ছাড়া কখনোই কোনো অপ্রয়োজনীয় বিজ্ঞাপনী মেসেজ বা কল দেওয়া হবে না।'
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Account Overview & Details */}
        <div className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-3">
            <h3 className="text-xs font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917]">
              {t('CURRENT ACCOUNT STATUS', 'অ্যাকাউন্ট বিবরণী')}
            </h3>
            {isClientAuth ? (
              <span className="text-[9px] uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                {t('SIGNED IN', 'লগইন করা আছে')}
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/60 bg-[#E6DFD5]/40 px-2.5 py-0.5">
                {t('GUEST SESSION', 'গেস্ট সেশন')}
              </span>
            )}
          </div>

          {isClientAuth && user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase text-[#1C1917]/60 block">{t('CLIENT NAME', 'নাম')}</span>
                <span className="font-medium text-[#1C1917]">{user.fullName || 'Valued Client'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#1C1917]/60 block">{t('MOBILE NUMBER', 'মোবাইল নম্বর')}</span>
                <span className="font-mono text-[#1C1917]">{user.phone || '—'}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#1C1917]/70 space-y-3">
              <p>
                {t(
                  'You are currently shopping as a guest. Your bag and checkout entries are temporarily stored on your personal browser only.',
                  'আপনি বর্তমানে গেস্ট হিসেবে ভিজিট করছেন। আপনার ব্রাউজার ছাড়া অন্য কোথাও কোনো তথ্য সংরক্ষিত নেই।'
                )}
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="px-5 py-2.5 bg-[#1C1917] text-[#F9F6F0] text-[10px] uppercase tracking-[0.2em] font-medium"
              >
                {t('SIGN IN / CREATE ACCOUNT', 'লগইন / অ্যাকাউন্ট খুলুন')}
              </button>
            </div>
          )}
        </div>

        {/* Card 3: Account Closure / Deletion */}
        <div className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-3">
          <div className="flex items-center space-x-2 text-rose-800">
            <Trash2 className="w-4 h-4" />
            <h3 className="text-xs font-serif uppercase tracking-[0.2em] font-medium">
              {t('ACCOUNT REMOVAL & CLOSURE', 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ')}
            </h3>
          </div>

          <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
            {t(
              'If you ever wish to remove your account, contact details, or order history from SEYVEN, you can request an instant deletion.',
              'আপনি চাইলে যেকোনো সময় আপনার ফোন নম্বর, ঠিকানা ও অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার অনুরোধ করতে পারেন।'
            )}
          </p>

          <div className="pt-2">
            {erasureRequested ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{t('Your deletion request has been registered and will be completed within 24 hours.', 'আপনার অনুরোধ গৃহীত হয়েছে এবং ২৪ ঘণ্টার মধ্যে সম্পূর্ণ হবে।')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsErasureModalOpen(true)}
                className="px-4 py-2 border border-rose-300 text-rose-800 hover:bg-rose-50 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
              >
                {t('DELETE MY ACCOUNT', 'অ্যাকাউন্ট মুছে ফেলুন')}
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Direct WhatsApp Concierge Help */}
        <div className="p-4 bg-[#E6DFD5]/30 border border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-[#1C1917]/80">
            <Phone className="w-4 h-4 text-[#C7A97B] shrink-0" />
            <span>
              {t(
                'Have questions about your data or orders? Talk to our client concierge:',
                'আপনার অ্যাকাউন্ট বা অর্ডার সংক্রান্ত যেকোনো সহায়তায় কথা বলুন:'
              )}
            </span>
          </div>
          <a
            href={concierge.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#1C1917] text-[#F9F6F0] text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#C7A97B] hover:text-[#1C1917] transition-colors shrink-0"
          >
            {t(`${concierge.shortLabel} CONCIERGE`, `${concierge.shortLabel} হেল্পলাইন`)}
          </a>
        </div>

      </div>

      {/* Erasure Confirmation Modal */}
      {isErasureModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsErasureModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#F9F6F0] border border-[#E6DFD5] p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-serif uppercase tracking-wider text-[#1C1917] font-medium">
                {t('CONFIRM ACCOUNT REMOVAL', 'অ্যাকাউন্ট মুছে ফেলার নিশ্চয়তা')}
              </h3>
              <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
                {t(
                  'Are you sure you want to remove your saved contact details and skin consultation history?',
                  'আপনি কি নিশ্চিত যে আপনার সংরক্ষিত তথ্য ও অ্যাকাউন্ট মুছে ফেলতে চান?'
                )}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsErasureModalOpen(false)}
                className="flex-1 py-3 border border-[#E6DFD5] text-xs uppercase tracking-wider text-[#1C1917]"
              >
                {t('CANCEL', 'বাতিল')}
              </button>
              <button
                type="button"
                onClick={handleConfirmErasure}
                className="flex-1 py-3 bg-rose-700 hover:bg-rose-800 text-white text-xs uppercase tracking-wider font-medium"
              >
                {t('CONFIRM DELETE', 'মুছে ফেলুন')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
