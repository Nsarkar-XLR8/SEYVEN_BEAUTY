'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Crown, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { formatBdt } from '@/lib/formatters';

interface CheckoutLoyaltySliderProps {
  onRedeemChange: (discountBdt: number) => void;
  maxSubtotalBdt: number;
  phone?: string;
  email?: string;
  onClientRecognized?: (clientName: string) => void;
}

export function CheckoutLoyaltySlider({
  onRedeemChange,
  maxSubtotalBdt,
  phone = '',
  email = '',
  onClientRecognized,
}: CheckoutLoyaltySliderProps) {
  const { lang, t } = useLanguage();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [isReturningClient, setIsReturningClient] = useState(false);
  const [matchedBy, setMatchedBy] = useState<'phone' | 'email' | 'account' | null>(null);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check returning client status using BOTH Phone Number and Email systematically
  useEffect(() => {
    // 1. If authenticated account already has repeat order history
    if (isAuthenticated) {
      const hasPastOrders = Boolean(
        (user as any)?.ordersSummary?.deliveredOrdersCount > 0 ||
        (user as any)?.ordersCount > 0 ||
        (user as any)?.loyalty?.isRepeatClient
      );
      if (hasPastOrders) {
        setIsReturningClient(true);
        setMatchedBy('account');
        setRecognizedName(user?.fullName || null);
        return;
      }
    }

    // 2. Check local client history (immediate offline recognition)
    try {
      const rawHistory = localStorage.getItem('seyven_client_order_history');
      if (rawHistory) {
        const history: any[] = JSON.parse(rawHistory);
        const cleanPhoneInput = phone.replace(/\D/g, '');
        const cleanEmailInput = email.trim().toLowerCase();

        // Check phone first
        if (cleanPhoneInput.length >= 10) {
          const match = history.find((h) => {
            const hp = (h.phone || '').replace(/\D/g, '');
            return hp.endsWith(cleanPhoneInput) || cleanPhoneInput.endsWith(hp);
          });
          if (match) {
            setIsReturningClient(true);
            setMatchedBy('phone');
            setRecognizedName(match.name || null);
            if (match.name && onClientRecognized) onClientRecognized(match.name);
            return;
          }
        }

        // If phone not matched, check email
        if (cleanEmailInput && cleanEmailInput.includes('@')) {
          const match = history.find((h) => (h.email || '').trim().toLowerCase() === cleanEmailInput);
          if (match) {
            setIsReturningClient(true);
            setMatchedBy('email');
            setRecognizedName(match.name || null);
            if (match.name && onClientRecognized) onClientRecognized(match.name);
            return;
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 3. Debounced API check against backend database
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanEmail = email.trim();

    if (cleanPhone.length < 10 && (!cleanEmail || !cleanEmail.includes('@'))) {
      setIsReturningClient(false);
      setMatchedBy(null);
      setRecognizedName(null);
      return;
    }

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
        const params = new URLSearchParams();
        if (cleanPhone.length >= 10) params.append('phone', cleanPhone);
        if (cleanEmail && cleanEmail.includes('@')) params.append('email', cleanEmail);

        const res = await fetch(`${apiUrl}/orders/check-returning-client?${params.toString()}`);
        const data = await res.json();

        if (data.success && data.isReturningClient) {
          setIsReturningClient(true);
          setMatchedBy(data.matchedBy);
          setRecognizedName(data.customerName || null);
          if (data.customerName && onClientRecognized) {
            onClientRecognized(data.customerName);
          }
        } else {
          setIsReturningClient(false);
          setMatchedBy(null);
          setRecognizedName(null);
        }
      } catch {
        // network failure fallback
      }
    }, 400);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [phone, email, isAuthenticated, user, onClientRecognized]);

  // 5% returning client courtesy is strictly gated behind authenticated membership
  const isPrivilegeEligible = isAuthenticated && isReturningClient;
  const privilegePercent = isPrivilegeEligible ? 5 : 0;
  const discountAmount = Math.round(maxSubtotalBdt * (privilegePercent / 100));

  useEffect(() => {
    if (isPrivilegeEligible && discountAmount > 0) {
      onRedeemChange(discountAmount);
    } else {
      onRedeemChange(0);
    }
  }, [isPrivilegeEligible, discountAmount, onRedeemChange]);

  // Case 1: Authenticated Returning Client (5% discount applied)
  if (isAuthenticated && isReturningClient) {
    return (
      <div className="p-4 bg-[#F9F6F0] border border-[#C7A97B]/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm transition-all duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#C7A97B]/20 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-[#8C6D3B]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-semibold">
                {recognizedName
                  ? `HONORED CLIENT: ${recognizedName.toUpperCase()}`
                  : 'ESTEEMED RETURNING CLIENT PRIVILEGE'}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase rounded">
                5% PRIVILEGE APPLIED
              </span>
            </div>
            <span className="text-[11px] text-[#1C1917]/70 font-light block mt-0.5">
              {matchedBy === 'phone'
                ? 'Recognized via phone number — 5% automatic returning courtesy honored.'
                : matchedBy === 'email'
                ? 'Recognized via email address — 5% automatic returning courtesy honored.'
                : 'Honoring your cherished relationship with SEYVEN — automatic courtesy applied.'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-serif font-medium text-emerald-800">
            -{formatBdt(discountAmount)}
          </div>
          <span className="text-[10px] text-[#1C1917]/50 block font-light">
            (5% courtesy on curation)
          </span>
        </div>
      </div>
    );
  }

  // Case 2: Unauthenticated Guest with Returning Record (Prompt to log in to redeem)
  if (!isAuthenticated && isReturningClient) {
    return (
      <div className="p-4 bg-[#F9F6F0] border border-[#C7A97B]/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm transition-all duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#C7A97B]/20 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-[#8C6D3B]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-semibold">
                {recognizedName
                  ? `HONORED CLIENT DETECTED: ${recognizedName.toUpperCase()}`
                  : 'RETURNING CLIENT DETECTED'}
              </span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold uppercase rounded">
                LOGIN TO REDEEM 5%
              </span>
            </div>
            <span className="text-[11px] text-[#1C1917]/70 font-light block mt-0.5">
              Log in to your Private Client Account to apply your lifetime 5% Courtesy Privilege on this curation.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openAuthModal}
          className="px-4 py-2 bg-[#1C1917] hover:bg-[#1C1917]/90 text-[#F9F6F0] text-[10px] uppercase tracking-widest font-medium transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          LOG IN TO APPLY 5%
        </button>
      </div>
    );
  }

  // Case 3: Inaugural Shopper / Unrecognized Guest
  return (
    <div className="p-3.5 bg-[#F9F6F0] border border-[#E6DFD5] flex items-center justify-between text-xs text-[#1C1917]/80 rounded-sm transition-all duration-300">
      <div className="flex items-center space-x-2.5">
        <Sparkles className="w-4 h-4 text-[#C7A97B] shrink-0" />
        <div>
          <span className="font-serif tracking-wide text-[#1C1917] font-medium block">
            Seyven Sanctuary Client Courtesy
          </span>
          <p className="text-[10px] text-[#1C1917]/60 font-light">
            First curation unlocks lifetime 5% privilege. Returning registered clients receive 5% off every order.
          </p>
        </div>
      </div>
      <span className="text-[10px] text-[#C7A97B] uppercase tracking-widest font-serif shrink-0 ml-2">
        MEMBER EXCLUSIVE
      </span>
    </div>
  );
}
