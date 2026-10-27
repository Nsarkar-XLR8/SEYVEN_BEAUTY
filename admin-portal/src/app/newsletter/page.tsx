'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  Sparkles,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  Heading,
  Percent,
  RefreshCw,
  AlertOctagon,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  Tag,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  fullName?: string;
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED';
  source: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  previewText?: string;
  contentHtml: string;
  discountCode?: string;
  discountBanner?: string;
  targetAudience: string;
  status: string;
  recipientCount: number;
  sentAt?: string;
  createdAt: string;
  dlqCount?: number;
}

interface DlqItem {
  id: string;
  jobId: string;
  campaignId: string;
  recipientEmail: string;
  subject: string;
  attemptCount: number;
  errorMessage: string;
  failedAt: string;
}

export default function AdminNewsletterPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'dlq' | 'subscribers' | 'history'>('compose');

  // Form State
  const [title, setTitle] = useState('Eid Ul Fitr 2026 - Festive 7% Privilege Savings');
  const [subject, setSubject] = useState('Festive Sanctuary Privilege: 7% Savings on Curated Rituals');
  const [previewText, setPreviewText] = useState('Celebrate Eid with bespoke international skincare formulations.');
  const [discountCode, setDiscountCode] = useState('EID7');
  const [discountBanner, setDiscountBanner] = useState('Festive Eid Celebration: 7% Off All Sanctuary Curations');
  const [targetAudience, setTargetAudience] = useState('ALL_SUBSCRIBERS');
  const [contentHtml, setContentHtml] = useState(
    `<p>Dear Valued Client,</p>\n<p>In honor of this blessed festive season, we cordially invite you to experience <strong>7% privilege savings</strong> across our entire international skincare sanctuary.</p>\n<p>Whether restoring your dermal barrier or discovering new cellular hydrators formulated for the Bangladeshi climate, your curated rituals await.</p>`
  );

  // Data State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dlqItems, setDlqItems] = useState<DlqItem[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [searchSubscriber, setSearchSubscriber] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState<{
    supportPhone: string;
    supportWhatsApp: string;
  }>({
    supportPhone: '+880 9612 000000',
    supportWhatsApp: '+880 1700 000000',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

  // Load Data
  const fetchData = async () => {
    try {
      // Subscribers
      const subRes = await fetch(`${apiUrl}/newsletter/subscribers`).then((r) => (r.ok ? r.json() : null));
      if (subRes) {
        setSubscribers(subRes.subscribers || []);
        setTotalSubscribers(subRes.total || 0);
        setActiveCount(subRes.activeCount || 0);
      }

      // Campaigns
      const campRes = await fetch(`${apiUrl}/newsletter/campaigns`).then((r) => (r.ok ? r.json() : null));
      if (campRes && Array.isArray(campRes)) {
        setCampaigns(campRes);
      }

      // Settings
      fetch('/api/settings')
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.data) {
            setPlatformSettings({
              supportPhone: json.data.supportPhone || '+880 9612 000000',
              supportWhatsApp: json.data.supportWhatsApp || '+880 1700 000000',
            });
          }
        })
        .catch(() => {});

      // DLQ
      const dlqRes = await fetch(`${apiUrl}/newsletter/dlq`).then((r) => (r.ok ? r.json() : null));
      if (dlqRes) {
        setDlqItems(dlqRes.items || []);
      }
    } catch {
      // fallback in dev
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Formatting helpers for rich text editor
  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = contentHtml.substring(start, end) || 'text';
    const replacement = `${before}${selected}${after}`;
    const newContent = contentHtml.substring(0, start) + replacement + contentHtml.substring(end);
    setContentHtml(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const insertHeading = () => wrapSelection('<h3 style="font-family: Georgia, serif; font-size: 18px; margin: 18px 0 8px 0; color: #1C1917;">', '</h3>');
  const insertBold = () => wrapSelection('<strong>', '</strong>');
  const insertItalic = () => wrapSelection('<em>', '</em>');
  const insertParagraph = () => wrapSelection('<p style="margin: 0 0 14px 0; line-height: 1.7;">', '</p>');
  const insertList = () => wrapSelection('<ul style="margin: 12px 0; padding-left: 20px;">\n  <li>', '</li>\n</ul>');
  const insertLink = () => {
    const url = prompt('Enter link URL (e.g., https://seyven.com.bd/catalog):', 'https://seyven.com.bd/catalog');
    if (url) {
      wrapSelection(`<a href="${url}" target="_blank" style="color: #C7A97B; text-decoration: underline; font-weight: 500;">`, '</a>');
    }
  };

  // Preset Template for Eid 7% Discount
  const applyEidPreset = () => {
    setTitle('Eid Ul Fitr 2026 - Festive 7% Privilege Savings');
    setSubject('A Festive Sanctuary Privilege: Enjoy 7% Savings on Curated Rituals');
    setPreviewText('Celebrate this blessed Eid with bespoke international skincare formulations.');
    setDiscountCode('EID7');
    setDiscountBanner('Festive Eid Celebration: 7% Off All Sanctuary Curations');
    setContentHtml(
      `<p style="margin: 0 0 14px 0; line-height: 1.7;">Dear Valued Client,</p>\n` +
      `<p style="margin: 0 0 14px 0; line-height: 1.7;">In celebration of this blessed Eid, we invite you to experience <strong>7% privilege savings</strong> across our entire international skincare sanctuary.</p>\n` +
      `<h3 style="font-family: Georgia, serif; font-size: 18px; margin: 18px 0 8px 0; color: #1C1917;">Curated Dermal Recommendations for the Season:</h3>\n` +
      `<ul style="margin: 12px 0; padding-left: 20px;">\n` +
      `  <li style="margin-bottom: 8px;"><strong>Barrier Recovery Serums:</strong> Soothe inflammation from tropical humidity.</li>\n` +
      `  <li style="margin-bottom: 8px;"><strong>Luminous Cellular Toners:</strong> Achieve a healthy radiant festive glow.</li>\n` +
      `  <li style="margin-bottom: 8px;"><strong>Weightless Broad-Spectrum SPF:</strong> Complete daily defense under Dhaka sun.</li>\n` +
      `</ul>\n` +
      `<p style="margin: 0 0 14px 0; line-height: 1.7;">Your <strong>7% Festive Privilege</strong> has been credited to your Sanctuary account and will be automatically honored upon entering through the private invitation link below.</p>`
    );
    showToast('Applied Eid 7% Luxury Newsletter Template');
  };

  // Broadcast Handler
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !contentHtml) {
      alert('Please fill out Title, Subject and Email Content.');
      return;
    }

    if (!confirm(`Are you sure you want to broadcast this campaign to ${activeCount} active subscribers via Queue with Dead Letter Queue protection?`)) {
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch(`${apiUrl}/newsletter/campaigns/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          contentHtml,
          discountCode: discountCode || undefined,
          discountBanner: discountBanner || undefined,
          targetAudience,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Broadcast queued! Dispatched to ${data.recipientCount} subscribers with DLQ safety.`);
        fetchData();
        setActiveTab('history');
      } else {
        alert(data?.message || 'Broadcast failed.');
      }
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // DLQ Re-drive
  const handleRedriveDlq = async (dlqId?: string) => {
    try {
      const endpoint = dlqId ? `${apiUrl}/newsletter/dlq/${dlqId}/retry` : `${apiUrl}/newsletter/dlq/redrive-all`;
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'DLQ items re-driven back into primary queue.');
      fetchData();
    } catch (err: any) {
      alert(`DLQ redrive error: ${err.message}`);
    }
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchSubscriber.toLowerCase()) ||
      (s.fullName && s.fullName.toLowerCase().includes(searchSubscriber.toLowerCase()))
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded bg-[#1C1917] text-[#C7A97B] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#C7A97B]/40">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C7A97B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DFD5] pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#C7A97B] font-bold">
              MARKETING & CLIENT ADVISORY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1C1917] text-white tracking-widest">
              DLQ RELIABLE
            </span>
          </div>
          <h1 className="text-xl font-serif tracking-wide text-[#1C1917] mt-1">
            Newsletter & Client Dispatches
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Compose rich-text newsletters, seasonal client advisory dispatches, and manage the Dead Letter Queue.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-[#F5F2EB] p-1 rounded border border-[#E6DFD5] text-xs">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded transition-colors font-medium flex items-center space-x-1.5 ${
              activeTab === 'compose' ? 'bg-[#1C1917] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Compose</span>
          </button>
          <button
            onClick={() => setActiveTab('dlq')}
            className={`px-3 py-1.5 rounded transition-colors font-medium flex items-center space-x-1.5 ${
              activeTab === 'dlq' ? 'bg-[#1C1917] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>DLQ Desk</span>
            {dlqItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px]">
                {dlqItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-3 py-1.5 rounded transition-colors font-medium flex items-center space-x-1.5 ${
              activeTab === 'subscribers' ? 'bg-[#1C1917] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Subscribers ({activeCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded transition-colors font-medium flex items-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-[#1C1917] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({campaigns.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COMPOSE & LIVE PREVIEW */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: EDITOR FORM (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded border border-[#E6DFD5] p-6 shadow-sm space-y-5">
              
              {/* Quick Template Selector */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2EB]">
                <div className="flex items-center space-x-2 text-xs font-medium text-[#1C1917]">
                  <Sparkles className="w-4 h-4 text-[#C7A97B]" />
                  <span>Curated Quick Presets:</span>
                </div>
                <button
                  type="button"
                  onClick={applyEidPreset}
                  className="px-3 py-1 bg-[#F9F6F0] hover:bg-[#EFECE6] border border-[#C7A97B]/50 rounded text-xs text-[#1C1917] font-medium transition-colors flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-[#C7A97B]" />
                  <span>Insert Festive Client Privilege</span>
                </button>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                
                {/* Campaign Title */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#1C1917] mb-1">
                    Internal Campaign Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Eid Ul Fitr 2026 - Festive 7% Privilege Savings"
                    className="w-full text-xs p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B]"
                  />
                </div>

                {/* Email Subject Line */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#1C1917] mb-1">
                    Email Subject Line (Client Inbox)
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. A Festive Sanctuary Privilege: Enjoy 7% Savings on Curated Rituals"
                    className="w-full text-xs p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B]"
                  />
                </div>

                {/* Preheader / Preview Text */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#1C1917] mb-1">
                    Preheader / Preview Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Brief teaser visible before opening email"
                    className="w-full text-xs p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B]"
                  />
                </div>

                {/* Promo Code & Banner Highlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-[#78716C] mb-1">
                      Privilege Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="e.g. EID7"
                      className="w-full text-xs font-mono font-bold p-2 bg-white border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-[#78716C] mb-1">
                      Privilege Invitation Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      value={discountBanner}
                      onChange={(e) => setDiscountBanner(e.target.value)}
                      placeholder="e.g. Festive Eid Celebration: 7% Privilege Savings"
                      className="w-full text-xs p-2 bg-white border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B]"
                    />
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#1C1917] mb-1">
                    Target Audience Segment
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B]"
                  >
                    <option value="ALL_SUBSCRIBERS">All Active Newsletter Subscribers ({activeCount} recipients)</option>
                    <option value="VIP_CUSTOMERS">Sanctuary VIP & Loyalty Members</option>
                    <option value="ALL_CUSTOMERS">All Registered Clients with Verified Email</option>
                  </select>
                </div>

                {/* Rich Text Editor Toolbar & Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#1C1917]">
                      Email Body Content (Rich Text)
                    </label>
                    <span className="text-[10px] text-[#78716C]">HTML & Styling supported</span>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#1C1917] text-white rounded-t border border-[#1C1917]">
                    <button
                      type="button"
                      onClick={insertBold}
                      title="Bold text"
                      className="p-1.5 hover:bg-white/20 rounded text-xs transition-colors flex items-center space-x-1"
                    >
                      <Bold className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertItalic}
                      title="Italic text"
                      className="p-1.5 hover:bg-white/20 rounded text-xs transition-colors flex items-center space-x-1"
                    >
                      <Italic className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Italic</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertHeading}
                      title="Heading"
                      className="p-1.5 hover:bg-white/20 rounded text-xs transition-colors flex items-center space-x-1"
                    >
                      <Heading className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Heading</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertParagraph}
                      title="Paragraph"
                      className="p-1.5 hover:bg-white/20 rounded text-xs transition-colors"
                    >
                      <span className="text-[10px]">¶ Paragraph</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertList}
                      title="Bullet list"
                      className="p-1.5 hover:bg-white/20 rounded text-xs transition-colors flex items-center space-x-1"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="text-[10px]">List</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertLink}
                      title="Hyperlink"
                      className="p-1.5 hover:bg-white/20 rounded text-xs transition-colors flex items-center space-x-1"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Link</span>
                    </button>
                  </div>

                  {/* Editable Textarea */}
                  <textarea
                    ref={textareaRef}
                    required
                    rows={8}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-[#FAF8F5] border border-t-0 border-[#E6DFD5] rounded-b focus:outline-none focus:border-[#C7A97B] leading-relaxed"
                  />
                </div>

                {/* Submit / Broadcast Action */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-[#78716C] flex items-center space-x-1">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    <span>Dead Letter Queue (DLQ) will capture any undeliverable jobs.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="px-6 py-2.5 bg-[#1C1917] hover:bg-[#C7A97B] text-white transition-colors rounded text-xs font-semibold tracking-wider uppercase flex items-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to Queue'}</span>
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE LUXURY EMAIL PREVIEW (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#1C1917] flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-[#C7A97B]" />
                <span>Live Inbox Mockup Preview</span>
              </span>
              <span className="text-[10px] text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6DFD5]">
                Subject: {subject.slice(0, 30)}...
              </span>
            </div>

            {/* Simulated Email Container */}
            <div className="bg-[#F9F6F0] p-4 rounded border border-[#E6DFD5] shadow-inner text-left max-h-[700px] overflow-y-auto">
              <div className="bg-white rounded border border-[#E6DFD5] shadow-sm overflow-hidden">
                
                {/* Gold Top Accent */}
                <div className="h-1 bg-[#C7A97B]" />

                {/* Email Header */}
                <div className="p-5 text-center border-b border-[#E6DFD5]">
                  <h2 className="font-serif text-lg tracking-[0.25em] text-[#1C1917]">SEYVEN</h2>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-[#C7A97B] font-medium mt-0.5">
                    THE SANCTUARY OF BEAUTY
                  </p>
                </div>

                {/* Email Body */}
                <div className="p-6 space-y-4 text-xs text-[#374151]">
                  {/* Luxury Privilege Highlight */}
                  {(discountBanner || discountCode) && (
                    <div className="my-3 p-4 bg-[#1C1917] text-center border border-[#C7A97B]/50 rounded-none space-y-1.5 shadow-xs">
                      {discountBanner && (
                        <p className="font-serif text-[11px] uppercase tracking-[0.18em] text-[#C7A97B] font-light">
                          {discountBanner}
                        </p>
                      )}
                      {discountCode && (
                        <div className="pt-0.5">
                          <span className="text-[9px] uppercase tracking-[0.25em] text-[#FAF8F5]/60 block font-sans">
                            SANCTUARY CLIENT PRIVILEGE
                          </span>
                          <span className="font-mono text-sm font-semibold text-[#FAF8F5] tracking-[0.25em] inline-block mt-0.5 border-b border-[#C7A97B]/50 pb-0.5">
                            {discountCode}
                          </span>
                          <span className="text-[8px] uppercase tracking-[0.2em] text-[#C7A97B] block mt-1 font-sans">
                            ✦ AUTOMATICALLY HONORED UPON ENTRY ✦
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rendered HTML Body */}
                  <div
                    className="space-y-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />

                  {/* CTA Button with Hero Hover Effect and Automatic Privilege Link */}
                  <div className="text-center pt-4">
                    <a
                      href={`https://seyven.com.bd/catalog?privilege=${discountCode || 'EID7'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-sm rounded-none cursor-pointer"
                    >
                      <span>Explore Sanctuary Curations</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>

                {/* Email Footer & Unsubscribe */}
                <div className="p-4 bg-[#F9F6F0] border-t border-[#E6DFD5] text-center text-[10px] text-[#78716C] space-y-2">
                  <p className="uppercase tracking-wider font-semibold text-[#1C1917]">
                    SEYVEN BEAUTY SANCTUARY &bull; BANGLADESH
                  </p>
                  <p className="text-[9px] leading-tight text-[#8E8B85]">
                    K.B. Saha Road, Amlapara, Chashara Commercial Area, Narayanganj - 1400, Bangladesh<br/>
                    Support Hotline: {platformSettings.supportPhone} | WhatsApp: {platformSettings.supportWhatsApp}
                  </p>
                  <div className="pt-2 border-t border-[#E6DFD5]/60 text-[9px] text-[#A8A29E]">
                    You received this dispatch as a SEYVEN subscriber.<br/>
                    <span className="text-[#78716C] underline cursor-pointer">
                      Unsubscribe instantly here
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DEAD LETTER QUEUE (DLQ) DESK */}
      {activeTab === 'dlq' && (
        <div className="space-y-6">
          <div className="bg-white rounded border border-[#E6DFD5] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h2 className="text-base font-semibold text-[#1C1917]">
                    Dead Letter Queue (DLQ) Audit & Re-drive Desk
                  </h2>
                </div>
                <p className="text-xs text-[#78716C] mt-1">
                  Jobs that failed after 3 retry attempts are automatically sequestered here to prevent lost messages.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleRedriveDlq()}
                  disabled={dlqItems.length === 0}
                  className="px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#C7A97B] text-white rounded text-xs font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-drive All Failed Jobs ({dlqItems.length})</span>
                </button>
              </div>
            </div>

            {dlqItems.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#78716C] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-semibold text-[#1C1917]">Dead Letter Queue is Clear</p>
                <p className="text-[11px] text-[#8E8B85]">All newsletter dispatches have been successfully delivered or enqueued.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E6DFD5]">
                    <tr>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Attempts</th>
                      <th className="py-2.5 px-3">Error Diagnosis</th>
                      <th className="py-2.5 px-3">Failed At</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5]">
                    {dlqItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-[#1C1917]">
                          {item.recipientEmail}
                        </td>
                        <td className="py-3 px-3 text-[#1C1917]">
                          {item.subject}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[10px]">
                            {item.attemptCount} / 3
                          </span>
                        </td>
                        <td className="py-3 px-3 text-red-600 font-mono text-[11px] max-w-xs truncate">
                          {item.errorMessage}
                        </td>
                        <td className="py-3 px-3 text-[#78716C] text-[11px]">
                          {new Date(item.failedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRedriveDlq(item.id)}
                            className="px-2.5 py-1 bg-[#1C1917] hover:bg-[#C7A97B] text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Re-drive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIBERS DESK */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded border border-[#E6DFD5] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">
                Subscriber Sanctuary Directory ({activeCount} Active / {totalSubscribers} Total)
              </h2>
              <p className="text-xs text-[#78716C] mt-1">
                Clients who joined via boutique footer, VIP concierge consultation, or checkout opting in for rituals.
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchSubscriber}
                onChange={(e) => setSearchSubscriber(e.target.value)}
                placeholder="Search by email or name..."
                className="text-xs p-2 pl-3 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:outline-none focus:border-[#C7A97B] w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E6DFD5]">
                <tr>
                  <th className="py-2.5 px-3">Client Email</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Channel Source</th>
                  <th className="py-2.5 px-3">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5]">
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-[#1C1917]">
                      {sub.email}
                    </td>
                    <td className="py-3 px-3 text-[#1C1917]">
                      {sub.fullName || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sub.status === 'SUBSCRIBED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-[#F5F2EB] text-[#78716C] font-mono text-[10px]">
                        {sub.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#78716C] text-[11px]">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CAMPAIGN HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded border border-[#E6DFD5] p-6 shadow-sm space-y-4">
          <div className="pb-4 border-b border-[#E6DFD5]">
            <h2 className="text-base font-semibold text-[#1C1917]">
              Dispatched Broadcast Campaign Archive
            </h2>
            <p className="text-xs text-[#78716C] mt-1">
              Historical record of sent newsletters, festive promos, and delivery metrics.
            </p>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#78716C]">
              No previous campaigns have been dispatched yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF8F5] text-[#78716C] uppercase tracking-wider font-semibold border-b border-[#E6DFD5]">
                  <tr>
                    <th className="py-2.5 px-3">Campaign Title</th>
                    <th className="py-2.5 px-3">Subject Line</th>
                    <th className="py-2.5 px-3">Privilege Code</th>
                    <th className="py-2.5 px-3">Recipients</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Dispatched Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD5]">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-3 font-medium text-[#1C1917]">
                        {camp.title}
                      </td>
                      <td className="py-3 px-3 text-[#78716C]">
                        {camp.subject}
                      </td>
                      <td className="py-3 px-3">
                        {camp.discountCode ? (
                          <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#C7A97B] font-mono font-bold text-[#1C1917] text-[10px]">
                            {camp.discountCode}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {camp.recipientCount} clients
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#78716C] text-[11px]">
                        {new Date(camp.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
