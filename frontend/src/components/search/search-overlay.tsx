'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchProduct {
  id: string;
  slug: string;
  titleEn: string;
  titleBn?: string;
  brand?: string;
  category?: string | null;
  priceBdt?: number | null;
  volume?: string;
  imageUrl?: string;
}

interface SearchCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { t, lang } = useLanguage();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setProducts([]);
      setCategories([]);
      setSuggestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      setCategories([]);
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/search/autocomplete?q=${encodeURIComponent(trimmed)}`);
        if (res) {
          setProducts(Array.isArray(res.products) ? res.products : []);
          setCategories(Array.isArray(res.categories) ? res.categories : []);
          setSuggestions(Array.isArray(res.suggestions) ? res.suggestions : []);
        } else {
          setProducts([]);
          setCategories([]);
          setSuggestions([]);
        }
      } catch {
        setProducts([]);
        setCategories([]);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onClose();
      router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasResults = products.length > 0 || categories.length > 0 || suggestions.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F0E0D]/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Search Sheet */}
      <div className="relative w-full max-w-4xl mx-auto my-6 sm:my-12 px-4 z-10 animate-in fade-in slide-in-from-top-6 duration-300">
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-sm shadow-2xl overflow-hidden">
          
          {/* Top Search Bar */}
          <div className="p-4 sm:p-6 border-b border-[#E8E2D9] bg-[#F4EFEA]/80">
            <div className="flex items-center space-x-3.5">
              <Search className="w-5 h-5 text-[#C7A97B] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(
                  'SEARCH BRANDS, FORMULATIONS, VOLUME (E.G. ANUA, COSRX, 50ML)...',
                  'ব্র্যান্ড, ফর্মুলেশন বা সাইজ খুঁজুন (যেমন: ANUA, COSRX, 50ML)...'
                )}
                className="w-full bg-transparent text-sm sm:text-base font-serif tracking-[0.08em] placeholder:text-[#1C1917]/40 text-[#1C1917] focus:outline-none"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 text-[#C7A97B] animate-spin shrink-0" />
              )}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-[#1C1917]/50 hover:text-[#1C1917] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-[#1C1917]/60 hover:text-[#1C1917] border border-[#E8E2D9] hover:border-[#1C1917] transition-colors rounded-sm ml-2"
              >
                {t('ESC', 'বন্ধ')}
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            {query.trim() === '' ? (
              /* Initial State: Curated quick tags */
              <div className="space-y-6 py-2">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#C7A97B] block mb-3">
                    {t('CURATED HOUSES & BRANDS', 'নির্বাচিত ব্র্যান্ড')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['ANUA', 'COSRX', 'BEAUTY OF JOSEON', 'THE ORDINARY', 'SKIN1004', 'ROUND LAB'].map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setQuery(brand)}
                        className="px-3.5 py-1.5 border border-[#E8E2D9] hover:border-[#C7A97B] bg-white text-[10px] uppercase tracking-[0.18em] text-[#1C1917]/80 hover:text-[#C7A97B] transition-colors rounded-sm font-serif"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#C7A97B] block mb-3">
                    {t('CLINICAL CONCERNS & FORMULATIONS', 'স্কিনকেয়ার সমাধান')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'BARRIER REPAIR',
                      'HYDRATION TONERS',
                      'CENTELLA ASIATICA',
                      'NIACINAMIDE 10%',
                      'PREGNANCY SAFE',
                      'SUN FLUID SPF50+',
                    ].map((concern) => (
                      <button
                        key={concern}
                        type="button"
                        onClick={() => setQuery(concern)}
                        className="px-3.5 py-1.5 border border-[#E8E2D9] hover:border-[#1C1917] bg-white text-[10px] uppercase tracking-[0.16em] text-[#1C1917]/70 hover:text-[#1C1917] transition-colors rounded-sm"
                      >
                        {concern}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasResults ? (
              /* Results List */
              <div className="space-y-6">
                
                {/* Categories Row */}
                {categories.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#C7A97B] block mb-2.5">
                      {t('MATCHING CATEGORIES', 'ক্যাটাগরি')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/catalog?category=${cat.slug}`}
                          onClick={onClose}
                          className="px-3 py-1 bg-white border border-[#E8E2D9] hover:border-[#C7A97B] text-[11px] uppercase tracking-[0.15em] text-[#1C1917] hover:text-[#C7A97B] transition-colors rounded-sm flex items-center space-x-1.5"
                        >
                          <span>{lang === 'bn' ? cat.nameBn : cat.nameEn}</span>
                          <ArrowRight className="w-3 h-3 text-[#C7A97B]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Grid / List */}
                {products.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#C7A97B] block mb-3">
                      {t('CURATED FORMULATIONS', 'নির্বাচিত ফর্মুলেশন')} ({products.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map((p) => {
                        const title = lang === 'bn' && p.titleBn ? p.titleBn : p.titleEn;
                        return (
                          <Link
                            key={p.id}
                            href={`/catalog/${p.slug}`}
                            onClick={onClose}
                            className="group p-3 bg-white border border-[#E8E2D9] hover:border-[#C7A97B] rounded-sm flex items-center space-x-3.5 transition-all duration-200 hover:shadow-md"
                          >
                            {/* Thumbnail */}
                            <div className="w-14 h-14 bg-[#F4EFEA] rounded-sm shrink-0 overflow-hidden relative border border-[#E8E2D9]/60 flex items-center justify-center">
                              {p.imageUrl ? (
                                <Image
                                  src={p.imageUrl}
                                  alt={title}
                                  fill
                                  sizes="56px"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <Sparkles className="w-4 h-4 text-[#C7A97B]" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#C7A97B]">
                                  {p.brand || 'SEYVEN'}
                                </span>
                                {p.volume && (
                                  <span className="text-[9px] text-[#1C1917]/40 tracking-wider">
                                    • {p.volume}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-serif text-[#1C1917] group-hover:text-[#C7A97B] transition-colors truncate">
                                {title}
                              </h4>
                              {p.priceBdt ? (
                                <span className="text-xs font-medium text-[#1C1917] tracking-wider mt-0.5 block">
                                  ৳{p.priceBdt.toLocaleString()}
                                </span>
                              ) : null}
                            </div>

                            <ArrowRight className="w-4 h-4 text-[#C7A97B] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggestions Pills */}
                {suggestions.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#C7A97B] block mb-2">
                      {t('RELATED SEARCH TERMS', 'সম্পর্কিত অনুসন্ধান')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((term, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="px-2.5 py-1 text-[10px] tracking-wider uppercase text-[#1C1917]/70 hover:text-[#1C1917] hover:bg-[#F4EFEA] rounded-sm transition-colors border border-transparent hover:border-[#E8E2D9]"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* View all in catalog */}
                <div className="pt-3 border-t border-[#E8E2D9] flex justify-end">
                  <Link
                    href={`/catalog?q=${encodeURIComponent(query.trim())}`}
                    onClick={onClose}
                    className="inline-flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#C7A97B] hover:text-[#1C1917] transition-colors"
                  >
                    <span>{t('VIEW ALL RESULTS IN THE EDIT', 'ক্যাটালগে সবগুলো ফলাফল দেখুন')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ) : !isLoading && (
              /* Luxury Zero Results State */
              <div className="py-12 text-center space-y-4">
                <p className="font-serif text-sm text-[#1C1917]/80 uppercase tracking-[0.12em]">
                  {t(
                    `No formulations in our curated archives matched "${query}".`,
                    `আমাদের আর্কাইভে "${query}" সম্পর্কিত কোনো ফর্মুলেশন পাওয়া যায়নি।`
                  )}
                </p>
                <p className="text-xs text-[#1C1917]/50 tracking-wider max-w-md mx-auto">
                  {t(
                    'Our curations feature strictly authentic international formulations. If you need bespoke sourcing or routine guidance, connect directly with our Private Concierge.',
                    'আমাদের সংগ্রহে কেবল ১০০% আসল আন্তর্জাতিক ফর্মুলেশন সংরক্ষিত। যেকোনো বিশেষ ফর্মুলেশনের জন্য আমাদের কনসিয়ার্জের সাথে যোগাযোগ করুন।'
                  )}
                </p>
                <div className="pt-2 flex justify-center space-x-4">
                  <Link
                    href="/catalog"
                    onClick={onClose}
                    className="px-4 py-2 border border-[#1C1917] text-[10px] uppercase tracking-[0.2em] text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors rounded-sm"
                  >
                    {t('EXPLORE THE EDIT', 'ক্যাটালগ দেখুন')}
                  </Link>
                  <a
                    href={concierge.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#1C1917] text-white text-[10px] uppercase tracking-[0.2em] hover:bg-[#C7A97B] transition-colors rounded-sm inline-flex items-center space-x-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#C7A97B]" />
                    <span>{t(concierge.shortLabel + ' CONCIERGE', concierge.labelBn)}</span>
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
