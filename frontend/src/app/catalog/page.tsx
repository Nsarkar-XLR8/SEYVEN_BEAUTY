'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { getAllProducts, createDynamicProductDetail, ProductDetail } from '@/data/products';
import { ProductCard } from '@/components/storefront/product-card';

export default function CatalogPage() {
  const { lang, t } = useLanguage();
  const catalogTopRef = useRef<HTMLDivElement>(null);

  // Filter & Search & Sort State
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'BRAND_ASC' | 'TITLE_ASC'>('FEATURED');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Remote data state
  const [remoteCategories, setRemoteCategories] = useState<{ id: string; slug: string; nameEn: string; nameBn: string }[]>([]);
  const [remoteProducts, setRemoteProducts] = useState<ProductDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 0. Sync URL category parameter if present (?category=sunscreen)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category') || params.get('cat');
      if (catParam) {
        setSelectedFilter(catParam);
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

    // 1. Fetch Categories (resilient internal Next.js API route first, then backend fallback)
    fetch('/api/catalog/categories')
      .then((r) => (r.ok ? r.json() : fetch(`${apiUrl}/catalog/categories`).then((b) => (b.ok ? b.json() : null))))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRemoteCategories(data);
        }
      })
      .catch(() => {});

    // 2. Fetch Products (resilient Next.js route with persistent disk fallback + backend)
    fetch('/api/catalog/products')
      .then((r) => (r.ok ? r.json() : fetch(`${apiUrl}/catalog/products`).then((b) => (b.ok ? b.json() : null))))
      .then((data) => {
        if (Array.isArray(data)) {
          const publishedOnly = data.filter((d: any) => d && (!d.state || d.state === 'PUBLISHED'));
          const formatted = publishedOnly.map((d: any) => createDynamicProductDetail(d));
          setRemoteProducts(formatted);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 100% Dynamic Catalog: Driven strictly by user-added database items
  const allProducts = useMemo(() => {
    return remoteProducts;
  }, [remoteProducts]);

  // 100% Dynamic luxury category navigation options (Derived strictly from Admin & Database)
  const filterOptions = useMemo(() => {
    const base = [{ id: 'ALL', labelEn: 'ALL FORMULATIONS', labelBn: 'সকল প্রোডাক্ট' }];
    const seen = new Set<string>();

    // 1. Primary: Use categories fetched from Admin DB
    if (remoteCategories.length > 0) {
      remoteCategories.forEach((c) => {
        const id = c.slug || c.id;
        if (id && !seen.has(id.toLowerCase())) {
          seen.add(id.toLowerCase());
          base.push({
            id,
            labelEn: (c.nameEn || c.slug || '').toUpperCase(),
            labelBn: c.nameBn || c.nameEn,
          });
        }
      });
      return base;
    }

    // 2. Secondary (Instant self-healing): If category API is delayed, auto-extract from loaded products
    if (allProducts.length > 0) {
      allProducts.forEach((p) => {
        const rawCat = (p as any).category;
        const catName = typeof rawCat === 'object' && rawCat ? (rawCat.nameEn || rawCat.slug) : String(rawCat || '');
        const catSlug = typeof rawCat === 'object' && rawCat ? (rawCat.slug || rawCat.id) : catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (catName && catName !== 'Curated Formulation' && !seen.has(catSlug.toLowerCase())) {
          seen.add(catSlug.toLowerCase());
          base.push({
            id: catSlug,
            labelEn: catName.toUpperCase(),
            labelBn: catName,
          });
        }
      });
      return base;
    }

    // 3. Fallback during initial load: Return ONLY 'ALL FORMULATIONS' (Zero static fake categories)
    return base;
  }, [remoteCategories, allProducts]);

  // High-performance search & category filtering
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allProducts.filter((p) => {
      // 1. Dynamic Category Matching (Strictly matches admin-assigned category)
      if (selectedFilter !== 'ALL') {
        const filterKey = selectedFilter.toLowerCase();
        const rawCat = (p as any).category;
        const catName = (typeof rawCat === 'object' && rawCat
          ? rawCat.nameEn || rawCat.slug || ''
          : String(rawCat || '')).toLowerCase();
        const catSlug = (typeof rawCat === 'object' && rawCat
          ? rawCat.slug || rawCat.id || ''
          : catName.replace(/[^a-z0-9]+/g, '-')).toLowerCase();
        const catId = (typeof rawCat === 'object' && rawCat ? rawCat.id : '').toLowerCase();

        const matchesCategory =
          catSlug === filterKey ||
          catName === filterKey ||
          (catId && catId === filterKey) ||
          catName.includes(filterKey) ||
          filterKey.includes(catName);

        if (!matchesCategory) return false;
      }

      // 2. Search Query Matching (Search across title, brand, actives, volume, and purpose)
      if (q) {
        const matchTitleEn = (p.titleEn || '').toLowerCase().includes(q);
        const matchTitleBn = (p.titleBn || '').toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchSlug = (p.slug || '').toLowerCase().includes(q);
        const matchPurpose = (p.purposeTagEn || '').toLowerCase().includes(q);
        const matchActives = Array.isArray(p.keyActives) && p.keyActives.some((a) => (a.name || '').toLowerCase().includes(q));
        const matchVolume = (p.volume || '').toLowerCase().includes(q);

        if (!matchTitleEn && !matchTitleBn && !matchBrand && !matchSlug && !matchPurpose && !matchActives && !matchVolume) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, selectedFilter, searchQuery]);

  // Sorting
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'PRICE_ASC':
        return list.sort((a, b) => (a.priceBdt || 0) - (b.priceBdt || 0));
      case 'PRICE_DESC':
        return list.sort((a, b) => (b.priceBdt || 0) - (a.priceBdt || 0));
      case 'BRAND_ASC':
        return list.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
      case 'TITLE_ASC':
        return list.sort((a, b) => (a.titleEn || '').localeCompare(b.titleEn || ''));
      case 'FEATURED':
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  // Pagination calculation
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, safeCurrentPage, pageSize]);

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    setCurrentPage(1);
    scrollToCatalogTop();
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const target = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(target);
    scrollToCatalogTop();
  };

  const scrollToCatalogTop = () => {
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate numbered pages with smart ellipsis (e.g. 1 2 3 ... 8 9 10 ... 44)
  const paginationRange = useMemo(() => {
    const delta = 2; // Number of pages to show before/after current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (typeof i === 'number') {
        if (l !== undefined) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }
    }

    return rangeWithDots;
  }, [totalPages, safeCurrentPage]);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div ref={catalogTopRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pt-10 sm:pb-16 space-y-8 sm:space-y-12">
      {/* Editorial Header Banner */}
      <div className="text-center max-w-3xl mx-auto pt-2 pb-2 sm:pt-4 sm:pb-4">
        {/* Architectural Sharp Luxury Overline Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#FAF8F5] border border-[#C7A97B]/40 rounded-none text-[9px] sm:text-[10px] uppercase tracking-[0.28em] sm:tracking-[0.32em] font-medium text-[#8C6D3B] mb-4 sm:mb-6">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C7A97B] shrink-0" />
          <span>{t('CURATED ICONS • 100% AUTHENTIC GUARANTEE', 'আন্তর্জাতিক ব্র্যান্ড • ১০০% আসল স্কিনকেয়ার')}</span>
        </div>

        {/* Majestic Serif Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif uppercase tracking-[0.12em] sm:tracking-[0.16em] md:tracking-[0.18em] font-light text-[#1C1917] leading-[1.25] sm:leading-[1.2] mb-3.5 sm:mb-5">
          {t('THE CURATED COLLECTION', 'আন্তর্জাতিক স্কিনকেয়ার কালেকশন')}
        </h1>

        {/* Airy Editorial Subtitle with Proper Line Height and Kerning */}
        <p className="text-xs sm:text-[13px] md:text-sm text-[#1C1917]/75 font-light leading-relaxed sm:leading-[1.8] tracking-wide sm:tracking-wider max-w-xl sm:max-w-2xl mx-auto">
          {t(
            'Authentic Korean, French, and American dermatological icons curated specifically for the unique needs of Bangladeshi skin in humid tropical climates.',
            'বাংলাদেশের আবহাওয়া ও ত্বকের বৈশিষ্ট্যের সাথে মানানসই বিশ্বের সেরা ও প্রমাণিত আন্তর্জাতিক স্কিনকেয়ার প্রোডাক্ট।'
          )}
        </p>
      </div>

      {/* Runway Navigation Track */}
      <div className="space-y-4">
        <div className="border-b border-[#E6DFD5]/80">
          <div className="flex items-center sm:justify-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-x-6 sm:space-x-8 px-2 sm:px-0 scroll-smooth">
            {isLoading && filterOptions.length <= 1 ? (
              <div className="flex items-center sm:justify-center space-x-6 sm:space-x-8 py-3 animate-pulse">
                <div className="h-3.5 w-28 bg-[#E6DFD5]/60" />
                <div className="h-3.5 w-24 bg-[#E6DFD5]/40" />
                <div className="h-3.5 w-32 bg-[#E6DFD5]/40" />
              </div>
            ) : (
              filterOptions.map((filter) => {
                const isActive = selectedFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => handleFilterChange(filter.id)}
                    className={`shrink-0 py-3 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.25em] transition-all duration-300 relative ${
                      isActive ? 'text-[#1C1917] font-semibold' : 'text-[#1C1917]/45 hover:text-[#1C1917] font-normal'
                    }`}
                  >
                    <span>{lang === 'bn' ? filter.labelBn : filter.labelEn}</span>
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#1C1917] rounded-full transition-all" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Haute Luxury Search & Sort Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1C1917]/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t(
                `Search across ${totalItems > 0 ? totalItems.toLocaleString() : '1,000+'} formulations or brands...`,
                `${totalItems > 0 ? totalItems.toLocaleString() : '১,০০০+'} প্রোডাক্ট বা ব্র্যান্ডের নাম খুঁজুন...`
              )}
              className="w-full pl-9 pr-8 py-2 bg-[#F9F6F0]/60 border border-[#E6DFD5] text-[11px] text-[#1C1917] placeholder:text-[#1C1917]/35 tracking-wider focus:outline-none focus:border-[#C7A97B] focus:bg-white transition-all font-light"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1C1917]/40 hover:text-[#1C1917]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Per Page & Sort */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 text-[10px] tracking-wider text-[#1C1917]/70">
            {/* Items Per Page */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="uppercase text-[9px] text-[#1C1917]/50 hidden sm:inline">{t('Show', 'প্রতি পেজে')}:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                  scrollToCatalogTop();
                }}
                className="bg-[#F9F6F0]/80 border border-[#E6DFD5] text-[#1C1917] py-1.5 px-2 text-[10px] font-mono focus:outline-none focus:border-[#C7A97B]"
              >
                <option value={16}>16 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
                <option value={96}>96 / page</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <ArrowUpDown className="w-3 h-3 text-[#C7A97B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F9F6F0]/80 border border-[#E6DFD5] text-[#1C1917] py-1.5 px-2.5 text-[10px] uppercase tracking-wider focus:outline-none focus:border-[#C7A97B]"
              >
                <option value="FEATURED">{t('Curated Editorial', 'সেরা কালেকশন')}</option>
                <option value="PRICE_ASC">{t('Price: Low to High', 'দাম: কম থেকে বেশি')}</option>
                <option value="PRICE_DESC">{t('Price: High to Low', 'দাম: বেশি থেকে কম')}</option>
                <option value="BRAND_ASC">{t('Brand (A - Z)', 'ব্র্যান্ড (A - Z)')}</option>
                <option value="TITLE_ASC">{t('Name (A - Z)', 'নাম (A - Z)')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discreet Collection Meta Counter */}
        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-[#1C1917]/50 px-1 pt-1 border-t border-[#E6DFD5]/50">
          <span>{t('AUTHENTIC SELECTION', 'আসল সিলেকশন')}</span>
          <span className="font-mono">
            {totalItems > 0
              ? t(
                  `Showing ${startIndex + 1} - ${endIndex} of ${totalItems.toLocaleString()} Formulations`,
                  `মোট ${totalItems.toLocaleString()} টির মধ্যে ${startIndex + 1} - ${endIndex} টি দেখানো হচ্ছে`
                )
              : t('No matching formulations found', 'কোনো প্রোডাক্ট পাওয়া যায়নি')}
          </span>
        </div>
      </div>

      {/* Product Grid: 2 columns mobile, 3 tablet, 4 desktop */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#C7A97B] border-t-transparent animate-spin rounded-full mx-auto" />
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B]">
            {t('LOADING CLINICAL COLLECTION...', 'কালেকশন লোড হচ্ছে...')}
          </span>
        </div>
      ) : paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {paginatedProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              slug={p.slug}
              brand={p.brand}
              titleEn={p.titleEn}
              titleBn={p.titleBn}
              purposeEn={p.purposeTagEn}
              purposeBn={p.purposeTagBn}
              volume={p.volume}
              priceBdt={p.priceBdt}
              imageUrl={p.images?.[0]?.url || (p as any).imageUrl}
              routineTag={p.routineTag}
              variantId={p.variants?.[0]?.id || p.id}
            />
          ))}
        </div>
      ) : allProducts.length === 0 ? (
        <div className="py-24 text-center space-y-4 border border-[#E6DFD5] bg-[#FAF8F5]/80 p-10 max-w-xl mx-auto shadow-xs">
          <Sparkles className="w-5 h-5 text-[#C7A97B] mx-auto animate-pulse" />
          <h3 className="text-base font-serif uppercase tracking-[0.2em] text-[#1C1917] font-light">
            {t('COLLECTION READY FOR CURATION', 'কালেকশন প্রস্তুত')}
          </h3>
          {/* <p className="text-xs text-[#1C1917]/65 max-w-md mx-auto font-light leading-relaxed">
            {t(
              'Add formulations directly from the Admin Portal to curate your authenticated skincare sanctuary.',
              'আপনার স্কিনকেয়ার ব্র্যান্ডের প্রোডাক্টসমূহ অ্যাডমিন ড্যাশবোর্ড থেকে এক এক করে অ্যাড করুন।'
            )}
          </p> */}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 border border-dashed border-[#E6DFD5] bg-[#FAF8F5]/50 p-8">
          <Layers className="w-6 h-6 text-[#C7A97B]/70 mx-auto" />
          <h3 className="text-sm font-serif uppercase tracking-[0.2em] text-[#1C1917]">
            {t('No Formulations Match Your Filter', 'আপনার ফিল্টারের সাথে কোনো প্রোডাক্ট মেলেনি')}
          </h3>
          <p className="text-xs text-[#1C1917]/60 max-w-md mx-auto font-light">
            {t(
              'Try clearing your search query or selecting a different formulation category from the runway above.',
              'অনুসন্ধান শব্দ পরিবর্তন করুন অথবা উপরের ক্যাটাগরি থেকে অন্য কোনো বিভাগ বেছে নিন।'
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedFilter('ALL');
              setCurrentPage(1);
            }}
            className="inline-flex items-center px-5 py-2.5 bg-[#1C1917] text-[#FAF8F5] text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#C7A97B] transition-colors"
          >
            {t('RESET ALL FILTERS', 'সকল ফিল্টার রিসেট করুন')}
          </button>
        </div>
      )}

      {/* Haute Luxury Minimalist Editorial Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Catalog Pagination" className="pt-12 sm:pt-16 pb-8 border-t border-[#E6DFD5]/80 flex flex-col items-center space-y-5">
          {/* Main Runway Navigation Row (Single sleek horizontal baseline) */}
          <div className="w-full flex items-center justify-between sm:justify-center sm:space-x-8 text-xs uppercase tracking-[0.25em]">
            {/* Previous */}
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              className="group flex items-center space-x-2 py-2 px-3 text-[#1C1917]/70 hover:text-[#1C1917] disabled:opacity-20 disabled:pointer-events-none transition-all duration-300"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              <span className="text-[10px] sm:text-[11px] font-light">{t('PREV', 'পূর্ববর্তী')}</span>
            </button>

            {/* Clean Number Sequence without clunky boxes */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {paginationRange.map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-1.5 py-1 text-[#1C1917]/30 select-none font-serif text-sm">
                      &hellip;
                    </span>
                  );
                }

                const pageNum = Number(page);
                const isCurrent = pageNum === safeCurrentPage;

                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[32px] sm:min-w-[38px] h-8 sm:h-9 flex items-center justify-center text-[11px] sm:text-[12px] font-mono transition-all duration-300 relative ${
                      isCurrent
                        ? 'text-[#1C1917] font-semibold'
                        : 'text-[#1C1917]/40 hover:text-[#1C1917] font-light'
                    }`}
                  >
                    <span>{pageNum}</span>
                    {isCurrent && (
                      <span className="absolute bottom-1 inset-x-2 h-[1.5px] bg-[#1C1917] rounded-full transition-all" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              className="group flex items-center space-x-2 py-2 px-3 text-[#1C1917]/70 hover:text-[#1C1917] disabled:opacity-20 disabled:pointer-events-none transition-all duration-300"
            >
              <span className="text-[10px] sm:text-[11px] font-light">{t('NEXT', 'পরবর্তী')}</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Discreet Luxury Meta Counter & Quick Page Dropdown */}
          <div className="flex items-center space-x-3 text-[10px] font-mono text-[#1C1917]/50 tracking-[0.2em] uppercase">
            <span>{t('PAGE', 'পৃষ্ঠা')}</span>
            <div className="relative inline-flex items-center">
              <select
                value={safeCurrentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="appearance-none bg-transparent border-b border-[#C7A97B]/70 text-[#1C1917] font-bold px-2 py-0.5 pr-4 text-center cursor-pointer hover:border-[#1C1917] focus:outline-none transition-colors text-[11px]"
                title={t('Jump directly to page', 'নির্দিষ্ট পেজে যান')}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <span className="absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-[#C7A97B]">▾</span>
            </div>
            <span>{t('OF', 'এর')} {totalPages}</span>
            <span className="text-[#C7A97B]/70">&bull;</span>
            <span>{totalItems.toLocaleString()} {t('FORMULATIONS', 'ফর্মুলেশন')}</span>
          </div>
        </nav>
      )}
    </div>
  );
}
