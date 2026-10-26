'use client';

import React from 'react';
import { Crown, Sparkles, Award, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';

export type VipTierLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'NOIR';

interface VipTierCardProps {
  currentTier: VipTierLevel;
  pointsBalance: number;
  lifetimePoints: number;
  nextTier: VipTierLevel | null;
  pointsNeededForNextTier: number;
  progressPercent: number;
}

export function VipTierCard({
  currentTier,
  pointsBalance,
  lifetimePoints,
  nextTier,
  pointsNeededForNextTier,
  progressPercent,
}: VipTierCardProps) {
  const { lang, t } = useLanguage();

  const tierStyles: Record<
    VipTierLevel,
    {
      bgGradient: string;
      borderColor: string;
      textColor: string;
      accentColor: string;
      tierNameBn: string;
      multiplier: string;
    }
  > = {
    BRONZE: {
      bgGradient: 'bg-linear-to-br from-[#E6DFD5]/40 via-[#F9F6F0] to-[#E6DFD5]/60',
      borderColor: 'border-[#E6DFD5]',
      textColor: 'text-[#1C1917]',
      accentColor: 'text-[#C7A97B]',
      tierNameBn: 'ব্রোঞ্জ সুবিধা',
      multiplier: '1.0x',
    },
    SILVER: {
      bgGradient: 'bg-linear-to-br from-[#F0F2F5] via-[#F9F6F0] to-[#E2E6EA]',
      borderColor: 'border-slate-300',
      textColor: 'text-[#1C1917]',
      accentColor: 'text-slate-600',
      tierNameBn: 'সিলভার ভিআইপি',
      multiplier: '1.25x',
    },
    GOLD: {
      bgGradient: 'bg-linear-to-br from-[#FDF9F0] via-[#F9F6F0] to-[#EBDCB9]/40',
      borderColor: 'border-[#C7A97B]',
      textColor: 'text-[#1C1917]',
      accentColor: 'text-[#C7A97B]',
      tierNameBn: 'গোল্ড স্যাঙ্কচুয়ারি',
      multiplier: '1.5x',
    },
    NOIR: {
      bgGradient: 'bg-linear-to-br from-[#1C1917] via-[#2A2624] to-[#12100E]',
      borderColor: 'border-[#C7A97B]/70',
      textColor: 'text-[#F9F6F0]',
      accentColor: 'text-[#C7A97B]',
      tierNameBn: 'নোয়ার প্রিভিলেজ (সর্বোচ্চ)',
      multiplier: '2.0x',
    },
  };

  const style = tierStyles[currentTier] || tierStyles.GOLD;
  const isNoir = currentTier === 'NOIR';

  return (
    <div
      className={`relative p-6 sm:p-8 border overflow-hidden shadow-md transition-all duration-300 select-none ${style.bgGradient} ${style.borderColor}`}
    >
      {/* Subtle Background Watermark Ring */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full border border-[#C7A97B]/20 pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full border border-[#C7A97B]/10 pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Crown className={`w-4 h-4 ${style.accentColor}`} />
            <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[#C7A97B]">
              SEYVEN SANCTUARY VIP
            </span>
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-serif uppercase tracking-[0.2em] font-light ${style.textColor}`}
          >
            {currentTier} TIER
          </h2>
          <span className="text-[11px] opacity-75 font-light block">
            {lang === 'bn' ? style.tierNameBn : `Tier Multiplier: ${style.multiplier} Reward Rate`}
          </span>
        </div>

        {/* Exclusive Tier Badge */}
        <div className="px-3 py-1 bg-[#1C1917]/10 backdrop-blur-xs border border-[#C7A97B]/40 text-center">
          <span className="text-[8px] uppercase tracking-[0.2em] font-mono font-semibold text-[#C7A97B]">
            {currentTier} STATUS
          </span>
        </div>
      </div>

      {/* Middle Points Breakdown */}
      <div className="pt-8 pb-6 grid grid-cols-2 gap-4 relative z-10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-65 block">
            {t('AVAILABLE POINTS', 'বর্তমান ব্যালেন্স')}
          </span>
          <div className="flex items-baseline space-x-2 pt-1">
            <span
              className={`text-2xl sm:text-3xl font-sans font-semibold tracking-tight tabular-nums ${style.textColor}`}
            >
              {pointsBalance}
            </span>
            <span className="text-[10px] font-mono text-[#C7A97B] font-medium">
              = {formatBdt(pointsBalance)}
            </span>
          </div>
          <span className="text-[9px] opacity-60 block pt-0.5">
            {t('Redeemable at ৳1 per point at checkout', 'চেকআউটে ১ পয়েন্ট = ১ টাকা ছাড়')}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-65 block">
            {t('LIFETIME POINTS EARNED', 'মোট অর্জিত পয়েন্ট')}
          </span>
          <span
            className={`text-xl sm:text-2xl font-sans font-medium tracking-tight pt-1 block tabular-nums ${style.textColor}`}
          >
            {lifetimePoints} PTS
          </span>
          <span className="text-[9px] opacity-60 block pt-0.5">
            {t('Determines continuous tier elevation', 'যা আপনার পরবর্তী টায়ার নির্ধারণ করে')}
          </span>
        </div>
      </div>

      {/* Bottom Progress Meter (if not max tier) */}
      {nextTier ? (
        <div className="space-y-2 pt-4 border-t border-[#E6DFD5]/50 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className={`text-[10px] uppercase tracking-wider font-light ${style.textColor}`}>
              {t('Progression toward', 'পরবর্তী স্তর:')}{' '}
              <strong className="text-[#C7A97B] uppercase">{nextTier}</strong>
            </span>
            <span className="font-mono text-[10px] text-[#C7A97B]">
              {pointsNeededForNextTier} {t('PTS TO ELEVATE', 'পয়েন্ট বাকি')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#E6DFD5]/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C7A97B] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-[#C7A97B]/40 flex items-center justify-between text-xs relative z-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-semibold flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PINNACLE NOIR STATUS UNLOCKED</span>
          </span>
          <span className="text-[9px] opacity-70">
            {t('Lifetime Complimentary Courier & Concierge', 'আজীবন ফ্রি হোম ডেলিভারি ও পার্সোনাল কনসিয়ার্জ')}
          </span>
        </div>
      )}
    </div>
  );
}
