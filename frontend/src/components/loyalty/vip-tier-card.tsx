'use client';

import React from 'react';
import { Crown, Sparkles, Award, ShieldCheck, Gem } from 'lucide-react';
import { formatBdt } from '@/lib/formatters';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'NOIR';

export interface VipTierCardProps {
  currentTier: LoyaltyTier;
  availablePoints: number;
  lifetimePoints: number;
  nextTierPoints?: number;
  pointsNeededForNextTier?: number;
  userName?: string;
  memberId?: string;
}

export function VipTierCard({
  currentTier,
  availablePoints,
  lifetimePoints,
  nextTierPoints,
  pointsNeededForNextTier,
  userName = 'Valued Client',
  memberId = 'SYV-VIP-7019',
}: VipTierCardProps) {
  const tierConfigs = {
    BRONZE: {
      tierName: 'Bronze Tier',
      gradient: 'from-[#1C1917] via-[#2A2421] to-[#1C1917]',
      accentColor: '#CD7F32',
      badgeBg: 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/40',
      icon: Award,
      perks: ['1 Point per ৳100 spent', 'Birthday Beauty Gift', 'Standard Concierge'],
      nextTier: 'SILVER',
    },
    SILVER: {
      tierName: 'Silver VIP',
      gradient: 'from-[#1A1A1A] via-[#2D2D2D] to-[#141414]',
      accentColor: '#E0E0E0',
      badgeBg: 'bg-white/10 text-white border-white/30',
      icon: ShieldCheck,
      perks: ['1.2x Multiplier on Points', 'Complimentary Dhaka Delivery', 'Early Access Edits'],
      nextTier: 'GOLD',
    },
    GOLD: {
      tierName: 'Gold Sanctuary',
      gradient: 'from-[#1E1912] via-[#3D311F] to-[#1E1912]',
      accentColor: '#C7A97B',
      badgeBg: 'bg-[#C7A97B]/20 text-[#C7A97B] border-[#C7A97B]/50',
      icon: Crown,
      perks: ['1.5x Multiplier on Points', 'Complimentary Nationwide Delivery', 'Dedicated WhatsApp Advisor'],
      nextTier: 'NOIR',
    },
    NOIR: {
      tierName: 'Noir Sovereign',
      gradient: 'from-[#0A0A0A] via-[#1F1712] to-[#050505]',
      accentColor: '#E6C687',
      badgeBg: 'bg-gradient-to-r from-[#E6C687]/20 to-[#C7A97B]/20 text-[#E6C687] border-[#E6C687]/60',
      icon: Gem,
      perks: ['2x Multiplier on Points', 'White-Glove Courier Always', 'Private Direct Imports Access'],
      nextTier: null,
    },
  };

  const currentConfig = tierConfigs[currentTier] || tierConfigs.BRONZE;
  const TierIcon = currentConfig.icon;

  const progressPercent = nextTierPoints
    ? Math.min(100, Math.round((lifetimePoints / nextTierPoints) * 100))
    : 100;

  return (
    <div
      className={`relative w-full rounded-xs overflow-hidden border border-[#C7A97B]/40 bg-gradient-to-br ${currentConfig.gradient} text-[#FAF8F5] p-6 sm:p-8 shadow-2xl space-y-6 select-none`}
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#C7A97B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-serif tracking-[0.2em] text-xs uppercase text-[#C7A97B] font-medium">
              SEYVEN SANCTUARY
            </span>
            <span className="text-[#C7A97B]/40">•</span>
            <span className="font-mono text-[10px] tracking-widest text-[#FAF8F5]/60 uppercase">
              {memberId}
            </span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl tracking-[0.08em] font-light text-[#FAF8F5]">
            {userName}
          </h3>
        </div>

        {/* Tier Emblem Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-widest shadow-xs ${currentConfig.badgeBg}`}
        >
          <TierIcon className="w-3.5 h-3.5" />
          <span>{currentConfig.tierName}</span>
        </div>
      </div>

      {/* Points Ledger Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 relative z-10">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#FAF8F5]/60 block">
            AVAILABLE POINTS
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF8F5]">
              {availablePoints.toLocaleString()}
            </span>
            <span className="text-xs font-serif text-[#C7A97B] uppercase tracking-widest">
              = {formatBdt(availablePoints)}
            </span>
          </div>
          <span className="text-[9px] text-[#FAF8F5]/50 font-light block">
            Redeemable at ৳1 per point at checkout
          </span>
        </div>

        <div className="space-y-1 border-l border-white/10 pl-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#FAF8F5]/60 block">
            LIFETIME POINTS EARNED
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="font-mono text-2xl sm:text-3xl font-light tracking-tight text-[#FAF8F5]/90">
              {lifetimePoints.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#C7A97B] uppercase">PTS</span>
          </div>
          <span className="text-[9px] text-[#FAF8F5]/50 font-light block">
            Determines continuous tier elevation
          </span>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {currentConfig.nextTier && nextTierPoints && (
        <div className="space-y-2 pt-2 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] uppercase tracking-wider text-[#FAF8F5]/70">
              Progression toward {currentConfig.nextTier}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#C7A97B] font-medium">
              {pointsNeededForNextTier} PTS TO ELEVATE
            </span>
          </div>

          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#C7A97B] to-[#FAF8F5] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Sovereign Tier Accomplished */}
      {!currentConfig.nextTier && (
        <div className="pt-2 border-t border-white/10 flex items-center space-x-2 text-xs font-serif tracking-wider text-[#E6C687] relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-[#E6C687]" />
          <span>Lifetime Complimentary Courier & Concierge</span>
        </div>
      )}
    </div>
  );
}
