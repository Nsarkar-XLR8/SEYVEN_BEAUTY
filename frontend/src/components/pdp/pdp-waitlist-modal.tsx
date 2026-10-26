'use client';

import React, { useState } from 'react';
import { X, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { ProductDetail } from '@/data/products';

interface PdpWaitlistModalProps {
  product: ProductDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function PdpWaitlistModal({ product, isOpen, onClose }: PdpWaitlistModalProps) {
  const { lang, t } = useLanguage();
  const [contact, setContact] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = contact.trim();
    if (!clean) {
      setError(t('Please provide your phone number or email.', 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল দিন।'));
      return;
    }

    // Basic Bangladeshi phone or email check
    const isPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(clean.replace(/\s+/g, ''));
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);

    if (!isPhone && !isEmail) {
      setError(
        t(
          'Please enter a valid 11-digit Bangladeshi phone (01XXXXXXXXX) or email address.',
          'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর (০১xxxxxxxxx) বা ইমেইল লিখুন।'
        )
      );
      return;
    }

    setError(null);
    setIsSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F9F6F0] border border-[#E6DFD5] p-6 sm:p-8 space-y-6 relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center">
          <div className="w-10 h-10 rounded-full bg-[#E6DFD5]/40 border border-[#E6DFD5] flex items-center justify-center mx-auto text-[#C7A97B]">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-serif uppercase tracking-[0.16em] text-[#1C1917] font-medium pt-2">
            {t('NOTIFY WHEN RESTOCKED', 'স্টকে আসলে আমাকে জানান')}
          </h3>
          <p className="text-xs text-[#1C1917]/70 font-light max-w-xs mx-auto">
            {lang === 'bn' ? product.titleBn : product.titleEn}
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
            <h4 className="text-xs uppercase tracking-wider font-semibold text-emerald-900">
              {t('YOU ARE ON THE SANCTUARY WAITLIST', 'আপনি তালিকায় যুক্ত হয়েছেন')}
            </h4>
            <p className="text-xs text-emerald-800 font-light leading-relaxed">
              {t(
                'We will dispatch an instant notification to you via SMS and email as soon as fresh verified inventory arrives at our Dhaka fulfillment center.',
                'নতুন ব্যাচ ঢাকায় পৌঁছানোর সাথে সাথে আপনাকে এসএমএস ও ইমেইলে জানিয়ে দেওয়া হবে।'
              )}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-[#1C1917] text-[#F9F6F0] text-[10px] uppercase tracking-[0.2em] font-medium"
            >
              {t('CLOSE', 'ঠিক আছে')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="waitlist-contact"
                className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium"
              >
                {t('PHONE NUMBER (BD) OR EMAIL ADDRESS', 'মোবাইল নম্বর অথবা ইমেইল')}
              </label>
              <input
                id="waitlist-contact"
                type="text"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setError(null);
                }}
                placeholder="01700 000000 or you@gmail.com"
                className="w-full bg-[#F9F6F0] border border-[#E6DFD5] px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-hidden focus:border-[#C7A97B] transition-colors"
              />
              {error && (
                <div className="flex items-center space-x-1 text-xs text-rose-600 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-[#1C1917]/60 leading-relaxed font-light">
              {t(
                'We respect your privacy. No marketing spam. Only single-use restocking alerts.',
                'আপনার তথ্যের শতভাগ গোপনীয়তা নিশ্চিত করা হয়। শুধুমাত্র এই প্রোডাক্ট স্টকে আসার অ্যালার্ট পাঠানো হবে।'
              )}
            </p>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#1C1917] hover:bg-[#1C1917]/90 text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium transition-colors"
            >
              {t('CONFIRM WAITLIST REGISTRATION', 'অ্যালার্ট চালু করুন')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
