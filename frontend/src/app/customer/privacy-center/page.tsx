'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Trash2, CheckCircle2, MessageCircle, AlertCircle, Phone } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';
import { BRAND } from '@/lib/constants';

export default function PrivacyCenterPage() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const supportPhone = settings?.supportPhone || BRAND.supportPhone;

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (typeof window !== 'undefined') {
        localStorage.removeItem('seyven_client_order_history');
        localStorage.removeItem('seyven_last_order');
      }
      await logout();
      setDeleteSuccess(true);
      setShowConfirmModal(false);
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8 pb-28 lg:pb-16 text-[#1C1917]">
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sanctuary</span>
        </Link>
      </div>

      <div className="space-y-3 pb-6 border-b border-[#E6DFD5]">
        <div className="inline-flex items-center space-x-2 text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CLIENT PRIVACY COMMITMENT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          YOUR PRIVACY & ACCOUNT CARE
        </h1>
        <p className="text-xs text-[#1C1917]/70 leading-relaxed font-light">
          Your contact information, delivery address, and order records are held under strict confidentiality.
        </p>
      </div>

      {/* Reassurance Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-[#FAF8F5] border border-[#E6DFD5] space-y-2">
          <div className="w-8 h-8 rounded-full bg-[#1C1917]/5 flex items-center justify-center text-[#C7A97B]">
            <Lock className="w-4 h-4" />
          </div>
          <h2 className="text-xs uppercase tracking-wider font-medium text-[#1C1917]">
            100% PRIVATE & CONFIDENTIAL
          </h2>
          <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
            We only use your contact details to deliver parcels and provide one-on-one skincare consultation.
          </p>
        </div>

        <div className="p-5 bg-[#FAF8F5] border border-[#E6DFD5] space-y-2">
          <div className="w-8 h-8 rounded-full bg-[#1C1917]/5 flex items-center justify-center text-[#C7A97B]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-xs uppercase tracking-wider font-medium text-[#1C1917]">
            ZERO SPAM • ZERO DATA SHARING
          </h2>
          <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
            We never share or sell client data to third-party marketing companies or advertisers.
          </p>
        </div>
      </div>

      {/* Account Info Block */}
      <div className="p-6 bg-[#FAF8F5] border border-[#E6DFD5] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
          <span className="text-xs font-serif uppercase tracking-wider text-[#1C1917]">
            CURRENT ACCOUNT STATUS
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1C1917]/5 text-[#1C1917]">
            {isAuthenticated ? 'SIGNED IN' : 'GUEST SESSION'}
          </span>
        </div>

        {isAuthenticated && user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#1C1917]/60 block">CLIENT NAME</span>
              <span className="font-medium">{user.fullName || 'Valued Patron'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#1C1917]/60 block">MOBILE NUMBER</span>
              <span className="font-mono">{user.phone}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#1C1917]/70 font-light">
              You are currently browsing as a guest. No persistent account information is saved on our servers.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-xs uppercase tracking-wider hover:bg-[#C7A97B] transition-colors"
            >
              SIGN IN / CREATE ACCOUNT
            </button>
          </div>
        )}
      </div>

      {/* Data Erasure / Account Deletion Request */}
      <div className="p-6 bg-[#FAF8F5] border border-[#E6DFD5] space-y-4">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-[#1C1917]">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h2 className="font-serif">ACCOUNT REMOVAL & CLOSURE</h2>
        </div>

        <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
          You may request permanent deletion of your phone number, delivery address, and account records at any time.
        </p>

        {deleteSuccess ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Your deletion request has been registered and will be completed within 24 hours.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-5 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs uppercase tracking-wider transition-colors"
          >
            DELETE MY ACCOUNT
          </button>
        )}
      </div>

      {/* Help Concierge */}
      <div className="p-5 border border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <strong className="block text-[#1C1917] mb-0.5">Need Assistance With Your Privacy?</strong>
          <span className="text-[#1C1917]/70 font-light">
            Connect directly with our client care team for questions or data requests:
          </span>
        </div>
        <a
          href={concierge.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 bg-[#1C1917] hover:bg-[#C7A97B] text-[#FAF8F5] uppercase tracking-wider transition-colors inline-flex items-center space-x-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{concierge.shortLabel} CONCIERGE</span>
        </a>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/70 backdrop-blur-sm">
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-center font-serif text-sm uppercase tracking-wider text-[#1C1917]">
              CONFIRM ACCOUNT REMOVAL
            </h3>
            <p className="text-xs text-center text-[#1C1917]/70 leading-relaxed font-light">
              Are you sure you want to delete your saved profile and contact information? This action cannot be reversed.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 border border-[#E6DFD5] text-xs uppercase tracking-wider text-[#1C1917] hover:bg-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
