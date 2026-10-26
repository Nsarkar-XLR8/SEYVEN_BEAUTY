'use client';

import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Save,
  Mail,
  CheckCircle2,
  Users,
  Search,
  Send,
  Sliders,
  BellRing,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { formatBdt } from '@/lib/formatters';

export default function AdminLoyaltyDeskPage() {
  const { tiers, updateTier, clientSpendRecords, triggerMilestoneEmail } = useAdmin();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailSubject, setEmailSubject] = useState(
    'Congratulations: You Have Unlocked SEYVEN [TierName] ([Discount]% Courtesy Discount)'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('seyven_admin_tiers_v2', JSON.stringify(tiers));
    showToast('Tier thresholds and courtesy discount settings synchronized.');
  };

  const handleSendManualMilestoneEmail = (clientId: string, clientEmail: string) => {
    triggerMilestoneEmail(clientId);
    showToast(`Milestone congratulatory email queued and dispatched to ${clientEmail}`);
  };

  const filteredClients = clientSpendRecords.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded bg-[#1C1917] text-[#C7A97B] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#C7A97B]/40">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C7A97B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B] font-semibold mb-1">
            <Crown className="w-4 h-4 text-[#C7A97B]" />
            <span>Client Loyalty & Tier Governance Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            Spend-Based Luxury Privilege Engine
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Configure cumulative net spend thresholds, automatic courtesy discounts (5%, 8%, 10%), and milestone notification emails.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="min-h-[44px] px-4 py-2.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors shadow-md"
        >
          <Save className="w-4 h-4 text-[#C7A97B]" />
          <span>Save Tier Settings</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#E6DFD5] rounded-lg shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/50 font-mono">
            <span>Silver (5% Off)</span>
            <span className="text-xs text-gray-500 font-mono">৳5,000+</span>
          </div>
          <div className="text-2xl font-sans font-semibold text-[#1C1917] mt-1 tabular-nums tracking-tight">
            {clientSpendRecords.filter((c) => c.currentTier === 'Silver Privilege').length}
          </div>
          <span className="text-[10px] text-[#C7A97B] font-mono">Active 5% Members</span>
        </div>

        <div className="p-4 bg-white border border-[#E6DFD5] rounded-lg shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/50 font-mono">
            <span>Gold (8% Off)</span>
            <span className="text-xs text-amber-600 font-mono">৳10,000+</span>
          </div>
          <div className="text-2xl font-sans font-semibold text-[#1C1917] mt-1 tabular-nums tracking-tight">
            {clientSpendRecords.filter((c) => c.currentTier === 'Gold Privilege').length}
          </div>
          <span className="text-[10px] text-[#8C6D3B] font-mono">Active 8% Members</span>
        </div>

        <div className="p-4 bg-white border border-[#E6DFD5] rounded-lg shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/50 font-mono">
            <span>Noir Atelier (10% Off)</span>
            <span className="text-xs text-[#C7A97B] font-mono">৳20,000+</span>
          </div>
          <div className="text-2xl font-sans font-semibold text-[#1C1917] mt-1 tabular-nums tracking-tight">
            {clientSpendRecords.filter((c) => c.currentTier === 'Noir Atelier').length}
          </div>
          <span className="text-[10px] text-emerald-800 font-mono font-bold">10% Max Privilege Honored</span>
        </div>
      </div>

      {/* 1. Editable Tier & Discount Threshold Configuration */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6DFD5]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#C7A97B]" />
            <h2 className="text-base font-serif font-medium uppercase tracking-wider text-[#1C1917]">
              Cumulative Spend Thresholds & Privilege Discounts
            </h2>
          </div>
          <span className="text-xs text-[#1C1917]/60 font-mono">
            Honored automatically at customer checkout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => (
            <div key={t.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif uppercase tracking-wider font-semibold text-[#1C1917]">
                  {t.name}
                </span>
                <span className="px-2 py-0.5 bg-[#C7A97B]/20 text-[#8C6D3B] text-[10px] font-mono font-bold rounded">
                  {t.discountPercent}% OFF
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-[#1C1917]/60 block">
                  Spend Threshold (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#1C1917]/50">৳</span>
                  <input
                    type="number"
                    value={t.thresholdBdt}
                    onChange={(e) => updateTier(t.id, 'thresholdBdt', Number(e.target.value))}
                    disabled={t.id === 'bronze'}
                    className="w-full pl-6 pr-3 py-1.5 bg-white border border-[#E6DFD5] text-xs text-[#1C1917] font-mono rounded focus:border-[#C7A97B] focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-[#1C1917]/60 block">
                  Courtesy Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={t.discountPercent}
                  onChange={(e) => updateTier(t.id, 'discountPercent', Number(e.target.value))}
                  disabled={t.id === 'bronze'}
                  className="w-full px-3 py-1.5 bg-white border border-[#E6DFD5] text-xs text-[#1C1917] font-mono rounded focus:border-[#C7A97B] focus:outline-none disabled:opacity-40"
                />
              </div>

              <p className="text-[11px] text-[#1C1917]/60 font-light leading-relaxed pt-1">
                {t.descriptionEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Automated Milestone Email Dispatch Settings */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-[#E6DFD5]">
          <Mail className="w-5 h-5 text-[#C7A97B]" />
          <h2 className="text-base font-serif font-medium uppercase tracking-wider text-[#1C1917]">
            Milestone Elevation Email Automation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#1C1917]/70">Default Email Subject Line Template</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9F6F0] border border-[#E6DFD5] text-xs text-[#1C1917] font-mono rounded focus:border-[#C7A97B] focus:outline-none"
            />
            <span className="text-[10px] text-[#1C1917]/50 block">
              Variables: <code className="text-[#8C6D3B]">[ClientName]</code>, <code className="text-[#8C6D3B]">[TierName]</code>, <code className="text-[#8C6D3B]">[Discount]</code>
            </span>
          </div>

          <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs space-y-1.5 font-sans">
            <div className="flex items-center space-x-1.5 text-[#8C6D3B] font-mono text-[11px] font-semibold">
              <BellRing className="w-3.5 h-3.5" />
              <span>Royal Dispatch Preview (Client In-Box)</span>
            </div>
            <p className="text-[#1C1917]/80 font-light text-[11px] italic leading-relaxed">
              &quot;Hello gorgeous, you got a privilege card from us! Your cumulative purchases have crossed ৳[Threshold]. From now on, on all your next orders, you&apos;re going to get [Discount]% courtesy discount automatically honored at checkout.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* 3. Client Spend & Tier Audit Table */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-serif font-medium uppercase tracking-wider text-[#1C1917]">
              Client Lifetime Spend & Tier Registry
            </h2>
            <p className="text-xs text-[#1C1917]/60 mt-0.5">
              Live audit of customer cumulative delivered spend and milestone status.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F9F6F0] border border-[#E6DFD5] text-xs text-[#1C1917] rounded focus:border-[#C7A97B] focus:outline-none"
            />
          </div>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden space-y-3">
          {filteredClients.map((c) => (
            <div key={c.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1917]">{c.name}</span>
                <span className="px-2 py-0.5 bg-white border border-[#E6DFD5] text-[#C7A97B] font-mono text-[10px] font-bold">
                  {c.currentTier}
                </span>
              </div>
              <div className="text-[11px] text-[#1C1917]/60 font-mono">{c.phone} · {c.email}</div>
              <div className="flex items-center justify-between font-mono pt-1 border-t border-[#E6DFD5]">
                <span>Delivered: {c.deliveredOrdersCount} orders</span>
                <span className="font-bold text-[#1C1917]">{formatBdt(c.cumulativeSpendBdt)}</span>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSendManualMilestoneEmail(c.id, c.email)}
                  className="px-3 py-1.5 bg-white border border-[#E6DFD5] text-[#1C1917] text-[11px] font-mono rounded"
                >
                  Send Milestone Email
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Laptop / Desktop View */}
        <div className="hidden lg:block overflow-x-auto border border-[#E6DFD5] rounded">
          <table className="w-full text-left text-xs text-[#1C1917]">
            <thead className="bg-[#F9F6F0] text-[#1C1917]/70 uppercase font-mono text-[10px] tracking-wider border-b border-[#E6DFD5]">
              <tr>
                <th className="p-3">Client Details</th>
                <th className="p-3">Delivered Orders</th>
                <th className="p-3">Cumulative Spend</th>
                <th className="p-3">Privilege Tier</th>
                <th className="p-3">Courtesy Discount</th>
                <th className="p-3">Milestone Email</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD5]">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-[#F9F6F0]/60 transition-colors">
                  <td className="p-3 font-medium text-[#1C1917]">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-[#1C1917]/50 font-mono">{c.phone} · {c.email}</div>
                  </td>
                  <td className="p-3 font-mono">{c.deliveredOrdersCount} orders</td>
                  <td className="p-3 font-mono font-semibold text-[#8C6D3B]">
                    {formatBdt(c.cumulativeSpendBdt)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-[10px] font-mono rounded">
                      {c.currentTier}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-800">
                    {c.discountPercent > 0 ? `${c.discountPercent}% OFF` : '—'}
                  </td>
                  <td className="p-3 text-[10px] font-mono text-[#1C1917]/60">
                    {c.lastMilestoneEmailAt ? (
                      <span className="text-emerald-800 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Sent {c.lastMilestoneEmailAt}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">Not Dispatched</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSendManualMilestoneEmail(c.id, c.email)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-[10px] font-mono rounded inline-flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3 text-[#C7A97B]" />
                      <span>Resend Mail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
