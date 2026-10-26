'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Layers,
  Search,
  CheckCircle2,
  FolderPlus,
  Tag,
  DollarSign,
  Barcode,
  Eye,
  Sliders,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  X,
  Star,
  Link as LinkIcon,
  Edit,
  Shield,
  Heart,
  FileText,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { formatBdt } from '@/lib/formatters';
import { AdminProduct } from '@/types/admin';

export default function AdminCatalogDeskPage() {
  const {
    categories,
    addCategory,
    deleteCategory,
    products,
    addProduct,
    addBulkProducts,
    updateProduct,
    updateProductState,
    updateProductPrice,
    deleteProduct,
    refreshCatalog,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Pricing Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editCompareAtInput, setEditCompareAtInput] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const priceNum = Number(editPriceInput);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('সঠিক দাম (BDT) লিখুন');
      return;
    }
    setIsSavingPrice(true);
    const compareNum = editCompareAtInput ? Number(editCompareAtInput) : undefined;
    await updateProductPrice(editingProduct.slug || editingProduct.id, priceNum, compareNum);
    setIsSavingPrice(false);
    setToastMessage(`✅ "${editingProduct.titleEn}" এর দাম ৳${priceNum.toLocaleString()} ডাটাবেজে সেভ হয়েছে!`);
    setEditingProduct(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameBn, setCatNameBn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('Sparkles');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'ESSENTIALS' | 'VARIANTS' | 'CLINICAL'>('ESSENTIALS');
  const [editingFullProduct, setEditingFullProduct] = useState<AdminProduct | null>(null);

  const [prodTitleEn, setProdTitleEn] = useState('');
  const [prodTitleBn, setProdTitleBn] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [prodPurposeTag, setProdPurposeTag] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.nameEn || 'Targeted Serums & Ampoules');
  const [prodPrice, setProdPrice] = useState('2450');
  const [prodVolume, setProdVolume] = useState('50 ML');
  const [prodBsti, setProdBsti] = useState(true);

  // Multi-size Variants State (e.g. 30 ML, 50 ML, 100 ML)
  const [prodVariants, setProdVariants] = useState<Array<{ id?: string; volume: string; priceBdt: number; sku?: string }>>([
    { volume: '50 ML', priceBdt: 2450 },
  ]);

  // Clinical & PDP Dynamic Content State
  const [prodRoutineStep, setProdRoutineStep] = useState('Treat & Serum');
  const [prodRoutinePeriod, setProdRoutinePeriod] = useState('AM & PM');
  const [prodOriginCountry, setProdOriginCountry] = useState('Republic of Korea');
  const [prodIsPregnancySafe, setProdIsPregnancySafe] = useState(true);
  const [prodDermalStoryEn, setProdDermalStoryEn] = useState('');
  const [prodDermalStoryBn, setProdDermalStoryBn] = useState('');
  const [prodKeyActives, setProdKeyActives] = useState('');
  const [prodUsageStep1Title, setProdUsageStep1Title] = useState('');
  const [prodUsageStep1Desc, setProdUsageStep1Desc] = useState('');
  const [prodUsageStep2Title, setProdUsageStep2Title] = useState('');
  const [prodUsageStep2Desc, setProdUsageStep2Desc] = useState('');
  const [prodUsageStep3Title, setProdUsageStep3Title] = useState('');
  const [prodUsageStep3Desc, setProdUsageStep3Desc] = useState('');
  const [prodFullInci, setProdFullInci] = useState('');
  const [prodStorageGuidance, setProdStorageGuidance] = useState('');

  const existingBrands: string[] = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) brandSet.add(p.brand.trim());
    });
    ['Dot & Key', 'Beauty of Joseon', 'COSRX', 'The Ordinary', 'CeraVe', "Paula's Choice", 'La Roche-Posay'].forEach((b) => brandSet.add(b));
    return Array.from(brandSet);
  }, [products]);

  // Product Images State (Cloudinary CDN Pipeline)
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodImageUrlInput, setProdImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const compressImageFile = (file: File, maxDim = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

    for (const file of Array.from(files)) {
      try {
        const compressedBase64 = await compressImageFile(file, 1200, 0.82);
        if (!compressedBase64) continue;

        const res = await fetch(`${apiUrl}/catalog/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: compressedBase64,
            folder: 'seyven/products',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setProdImages((prev) => [...prev, data.url]);
            setToastMessage('☁️ ছবি Cloudinary CDN-এ WebP হিসেবে সফলভাবে আপলোড হয়েছে!');
            setTimeout(() => setToastMessage(null), 3500);
            continue;
          }
        }
        
        // If upload endpoint fails or offline, use compressed image
        setProdImages((prev) => [...prev, compressedBase64]);
      } catch {
        // Fallback
      }
    }
    setIsUploadingImage(false);
  };

  const addImageUrl = () => {
    const trimmed = prodImageUrlInput.trim();
    if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'))) {
      setProdImages((prev) => [...prev, trimmed]);
      setProdImageUrlInput('');
    }
  };

  const removeImage = (index: number) => {
    setProdImages((prev) => prev.filter((_, i) => i !== index));
  };

  const makePrimaryImage = (index: number) => {
    setProdImages((prev) => {
      if (index === 0) return prev;
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameEn.trim()) return;

    const finalSlug =
      catSlug.trim() ||
      catNameEn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    addCategory({
      nameEn: catNameEn.trim(),
      nameBn: catNameBn.trim() || catNameEn.trim(),
      slug: finalSlug,
      iconName: catIcon,
      sortOrder: categories.length + 1,
      isActive: true,
    });

    setIsCategoryModalOpen(false);
    setActiveTab('CATEGORIES');
    showToast(`✓ Category "${catNameEn.trim()}" created successfully and synced live!`);
    setCatNameEn('');
    setCatNameBn('');
    setCatSlug('');
  };

  const generateSlug = (brand: string, title: string): string => {
    const cleanBrand = (brand || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanTitle = (title || 'formulation').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (cleanBrand) {
      return `${cleanBrand}-${cleanTitle}`;
    }
    return cleanTitle;
  };

  const getSuggestedPurpose = (category: string): string => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('sun') || cat.includes('fluid')) return 'SUN DEFENCE // BROAD SPECTRUM';
    if (cat.includes('serum') || cat.includes('ampoule')) return 'TARGETED SERUM // ACTIVE CARE';
    if (cat.includes('toner') || cat.includes('essence')) return 'HYDRATION PREP // BALANCING';
    if (cat.includes('cream') || cat.includes('moistur')) return 'BARRIER REPAIR // DEEP HYDRATION';
    if (cat.includes('cleanse')) return 'PURIFYING // pH 5.5 BALANCED';
    return 'CLINICAL CARE // NOURISH';
  };

  const getPurposePresets = (category: string): string[] => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('sun') || cat.includes('fluid')) {
      return [
        'SUN DEFENCE // BROAD SPECTRUM',
        'DAILY UV SHIELD // SPF50+',
        'SUN DEFENCE // TINTED GLOW',
        'MINERAL FILTER // MATTE SHIELD',
      ];
    }
    if (cat.includes('serum') || cat.includes('ampoule')) {
      return [
        'TARGETED SERUM // ACTIVE CARE',
        'BLEMISH DEFENCE // SEBUM CONTROL',
        'VITAMIN C // RADIANCE BOOST',
        'PEPTIDE MATRIX // FIRMING',
      ];
    }
    if (cat.includes('toner') || cat.includes('essence')) {
      return [
        'HYDRATION PREP // BALANCING',
        'CALMING ESSENCE // SOOTHING',
        'PORE CLARIFYING // BHA EXFOLIATION',
      ];
    }
    if (cat.includes('cream') || cat.includes('moistur')) {
      return [
        'BARRIER REPAIR // DEEP HYDRATION',
        'CERAMIDE COMPLEX // NOURISH',
        'NIGHT RECOVERY // RESTORATIVE',
      ];
    }
    if (cat.includes('cleanse')) {
      return [
        'PURIFYING // pH 5.5 BALANCED',
        'GENTLE FOAM // NON-STRIPPING',
        'OIL CLEANSER // LIPID DISSOLVE',
      ];
    }
    return [
      'DAILY CARE // NOURISH',
      'CLINICAL CARE // ACTIVE DERMAL',
      'RESTORE & PROTECT',
    ];
  };

  const applyClinicalPresets = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('sun') || cat.includes('fluid')) {
      setProdRoutineStep('Sun Protection');
      setProdRoutinePeriod('AM');
      setProdDermalStoryEn('Ultra-lightweight high-protection formulation calibrated for humid subtropical climates. Fast absorbing with zero greasy residue and zero white cast.');
      setProdDermalStoryBn('উষ্ণ ও আর্দ্র আবহাওয়ায় ত্বককে রোদ ও পরিবেশগত দূষণ থেকে রক্ষা করতে নিখুঁত ওয়াটার-লাইট ফর্মুলেশন।');
      setProdKeyActives('Broad-Spectrum UV Matrix, Niacinamide, Hyaluronic Acid');
      setProdUsageStep1Title('The Two-Finger Rule');
      setProdUsageStep1Desc('Dispense a generous two-finger length onto index and middle fingers.');
      setProdUsageStep2Title('Apply 15 Mins Prior');
      setProdUsageStep2Desc('Smooth evenly across face, neck, and ears as the final morning step.');
      setProdUsageStep3Title('Reapply Every 2-3 Hours');
      setProdUsageStep3Desc('Reapply during prolonged outdoor sun exposure or active perspiration.');
      setProdStorageGuidance('Store in a cool dry place below 25°C away from direct sunlight.');
      setProdFullInci('Aqua, Ethylhexyl Methoxycinnamate, Zinc Oxide, Niacinamide, Titanium Dioxide, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Hyaluronic Acid, Tocopherol Acetate');
    } else if (cat.includes('cream') || cat.includes('moistur')) {
      setProdRoutineStep('Barrier Moisturizer');
      setProdRoutinePeriod('AM & PM');
      setProdDermalStoryEn('Deep lipid nourishment designed to restore compromised epidermal barriers in humid tropical weather.');
      setProdDermalStoryBn('ত্বকের ক্ষতিগ্রস্ত লিপিড ব্যারিয়ার মেরামত করে এবং ত্বকে দীর্ঘস্থায়ী আর্দ্রতা ধরে রাখে।');
      setProdKeyActives('Ceramide Complex, Hyaluronic Acid, Centella Asiatica');
      setProdUsageStep1Title('Cleanse & Prep');
      setProdUsageStep1Desc('Apply a dime-sized dollop onto cleansed and toned skin.');
      setProdUsageStep2Title('Smooth & Lock');
      setProdUsageStep2Desc('Gently press into face and neck until fully absorbed.');
      setProdUsageStep3Title('');
      setProdUsageStep3Desc('');
      setProdStorageGuidance('Store below 25°C away from heat.');
      setProdFullInci('Aqua, Glycerin, Ceramide NP, Ceramide AP, Sodium Hyaluronate, Centella Asiatica Extract, Dimethicone');
    } else if (cat.includes('serum') || cat.includes('ampoule')) {
      setProdRoutineStep('Treat & Serum');
      setProdRoutinePeriod('AM & PM');
      setProdDermalStoryEn('High-concentration clinical active matrix targeted for dermal revitalization and pigment balance.');
      setProdDermalStoryBn('ত্বকের উজ্জ্বলতা বৃদ্ধি ও দাগ দূর করতে উচ্চ ঘনত্বের অ্যাক্টিভ সিরাম।');
      setProdKeyActives('Niacinamide, Hyaluronic Acid, Zinc PCA');
      setProdUsageStep1Title('Dispense 2-3 Drops');
      setProdUsageStep1Desc('Dispense 2-3 drops onto clean fingertips.');
      setProdUsageStep2Title('Press & Absorb');
      setProdUsageStep2Desc('Gently pat into face and neck until absorbed.');
      setProdUsageStep3Title('');
      setProdUsageStep3Desc('');
      setProdStorageGuidance('Store in a cool, dark place.');
      setProdFullInci('Aqua, Niacinamide, Zinc PCA, Dimethyl Isosorbide, Tamarindus Indica Seed Gum, Xanthan Gum, Phenoxyethanol');
    } else if (cat.includes('cleanse')) {
      setProdRoutineStep('Purifying Cleanse');
      setProdRoutinePeriod('AM & PM');
      setProdDermalStoryEn('Sulfate-free pH 5.5 balanced gentle cleanser that removes impurities without stripping moisture.');
      setProdDermalStoryBn('ত্বকের প্রাকৃতিক আর্দ্রতা অক্ষুণ্ণ রেখে গভীর থেকে ময়লা পরিষ্কার করে।');
      setProdKeyActives('Amino Acid Surfactants, Panthenol, Glycerin');
      setProdUsageStep1Title('Lather with Water');
      setProdUsageStep1Desc('Work a small amount into a rich lather with lukewarm water.');
      setProdUsageStep2Title('Massage & Rinse');
      setProdUsageStep2Desc('Gently massage in circular motions for 60 seconds, then rinse clean.');
      setProdUsageStep3Title('');
      setProdUsageStep3Desc('');
      setProdStorageGuidance('Store at room temperature.');
      setProdFullInci('Aqua, Sodium Cocoyl Isethionate, Glycerin, Panthenol, Allantoin, Citric Acid');
    }
  };

  const openAddProductModal = () => {
    setEditingFullProduct(null);
    setProdTitleEn('');
    setProdTitleBn('');
    setProdBrand('');
    setProdSlug('');
    setIsSlugTouched(false);
    setProdPurposeTag('');
    setProdPrice('2450');
    setProdVolume('50 ML');
    setProdVariants([{ volume: '50 ML', priceBdt: 2450 }]);
    setProdBsti(true);
    setProdImages([]);
    setProdImageUrlInput('');
    applyClinicalPresets(prodCategory);
    setModalTab('ESSENTIALS');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: AdminProduct) => {
    setEditingFullProduct(product);
    setProdTitleEn(product.titleEn || '');
    setProdTitleBn(product.titleBn || '');
    setProdBrand(product.brand || '');
    const catLabel = typeof product.category === 'object' && product.category
      ? (product.category as any).nameEn || (product.category as any).slug
      : String(product.category || 'Targeted Serums & Ampoules');
    setProdCategory(catLabel);
    setProdSlug(product.slug || '');
    setIsSlugTouched(true);
    setProdPurposeTag(product.purposeTagEn || '');
    setProdPrice(String(product.priceBdt || 2450));
    setProdVolume(product.volume || '50 ML');
    setProdBsti(product.bstiApproved ?? true);
    setProdImages(product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []));

    // Multi-variants
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setProdVariants(product.variants.map((v) => ({
        volume: v.volume,
        priceBdt: Number(v.priceBdt) || 2450,
        sku: v.sku,
      })));
    } else {
      setProdVariants([{ volume: product.volume || '50 ML', priceBdt: product.priceBdt || 2450 }]);
    }

    // Clinical details
    setProdRoutineStep(product.routineStep || 'Treat & Serum');
    setProdRoutinePeriod(product.routinePeriod || 'AM & PM');
    setProdOriginCountry(product.originCountry || 'Republic of Korea');
    setProdIsPregnancySafe(product.isPregnancySafe ?? true);
    setProdDermalStoryEn(product.dermalStoryEn || '');
    setProdDermalStoryBn(product.dermalStoryBn || '');

    if (Array.isArray(product.keyActives) && product.keyActives.length > 0) {
      setProdKeyActives(product.keyActives.map((a: any) => a.name).join(', '));
    } else if (typeof product.keyActives === 'string') {
      setProdKeyActives(product.keyActives);
    } else {
      setProdKeyActives('');
    }

    if (Array.isArray(product.usageSteps) && product.usageSteps.length > 0) {
      setProdUsageStep1Title(product.usageSteps[0]?.titleEn || '');
      setProdUsageStep1Desc(product.usageSteps[0]?.instructionEn || '');
      setProdUsageStep2Title(product.usageSteps[1]?.titleEn || '');
      setProdUsageStep2Desc(product.usageSteps[1]?.instructionEn || '');
      setProdUsageStep3Title(product.usageSteps[2]?.titleEn || '');
      setProdUsageStep3Desc(product.usageSteps[2]?.instructionEn || '');
    } else {
      setProdUsageStep1Title('');
      setProdUsageStep1Desc('');
      setProdUsageStep2Title('');
      setProdUsageStep2Desc('');
      setProdUsageStep3Title('');
      setProdUsageStep3Desc('');
    }

    if (Array.isArray(product.fullInci)) {
      setProdFullInci(product.fullInci.map((i: any) => i.inciName || i).join(', '));
    } else if (typeof product.fullInci === 'string') {
      setProdFullInci(product.fullInci);
    } else {
      setProdFullInci('');
    }

    setProdStorageGuidance(product.storageGuidanceEn || '');
    setModalTab('ESSENTIALS');
    setIsProductModalOpen(true);
  };

  const addVariantRow = (volume = '100 ML', defaultPrice = 3500) => {
    setProdVariants((prev) => [...prev, { volume, priceBdt: defaultPrice }]);
  };

  const removeVariantRow = (idx: number) => {
    setProdVariants((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateVariantRow = (idx: number, field: 'volume' | 'priceBdt', value: any) => {
    setProdVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: field === 'priceBdt' ? Number(value) || 0 : value } : v))
    );
  };

  const handleCreateOrUpdateProduct = async (e?: React.FormEvent, keepOpen: boolean = false) => {
    if (e) e.preventDefault();
    if (!prodTitleEn.trim()) return;

    const coverPhoto = prodImages[0] || '';
    const finalBrand = prodBrand.trim() || 'Curated Formulation';
    const finalSlug = (prodSlug.trim() || generateSlug(finalBrand, prodTitleEn)).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const finalPurpose = prodPurposeTag.trim() || getSuggestedPurpose(prodCategory);

    // Compute prices from variants
    const prices = prodVariants.map((v) => Number(v.priceBdt) || 2450);
    const minVariantPrice = Math.min(...prices);
    const maxVariantPrice = Math.max(...prices);
    const priceRangeBdt = minVariantPrice === maxVariantPrice ? `৳${minVariantPrice.toLocaleString()}` : `৳${minVariantPrice.toLocaleString()} - ৳${maxVariantPrice.toLocaleString()}`;

    // Structure usage steps
    const usageSteps: Array<{ step: number; titleEn: string; titleBn: string; instructionEn: string; instructionBn: string }> = [];
    if (prodUsageStep1Title.trim()) {
      usageSteps.push({
        step: 1,
        titleEn: prodUsageStep1Title.trim(),
        titleBn: prodUsageStep1Title.trim(),
        instructionEn: prodUsageStep1Desc.trim(),
        instructionBn: prodUsageStep1Desc.trim(),
      });
    }
    if (prodUsageStep2Title.trim()) {
      usageSteps.push({
        step: 2,
        titleEn: prodUsageStep2Title.trim(),
        titleBn: prodUsageStep2Title.trim(),
        instructionEn: prodUsageStep2Desc.trim(),
        instructionBn: prodUsageStep2Desc.trim(),
      });
    }
    if (prodUsageStep3Title.trim()) {
      usageSteps.push({
        step: 3,
        titleEn: prodUsageStep3Title.trim(),
        titleBn: prodUsageStep3Title.trim(),
        instructionEn: prodUsageStep3Desc.trim(),
        instructionBn: prodUsageStep3Desc.trim(),
      });
    }

    // Structure key actives
    const keyActives = prodKeyActives.split(',').filter((a) => a.trim()).map((a) => ({
      name: a.trim(),
      category: 'ACTIVE',
      purposeEn: 'Targeted dermal support & barrier restoration',
      purposeBn: 'ত্বকের কার্যকর সুস্থতা ও সুরক্ষা',
      ewgScore: 1,
    }));

    const productPayload = {
      slug: finalSlug,
      titleEn: prodTitleEn.trim(),
      titleBn: prodTitleBn.trim() || prodTitleEn.trim(),
      brand: finalBrand,
      category: prodCategory,
      purposeTagEn: finalPurpose,
      purposeTagBn: finalPurpose,
      state: 'PUBLISHED' as const,
      variantsCount: prodVariants.length,
      priceBdt: minVariantPrice,
      priceRangeBdt,
      volume: prodVariants[0]?.volume || prodVolume,
      imageUrl: coverPhoto,
      images: prodImages.length > 0 ? prodImages : [coverPhoto],
      bstiApproved: prodBsti,
      variants: prodVariants.map((v, idx) => ({
        id: v.id || `var-${finalSlug}-${idx}`,
        volume: v.volume,
        priceBdt: Number(v.priceBdt) || minVariantPrice,
        sku: v.sku || `SYV-${finalSlug.toUpperCase().slice(0, 8)}-${v.volume.replace(/\s+/g, '')}`,
        inStock: true,
        stockCount: 50,
      })),
      routineStep: prodRoutineStep,
      routinePeriod: prodRoutinePeriod,
      originCountry: prodOriginCountry,
      isPregnancySafe: prodIsPregnancySafe,
      dermalStoryEn: prodDermalStoryEn,
      dermalStoryBn: prodDermalStoryBn || prodDermalStoryEn,
      keyActives,
      usageSteps,
      fullInci: prodFullInci,
      storageGuidanceEn: prodStorageGuidance,
      storageGuidanceBn: prodStorageGuidance,
    };

    if (editingFullProduct) {
      await updateProduct(editingFullProduct.slug || editingFullProduct.id, productPayload);
      setIsProductModalOpen(false);
      setEditingFullProduct(null);
      showToast(`✓ Updated "${prodTitleEn.trim()}" with dynamic sizes & clinical data!`);
    } else {
      addProduct(productPayload);
      if (keepOpen) {
        showToast(`✓ Published "${prodTitleEn.trim()}"! Ready for next ${finalBrand} formulation.`);
        setProdTitleEn('');
        setProdTitleBn('');
        setProdSlug('');
        setIsSlugTouched(false);
        setProdPurposeTag('');
        setProdImages([]);
        setProdImageUrlInput('');
        setModalTab('ESSENTIALS');
      } else {
        setIsProductModalOpen(false);
        setActiveTab('PRODUCTS');
        showToast(`✓ Product "${prodTitleEn.trim()}" published to storefront with images!`);
        setProdTitleEn('');
        setProdTitleBn('');
        setProdBrand('');
        setProdSlug('');
        setIsSlugTouched(false);
        setProdPurposeTag('');
        setProdImages([]);
        setProdImageUrlInput('');
        setModalTab('ESSENTIALS');
      }
    }
  };

  const getCategoryLabel = (cat: any): string => {
    if (!cat) return 'Curated Care';
    if (typeof cat === 'string') return cat;
    return cat.nameEn || cat.nameBn || cat.slug || 'Curated Care';
  };

  // High-Performance 1000+ Products Pagination & Filter Suite
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [pageJumpInput, setPageJumpInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const catLabel = getCategoryLabel(p.category);
      const matchesCat =
        selectedCategoryFilter === 'ALL' ||
        catLabel.toLowerCase() === selectedCategoryFilter.toLowerCase();
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.titleEn.toLowerCase().includes(q) ||
        (p.titleBn && p.titleBn.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q) ||
        catLabel.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  // Reset to page 1 whenever search query, category filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const [isDeletingProductId, setIsDeletingProductId] = useState<string | null>(null);
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);

  const handleDeleteProduct = async (p: AdminProduct) => {
    const targetId = p.id || p.slug || '';
    if (!targetId) return;
    if (!confirm(`Are you sure you want to permanently delete formulation "${p.titleEn}" from the PostgreSQL database?`)) {
      return;
    }
    setIsDeletingProductId(targetId);
    const success = await deleteProduct(targetId);
    setIsDeletingProductId(null);
    if (success) {
      setToastMessage(`✅ Formulation "${p.titleEn}" deleted permanently from database.`);
    } else {
      setToastMessage(`❌ Could not delete "${p.titleEn}". Check backend logs.`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefreshCatalog = async () => {
    setIsRefreshingCatalog(true);
    await refreshCatalog();
    setIsRefreshingCatalog(false);
    setToastMessage(`🔄 Catalog synchronized with live PostgreSQL database!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const renderPaginationBar = () => {
    if (filteredProducts.length === 0) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (safeCurrentPage > 3) pages.push('...');
        const start = Math.max(2, safeCurrentPage - 1);
        const end = Math.min(totalPages - 1, safeCurrentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (safeCurrentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
      }
      return pages;
    };

    return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 bg-white border border-[#E6DFD5] rounded-lg text-xs font-mono select-none shadow-2xs">
        <div className="flex items-center gap-3 text-[#1C1917]/70 flex-wrap">
          <span>
            Showing <strong className="text-[#1C1917]">{startIndex + 1}–{endIndex}</strong> of{' '}
            <strong className="text-[#1C1917]">{filteredProducts.length.toLocaleString()}</strong> formulations
          </span>
          <span className="hidden sm:inline text-[#C7A97B]">&bull;</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#1C1917]/60">Per Page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs text-[#1C1917] font-semibold focus:outline-none focus:border-[#C7A97B]"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={250}>250 / page</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 px-2 bg-white border border-[#E6DFD5] hover:bg-[#F9F6F0] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors text-[#1C1917]"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5 text-[#C7A97B]" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="p-1.5 px-2.5 bg-white border border-[#E6DFD5] hover:bg-[#F9F6F0] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors text-[#1C1917] flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#C7A97B]" />
            <span className="hidden sm:inline text-[11px]">Prev</span>
          </button>

          {getPageNumbers().map((num, idx) => {
            if (num === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-[#1C1917]/40">
                  ...
                </span>
              );
            }
            const isCurrent = num === safeCurrentPage;
            return (
              <button
                key={`page-${num}`}
                type="button"
                onClick={() => setCurrentPage(num as number)}
                className={`min-w-[32px] h-7 px-2 rounded text-[11px] font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#1C1917] text-[#C7A97B] border border-[#C7A97B]/50 shadow-xs'
                    : 'bg-white border border-[#E6DFD5] text-[#1C1917]/80 hover:bg-[#F9F6F0]'
                }`}
              >
                {num}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 px-2.5 bg-white border border-[#E6DFD5] hover:bg-[#F9F6F0] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors text-[#1C1917] flex items-center gap-1"
          >
            <span className="hidden sm:inline text-[11px]">Next</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#C7A97B]" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 px-2 bg-white border border-[#E6DFD5] hover:bg-[#F9F6F0] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors text-[#1C1917]"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5 text-[#C7A97B]" />
          </button>

          {/* Quick Page Jumper */}
          <div className="flex items-center gap-1 ml-1.5 pl-2 border-l border-[#E6DFD5]">
            <span className="text-[10px] text-[#1C1917]/50">Go:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder={String(safeCurrentPage)}
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = Number(pageJumpInput);
                  if (target >= 1 && target <= totalPages) {
                    setCurrentPage(target);
                    setPageJumpInput('');
                  }
                }
              }}
              className="w-12 px-1.5 py-1 text-center bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#C7A97B]"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast Notification */}
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
            <Sparkles className="w-4 h-4 text-[#C7A97B]" />
            <span>Catalog & SKU Governance Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            Formulations & Category Master
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Scalable 1000+ catalog engine with virtualization, instant search, and live price database sync.
          </p>
        </div>

        {/* Action Triggers (Min 44px touch targets) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshCatalog}
            disabled={isRefreshingCatalog}
            className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Fetch latest formulations and categories directly from PostgreSQL database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C7A97B] ${isRefreshingCatalog ? 'animate-spin' : ''}`} />
            <span>{isRefreshingCatalog ? 'Syncing...' : 'Sync DB'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FolderPlus className="w-4 h-4 text-[#C7A97B]" />
            <span>New Category</span>
          </button>
          <button
            type="button"
            onClick={openAddProductModal}
            className="min-h-[44px] px-4 py-2 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4 text-[#C7A97B]" />
            <span>Add Product & SKU</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-4 border-b border-[#E6DFD5] text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTS')}
          className={`pb-3 font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'PRODUCTS' ? 'text-[#1C1917]' : 'text-[#1C1917]/50 hover:text-[#1C1917]'
          }`}
        >
          <span>Products & SKU Variants ({products.length.toLocaleString()})</span>
          {activeTab === 'PRODUCTS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C7A97B]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          className={`pb-3 font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'CATEGORIES' ? 'text-[#1C1917]' : 'text-[#1C1917]/50 hover:text-[#1C1917]'
          }`}
        >
          <span>Hierarchical Categories ({categories.length})</span>
          {activeTab === 'CATEGORIES' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C7A97B]" />
          )}
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
          <input
            type="text"
            placeholder="Filter catalog by title, brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DFD5] text-xs font-mono text-[#1C1917] rounded focus:border-[#C7A97B] focus:outline-none"
          />
        </div>

        {/* Category Pills / Filter Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full text-xs font-mono">
          <span className="text-[10px] uppercase text-[#1C1917]/50 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-[#C7A97B]" />
            <span>Category:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-[#1C1917] text-[#C7A97B] font-bold shadow-2xs'
                : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:text-[#1C1917]'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(c.nameEn)}
              className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all ${
                selectedCategoryFilter === c.nameEn
                  ? 'bg-[#1C1917] text-[#C7A97B] font-bold shadow-2xs'
                  : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:text-[#1C1917]'
              }`}
            >
              {c.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS LIST (PAGINATED & VIRTUALIZED)                             */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          {/* Top Pagination Status Bar */}
          {renderPaginationBar()}

          {/* Mobile Card Stack (<640px) */}
          <div className="block lg:hidden space-y-3">
            {paginatedProducts.map((p) => (
              <div key={p.id} className="p-4 bg-white border border-[#E6DFD5] rounded-lg space-y-3 text-xs shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded border border-[#E6DFD5] bg-[#F9F6F0] overflow-hidden shrink-0 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.titleEn} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[#C7A97B]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-[#C7A97B] font-bold">{p.brand}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          p.state === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {p.state}
                      </span>
                    </div>
                    <div className="font-medium text-[#1C1917] text-sm truncate">{p.titleEn}</div>
                    <div className="text-[11px] text-[#1C1917]/60 font-bangla truncate">{p.titleBn}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E6DFD5] font-mono">
                  <span>{getCategoryLabel(p.category)}</span>
                  <span className="font-bold text-[#1C1917]">{p.priceRangeBdt}</span>
                </div>

                <div className="pt-1 flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => openEditProductModal(p)}
                    className="flex-1 py-1.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-[10px] font-mono uppercase rounded transition-colors font-bold flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Edit className="w-3 h-3 text-[#C7A97B]" />
                    <span>Edit Specs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(p);
                      setEditPriceInput(String(p.priceBdt || 2450));
                      setEditCompareAtInput('');
                    }}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono uppercase rounded transition-colors font-bold flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-amber-700" />
                    <span>Price</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const targetId = p.id || p.slug || '';
                      if (!targetId) return;
                      const nextState = p.state === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
                      const ok = await updateProductState(targetId, nextState);
                      if (ok) {
                        setToastMessage(`✅ "${p.titleEn}" is now ${nextState === 'PUBLISHED' ? 'LIVE on Storefront' : 'saved as DRAFT'}!`);
                      }
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="py-1.5 px-2 bg-[#F9F6F0] hover:bg-[#1C1917] hover:text-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-[10px] font-mono uppercase rounded transition-colors font-semibold"
                  >
                    {p.state === 'PUBLISHED' ? 'Set Draft' : 'Set Live'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p)}
                    disabled={isDeletingProductId === (p.id || p.slug)}
                    className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-mono uppercase rounded transition-colors disabled:opacity-50"
                    title="Delete formulation permanently from database"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Pagination for Mobile */}
          <div className="block lg:hidden">
            {renderPaginationBar()}
          </div>

          {/* Desktop Table View (>=1024px) */}
          <div className="hidden lg:block overflow-x-auto border border-[#E6DFD5] rounded-lg bg-white shadow-xs">
            <table className="w-full text-left text-xs text-[#1C1917]">
              <thead className="bg-[#F9F6F0] text-[#1C1917]/70 uppercase font-mono text-[10px] tracking-wider border-b border-[#E6DFD5]">
                <tr>
                  <th className="p-3.5">Product Title & Brand</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">SKU Variants</th>
                  <th className="p-3.5">Price Range</th>
                  <th className="p-3.5">BSTI Status</th>
                  <th className="p-3.5">State</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5]">
                {paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9F6F0]/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded border border-[#E6DFD5] bg-[#F9F6F0] overflow-hidden shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.titleEn} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-[#C7A97B]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[#1C1917]">{p.titleEn}</div>
                          <div className="text-[10px] text-[#C7A97B] font-mono uppercase tracking-wider flex items-center gap-2">
                            <span>{p.brand}</span>
                            {p.volume && <span className="text-[#1C1917]/40">• {p.volume}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[#1C1917]/70">{getCategoryLabel(p.category)}</td>
                    <td className="p-3.5 font-mono">{p.variantsCount} active</td>
                    <td className="p-3.5 font-mono font-semibold">{p.priceRangeBdt}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        BSTI Approved
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          p.state === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {p.state}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(p)}
                          className="px-2.5 py-1 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-[10px] font-mono uppercase rounded transition-colors font-bold flex items-center gap-1 shadow-2xs"
                          title="Edit formulation details, multi-size variants & clinical specs"
                        >
                          <Edit className="w-3 h-3 text-[#C7A97B]" />
                          <span>Edit Specs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setEditPriceInput(String(p.priceBdt || 2450));
                            setEditCompareAtInput('');
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono uppercase rounded transition-colors font-bold flex items-center gap-1 shadow-2xs"
                          title="Change selling price directly in Supabase Database"
                        >
                          <Tag className="w-3 h-3 text-amber-700" />
                          <span>Price</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const targetId = p.id || p.slug || '';
                            if (!targetId) return;
                            const nextState = p.state === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
                            const ok = await updateProductState(targetId, nextState);
                            if (ok) {
                              setToastMessage(`✅ "${p.titleEn}" is now ${nextState === 'PUBLISHED' ? 'LIVE on Storefront' : 'saved as DRAFT'}!`);
                            }
                            setTimeout(() => setToastMessage(null), 3500);
                          }}
                          className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-[#1C1917] hover:text-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-[10px] font-mono uppercase rounded transition-colors font-semibold"
                        >
                          {p.state === 'PUBLISHED' ? 'Set Draft' : 'Set Live'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          disabled={isDeletingProductId === (p.id || p.slug)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-mono uppercase rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                          title="Delete formulation permanently from database"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination for Desktop */}
          <div className="hidden lg:block">
            {renderPaginationBar()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATEGORIES LIST                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg border border-[#E6DFD5]">
            <div className="text-xs font-mono text-[#1C1917]/70">
              Total Hierarchies: <strong className="text-[#1C1917]">{categories.length}</strong> categories published
            </div>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 bg-[#1C1917] text-[#F9F6F0] rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#2A2623] transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>+ Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2.5 shadow-xs hover:border-[#C7A97B]/60 transition-colors relative group">
                <div className="flex items-start justify-between pb-2 border-b border-[#E6DFD5] gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#1C1917]">
                    {c.nameEn}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 bg-[#C7A97B]/20 text-[#8C6D3B] text-[10px] font-mono font-bold rounded">
                      #{c.sortOrder}
                    </span>
                    <button
                      type="button"
                      title="Delete category permanently from database"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete category "${c.nameEn}" from the PostgreSQL database?`)) {
                          const ok = await deleteCategory(c.id);
                          if (ok) {
                            setToastMessage(`✅ Category "${c.nameEn}" deleted permanently from database.`);
                          } else {
                            setToastMessage(`❌ Could not delete category "${c.nameEn}".`);
                          }
                          setTimeout(() => setToastMessage(null), 3500);
                        }
                      }}
                      className="p-1 text-[#1C1917]/40 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs font-bangla text-[#1C1917]/70 font-medium">{c.nameBn}</div>
                <div className="text-[10px] font-mono text-[#1C1917]/50">Slug: /{c.slug}</div>
                <div className="pt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active on Storefront
                  </span>
                  <span className="text-[#1C1917]/40">
                    {c.productCount || 0} products
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E6DFD5] max-w-md w-full p-6 rounded-lg space-y-4 shadow-2xl">
            <h2 className="font-serif text-lg font-medium text-[#1C1917]">Add New Hierarchical Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-[#1C1917]/70 uppercase">Category Title (English)</label>
                <input
                  type="text"
                  required
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="e.g. Eye Creams & Peptides"
                  className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#1C1917]/70 uppercase">Category Title (বাংলা)</label>
                <input
                  type="text"
                  value={catNameBn}
                  onChange={(e) => setCatNameBn(e.target.value)}
                  placeholder="e.g. আই ক্রিম ও পেপটাইড"
                  className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none font-bangla"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#1C1917]/70 uppercase">URL Slug (Auto Generated if blank)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. eye-creams-peptides"
                  className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E6DFD5] rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1C1917] text-[#F9F6F0] rounded font-semibold uppercase tracking-wider text-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Product SKU */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E6DFD5] max-w-3xl w-full p-5 sm:p-6 rounded-xl space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E6DFD5]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1917] text-[#C7A97B] font-bold uppercase tracking-wider">
                    {editingFullProduct ? 'EDITING FORMULATION' : 'NEW FORMULATION'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-medium">
                    ✓ 100% Dynamic PDP
                  </span>
                </div>
                <h2 className="font-serif text-lg font-medium text-[#1C1917]">
                  {editingFullProduct ? `Edit: ${editingFullProduct.titleEn}` : 'Create Formulation Product & SKU'}
                </h2>
                <p className="text-[11px] text-[#1C1917]/60 font-mono">
                  Configure multi-size variants, pricing, and clinical specifications that render live on customer PDP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingFullProduct(null);
                }}
                className="p-1.5 text-[#1C1917]/40 hover:text-[#1C1917] rounded-full hover:bg-[#F9F6F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E6DFD5] pb-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setModalTab('ESSENTIALS')}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'ESSENTIALS'
                    ? 'bg-[#1C1917] text-[#C7A97B] font-bold shadow-xs'
                    : 'bg-[#F9F6F0] text-[#1C1917]/70 hover:bg-[#E6DFD5]'
                }`}
              >
                <span>1. 📌 Essentials & Media</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('VARIANTS')}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'VARIANTS'
                    ? 'bg-[#1C1917] text-[#C7A97B] font-bold shadow-xs'
                    : 'bg-[#F9F6F0] text-[#1C1917]/70 hover:bg-[#E6DFD5]'
                }`}
              >
                <span>2. 📦 Sizes & Pricing ({prodVariants.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('CLINICAL')}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'CLINICAL'
                    ? 'bg-[#1C1917] text-[#C7A97B] font-bold shadow-xs'
                    : 'bg-[#F9F6F0] text-[#1C1917]/70 hover:bg-[#E6DFD5]'
                }`}
              >
                <span>3. 🧬 Clinical, Safety & INCI</span>
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateProduct} className="space-y-4 text-xs font-mono">
              {/* ================================================================= */}
              {/* TAB 1: ESSENTIALS & MEDIA                                         */}
              {/* ================================================================= */}
              {modalTab === 'ESSENTIALS' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Media Gallery */}
                  <div className="p-4 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#1C1917] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#C7A97B]" />
                        <span>Product Imagery & Media Gallery</span>
                      </span>
                      <span className="text-[10px] text-[#C7A97B] font-medium">
                        {prodImages.length} image{prodImages.length !== 1 ? 's' : ''} added
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="p-3 border-2 border-dashed border-[#C7A97B]/50 hover:border-[#C7A97B] bg-white rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group text-center relative overflow-hidden">
                        <UploadCloud className="w-5 h-5 text-[#C7A97B] group-hover:scale-110 transition-transform mb-1" />
                        {isUploadingImage ? (
                          <span className="text-[11px] font-semibold text-[#C7A97B] animate-pulse">
                            ☁️ Uploading & Converting to Cloudinary WebP...
                          </span>
                        ) : (
                          <>
                            <span className="text-[11px] font-semibold text-[#1C1917]">Upload Images from Computer</span>
                            <span className="text-[9px] text-emerald-700 font-mono mt-0.5 font-medium">Auto-WebP Cloudinary CDN (Free 25GB)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isUploadingImage}
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="p-3 bg-white border border-[#E6DFD5] rounded-lg flex flex-col justify-between space-y-2">
                        <span className="text-[10px] text-[#1C1917]/70 uppercase font-semibold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-[#C7A97B]" />
                          <span>Or Paste Web Image URL</span>
                        </span>
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            value={prodImageUrlInput}
                            onChange={(e) => setProdImageUrlInput(e.target.value)}
                            placeholder="https://... image.jpg"
                            className="flex-1 p-1.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-[11px] focus:border-[#C7A97B] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={addImageUrl}
                            className="px-2.5 py-1.5 bg-[#1C1917] text-[#F9F6F0] rounded text-[10px] uppercase font-bold shrink-0 hover:bg-[#2A2623]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>


                    {/* Uploaded Gallery */}
                    {prodImages.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#E6DFD5]">
                        <span className="text-[10px] text-[#1C1917]/70 uppercase font-semibold block">
                          Active Image Gallery (First image is Cover):
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {prodImages.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className={`relative group rounded border bg-white overflow-hidden aspect-square ${
                                idx === 0 ? 'border-[#C7A97B] ring-2 ring-[#C7A97B]/40' : 'border-[#E6DFD5]'
                              }`}
                            >
                              <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#1C1917] text-[#C7A97B] text-[8px] font-bold rounded uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                  <Star className="w-2.5 h-2.5 fill-[#C7A97B]" />
                                  Cover
                                </span>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {idx !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() => makePrimaryImage(idx)}
                                    className="px-1.5 py-1 bg-white text-[#1C1917] text-[8px] font-bold uppercase rounded hover:bg-[#C7A97B] hover:text-white"
                                  >
                                    Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="p-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title EN & BN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Product Title (English) *</label>
                      <input
                        type="text"
                        required
                        value={prodTitleEn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdTitleEn(val);
                          if (!isSlugTouched) {
                            setProdSlug(generateSlug(prodBrand, val));
                          }
                        }}
                        placeholder="e.g. Strawberry Dew Tinted Sunscreen SPF 50+"
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Product Title (বাংলা)</label>
                      <input
                        type="text"
                        value={prodTitleBn}
                        onChange={(e) => setProdTitleBn(e.target.value)}
                        placeholder="e.g. স্ট্রবেরি ডিউ টিন্টেড সানস্ক্রিন"
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none font-bangla"
                      />
                    </div>
                  </div>

                  {/* Brand & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Brand *</label>
                        <span className="text-[9px] text-[#C7A97B] font-mono">Any brand</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={prodBrand}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdBrand(val);
                          if (!isSlugTouched) {
                            setProdSlug(generateSlug(val, prodTitleEn));
                          }
                        }}
                        placeholder="e.g. Dot & Key, COSRX"
                        list="brand-options-list"
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none text-xs"
                      />
                      <datalist id="brand-options-list">
                        {existingBrands.map((b: string) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {['Dot & Key', 'Beauty of Joseon', 'COSRX', 'The Ordinary'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setProdBrand(b);
                              if (!isSlugTouched) {
                                setProdSlug(generateSlug(b, prodTitleEn));
                              }
                            }}
                            className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                              prodBrand === b
                                ? 'bg-[#1C1917] text-[#C7A97B] font-bold border-[#1C1917]'
                                : 'bg-white border-[#E6DFD5] text-[#1C1917]/70 hover:border-[#C7A97B]'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Category</label>
                        <span className="text-[9px] text-[#1C1917]/40 font-mono">({categories.length} total)</span>
                      </div>
                      <select
                        value={prodCategory}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setProdCategory(newCat);
                          applyClinicalPresets(newCat);
                        }}
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.nameEn}>
                            {c.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Purpose Tag */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-amber-950 uppercase font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#C7A97B]" />
                        <span>Clinical Purpose Tag (Card Subtitle)</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={prodPurposeTag}
                      onChange={(e) => setProdPurposeTag(e.target.value)}
                      placeholder={getSuggestedPurpose(prodCategory)}
                      className="w-full p-2 bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none text-xs font-mono font-medium text-[#1C1917]"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[8px] text-[#1C1917]/60 uppercase tracking-wider font-mono">Quick Pick:</span>
                      {getPurposePresets(prodCategory).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setProdPurposeTag(preset)}
                          className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            prodPurposeTag === preset
                              ? 'bg-[#1C1917] text-[#C7A97B] border-[#1C1917] font-bold shadow-xs'
                              : 'bg-white border-[#E6DFD5] text-[#1C1917]/80 hover:border-[#C7A97B] hover:text-[#1C1917]'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SEO URL Slug */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-[#1C1917]/80 uppercase font-semibold flex items-center gap-1.5">
                        <span className="text-[#C7A97B]">🔗</span>
                        <span>SEO URL Slug (Google Search Index)</span>
                      </label>
                      <span className="text-[9px] text-emerald-700 font-mono font-medium">✓ Google Crawlable</span>
                    </div>
                    <div className="flex items-center rounded border border-[#E6DFD5] bg-white overflow-hidden focus-within:border-[#C7A97B]">
                      <span className="px-2.5 py-2 text-[10px] text-[#1C1917]/60 font-mono bg-[#F9F6F0] border-r border-[#E6DFD5] select-none shrink-0 font-medium">
                        /catalog/
                      </span>
                      <input
                        type="text"
                        value={prodSlug}
                        onChange={(e) => {
                          setIsSlugTouched(true);
                          setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        }}
                        placeholder={generateSlug(prodBrand, prodTitleEn)}
                        className="flex-1 p-2 bg-transparent text-xs font-mono text-[#1C1917] focus:outline-none"
                      />
                      {isSlugTouched && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSlugTouched(false);
                            setProdSlug(generateSlug(prodBrand, prodTitleEn));
                          }}
                          className="px-2.5 text-[9px] text-[#C7A97B] hover:text-[#8C6D3B] font-mono uppercase tracking-wider underline cursor-pointer shrink-0"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BSTI */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">BSTI Regulatory Status</label>
                    <select
                      value={prodBsti ? 'YES' : 'NO'}
                      onChange={(e) => setProdBsti(e.target.value === 'YES')}
                      className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none text-xs"
                    >
                      <option value="YES">BSTI Approved (বাংলাদেশ স্ট্যান্ডার্ডস অ্যান্ড টেস্টিং ইনস্টিটিউশন)</option>
                      <option value="NO">Under Review / Direct International Lot</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 2: MULTI-SIZE VARIANTS & PRICING                              */}
              {/* ================================================================= */}
              {modalTab === 'VARIANTS' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#1C1917] uppercase font-bold tracking-wider flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#C7A97B]" />
                          <span>Multi-Size Volume & Pricing Matrix</span>
                        </span>
                        <p className="text-[10px] text-[#1C1917]/60 font-mono mt-0.5">
                          Add multiple volume editions (e.g. 30 ML, 50 ML, 100 ML) with separate BDT selling prices.
                        </p>
                      </div>

                      {/* Quick Add Size Buttons */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] text-[#1C1917]/60 font-mono uppercase">Quick Add:</span>
                        {['30 ML', '50 ML', '60 ML', '100 ML', '150 ML', '200 ML'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => addVariantRow(size, 2500)}
                            className="px-2 py-0.5 bg-white border border-[#E6DFD5] hover:border-[#C7A97B] text-[#1C1917] text-[9px] font-mono rounded transition-colors cursor-pointer"
                          >
                            + {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variant Rows Table */}
                    <div className="space-y-2 pt-2">
                      {prodVariants.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-[#E6DFD5] rounded-lg flex flex-col sm:flex-row items-center gap-3 shadow-2xs"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F9F6F0] text-[10px] flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>

                          <div className="flex-1 w-full sm:w-auto grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-[#1C1917]/60 uppercase block">Size / Volume *</label>
                              <input
                                type="text"
                                required
                                value={v.volume}
                                onChange={(e) => updateVariantRow(idx, 'volume', e.target.value)}
                                placeholder="e.g. 50 ML"
                                className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono text-[#1C1917] focus:border-[#C7A97B] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-[#1C1917]/60 uppercase block">Selling Price (BDT ৳) *</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#C7A97B]">৳</span>
                                <input
                                  type="number"
                                  required
                                  value={v.priceBdt}
                                  onChange={(e) => updateVariantRow(idx, 'priceBdt', e.target.value)}
                                  placeholder="2450"
                                  className="w-full pl-6 p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono font-bold text-[#1C1917] focus:border-[#C7A97B] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {prodVariants.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Remove this size variant"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[9px] text-[#1C1917]/40 font-mono px-2 py-1">Primary Edition</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addVariantRow('100 ML', 3500)}
                      className="w-full py-2 border-2 border-dashed border-[#C7A97B]/50 hover:border-[#C7A97B] text-[#8C6D3B] hover:text-[#1C1917] text-xs font-mono font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
                    >
                      <Plus className="w-4 h-4 text-[#C7A97B]" />
                      <span>+ Add Another Size Variant (অন্য আরেকটি সাইজ যোগ করুন)</span>
                    </button>

                    {/* Calculated Price Range Display */}
                    <div className="p-3 bg-white border border-[#C7A97B]/40 rounded-lg flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/60 block font-mono">
                          Auto-Calculated Storefront Price Range:
                        </span>
                        <span className="text-sm font-sans font-bold text-[#1C1917]">
                          ৳{Math.min(...prodVariants.map((v) => Number(v.priceBdt) || 2450)).toLocaleString()}
                          {Math.min(...prodVariants.map((v) => Number(v.priceBdt) || 2450)) !== Math.max(...prodVariants.map((v) => Number(v.priceBdt) || 2450)) && (
                            <span> — ৳{Math.max(...prodVariants.map((v) => Number(v.priceBdt) || 2450)).toLocaleString()}</span>
                          )}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold rounded border border-emerald-200">
                        {prodVariants.length} Active Edition{prodVariants.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 3: CLINICAL, SAFETY & INCI SPECS                              */}
              {/* ================================================================= */}
              {modalTab === 'CLINICAL' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Preset Auto-Fill Quick Action Banner */}
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-[#F9F6F0] border border-[#C7A97B]/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8C6D3B] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
                        <span>Smart Clinical Auto-Presets</span>
                      </span>
                      <p className="text-[10px] text-[#1C1917]/70 font-mono">
                        Auto-populate clinical stories, usage steps & INCI based on &quot;{prodCategory}&quot;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        applyClinicalPresets(prodCategory);
                        showToast(`✓ Clinical presets loaded for ${prodCategory}!`);
                      }}
                      className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-[10px] font-mono uppercase tracking-wider rounded font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#C7A97B]" />
                      <span>✨ Auto-Fill Presets</span>
                    </button>
                  </div>

                  {/* Routine Step, Timing & Origin */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Routine Step *</label>
                      <input
                        type="text"
                        value={prodRoutineStep}
                        onChange={(e) => setProdRoutineStep(e.target.value)}
                        placeholder="e.g. Sun Protection, Treat & Serum"
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Ideal Time to Apply *</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['AM', 'PM', 'AM & PM'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setProdRoutinePeriod(p)}
                            className={`py-2 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                              prodRoutinePeriod === p
                                ? 'bg-[#1C1917] text-[#C7A97B] font-bold border-[#1C1917]'
                                : 'bg-white border-[#E6DFD5] text-[#1C1917]/70 hover:border-[#C7A97B]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Country of Origin *</label>
                      <input
                        type="text"
                        list="origin-countries-list"
                        value={prodOriginCountry}
                        onChange={(e) => setProdOriginCountry(e.target.value)}
                        placeholder="e.g. Republic of Korea, France, Japan"
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono text-[#1C1917] focus:border-[#C7A97B] focus:outline-none"
                      />
                      <datalist id="origin-countries-list">
                        <option value="Republic of Korea">Republic of Korea (দক্ষিণ কোরিয়া)</option>
                        <option value="France">France (ফ্রান্স)</option>
                        <option value="Japan">Japan (জাপান)</option>
                        <option value="United States">United States (যুক্তরাষ্ট্র)</option>
                        <option value="United Kingdom">United Kingdom (যুক্তরাজ্য)</option>
                        <option value="India">India (ভারত)</option>
                        <option value="Canada">Canada</option>
                        <option value="Germany">Germany</option>
                        <option value="Australia">Australia</option>
                        <option value="International Authenticity">International Authenticity</option>
                      </datalist>
                    </div>
                  </div>

                  {/* Pregnancy Safe Toggle */}
                  <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#1C1917] uppercase font-bold block">
                        Pregnancy & Nursing Safety
                      </span>
                      <span className="text-[9px] text-[#1C1917]/60">
                        Displays safety certification badge on customer PDP.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setProdIsPregnancySafe(true)}
                        className={`px-3 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                          prodIsPregnancySafe
                            ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                            : 'bg-white border-[#E6DFD5] text-[#1C1917]/70'
                        }`}
                      >
                        ✓ Safe to Use
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdIsPregnancySafe(false)}
                        className={`px-3 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                          !prodIsPregnancySafe
                            ? 'bg-amber-700 text-white font-bold border-amber-700'
                            : 'bg-white border-[#E6DFD5] text-[#1C1917]/70'
                        }`}
                      >
                        Consult OB-GYN
                      </button>
                    </div>
                  </div>

                  {/* "Why Your Skin Will Love This" (Dermal Story / Climate Note) */}
                  <div className="space-y-2 p-3 bg-white border border-[#E6DFD5] rounded-lg">
                    <label className="text-[10px] text-[#1C1917] uppercase font-bold flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Why Your Skin Will Love This (Climate & Dermal Story)</span>
                    </label>

                    <div className="space-y-1">
                      <span className="text-[9px] text-[#1C1917]/60 uppercase">English Climate Note:</span>
                      <textarea
                        rows={2}
                        value={prodDermalStoryEn}
                        onChange={(e) => setProdDermalStoryEn(e.target.value)}
                        placeholder="e.g. Ultra-lightweight high-protection formulation calibrated for humid subtropical climates..."
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-[#1C1917]/60 uppercase">বাংলা রূপচর্চা পরামর্শ:</span>
                      <textarea
                        rows={2}
                        value={prodDermalStoryBn}
                        onChange={(e) => setProdDermalStoryBn(e.target.value)}
                        placeholder="e.g. উষ্ণ ও আর্দ্র আবহাওয়ায় ত্বককে রোদ ও পরিবেশগত দূষণ থেকে রক্ষা করতে নিখুঁত ওয়াটার-লাইট ফর্মুলেশন..."
                        className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono font-bangla"
                      />
                    </div>
                  </div>

                  {/* Key Active Hero Ingredients */}
                  <div className="space-y-1.5 p-3 bg-white border border-[#E6DFD5] rounded-lg">
                    <label className="text-[10px] text-[#1C1917] uppercase font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Active Hero Ingredients (Comma Separated)</span>
                    </label>
                    <input
                      type="text"
                      value={prodKeyActives}
                      onChange={(e) => setProdKeyActives(e.target.value)}
                      placeholder="e.g. Centella Asiatica, Niacinamide, Hyaluronic Acid, Strawberry Extract"
                      className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono text-[#1C1917]"
                    />
                    <span className="text-[9px] text-[#1C1917]/60 font-mono block">
                      Each comma-separated active is automatically converted into an elegant active card on the PDP!
                    </span>
                  </div>

                  {/* How to Apply (3 Steps) */}
                  <div className="space-y-2 p-3 bg-white border border-[#E6DFD5] rounded-lg">
                    <label className="text-[10px] text-[#1C1917] uppercase font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>How to Apply & Daily Routine (ব্যবহারের নিয়ম)</span>
                    </label>

                    {/* Step 1 */}
                    <div className="p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-1.5">
                      <span className="text-[9px] font-bold text-[#1C1917] uppercase">Step 1:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={prodUsageStep1Title}
                          onChange={(e) => setProdUsageStep1Title(e.target.value)}
                          placeholder="Title (e.g. Two-Finger Rule)"
                          className="p-1.5 bg-white border border-[#E6DFD5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={prodUsageStep1Desc}
                          onChange={(e) => setProdUsageStep1Desc(e.target.value)}
                          placeholder="Instruction (e.g. Dispense two finger lengths 15 mins prior)"
                          className="sm:col-span-2 p-1.5 bg-white border border-[#E6DFD5] rounded text-xs"
                        />
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-1.5">
                      <span className="text-[9px] font-bold text-[#1C1917] uppercase">Step 2:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={prodUsageStep2Title}
                          onChange={(e) => setProdUsageStep2Title(e.target.value)}
                          placeholder="Title (e.g. Press & Absorb)"
                          className="p-1.5 bg-white border border-[#E6DFD5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={prodUsageStep2Desc}
                          onChange={(e) => setProdUsageStep2Desc(e.target.value)}
                          placeholder="Instruction (e.g. Gently press into face and neck)"
                          className="sm:col-span-2 p-1.5 bg-white border border-[#E6DFD5] rounded text-xs"
                        />
                      </div>
                    </div>

                    {/* Step 3 (Optional) */}
                    <div className="p-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-1.5">
                      <span className="text-[9px] font-bold text-[#1C1917] uppercase">Step 3 (Optional):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={prodUsageStep3Title}
                          onChange={(e) => setProdUsageStep3Title(e.target.value)}
                          placeholder="Title (e.g. Reapply Regular)"
                          className="p-1.5 bg-white border border-[#E6DFD5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={prodUsageStep3Desc}
                          onChange={(e) => setProdUsageStep3Desc(e.target.value)}
                          placeholder="Instruction (e.g. Reapply every 2-3 hours)"
                          className="sm:col-span-2 p-1.5 bg-white border border-[#E6DFD5] rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full INCI Ingredients */}
                  <div className="space-y-1.5 p-3 bg-white border border-[#E6DFD5] rounded-lg">
                    <label className="text-[10px] text-[#1C1917] uppercase font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Full Ingredients List (INCI)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={prodFullInci}
                      onChange={(e) => setProdFullInci(e.target.value)}
                      placeholder="e.g. Aqua, Glycerin, Niacinamide, Zinc Oxide, Ethylhexyl Methoxycinnamate..."
                      className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono"
                    />
                  </div>

                  {/* Storage Guidance */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#1C1917]/70 uppercase font-semibold">Storage Guidance Note</label>
                    <input
                      type="text"
                      value={prodStorageGuidance}
                      onChange={(e) => setProdStorageGuidance(e.target.value)}
                      placeholder="e.g. Store in a cool dry place below 25°C away from direct sunlight."
                      className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6DFD5]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#1C1917]/60 font-mono">
                    Tab: <strong>{modalTab}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      setEditingFullProduct(null);
                    }}
                    className="px-3.5 py-2 border border-[#E6DFD5] rounded text-xs hover:bg-[#F9F6F0] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {!editingFullProduct && (
                    <button
                      type="button"
                      onClick={() => handleCreateOrUpdateProduct(undefined, true)}
                      className="px-3.5 py-2 bg-[#F9F6F0] hover:bg-[#E6DFD5] text-[#1C1917] border border-[#C7A97B] rounded text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Saves this product and keeps brand/category open for next entry"
                    >
                      <span>+ Save & Add Another ({prodBrand || 'Brand'})</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1C1917] text-[#F9F6F0] rounded font-semibold uppercase tracking-wider text-xs hover:bg-[#2A2623] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
                    <span>{editingFullProduct ? '💾 Save & Update Specs' : '✨ Publish Formulation'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PRICING MODAL (Direct Supabase PostgreSQL Database Sync)            */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#C7A97B] rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#F9F6F0] text-[#1C1917]/60 hover:text-[#1C1917]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#C7A97B] font-bold">
                <DollarSign className="w-4 h-4 text-[#C7A97B]" />
                <span>Live Database Price Update</span>
              </div>
              <h3 className="font-serif text-lg font-light text-[#1C1917]">
                Update Product Pricing
              </h3>
              <p className="text-xs text-[#1C1917]/70 font-mono truncate">
                {editingProduct.titleEn}
              </p>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#1C1917]/80 flex items-center justify-between">
                  <span>Selling Price (বিক্রয় মূল্য - ৳) *</span>
                  <span className="text-[10px] text-[#C7A97B]">Current: {editingProduct.priceRangeBdt}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono text-[#1C1917]">৳</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPriceInput}
                    onChange={(e) => setEditPriceInput(e.target.value)}
                    placeholder="e.g. 2450"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-sm font-mono font-bold text-[#1C1917] focus:border-[#C7A97B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-[#1C1917]/50">Presets:</span>
                {[1950, 2250, 2450, 2800, 3200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditPriceInput(String(preset))}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-[#F9F6F0] hover:bg-[#1C1917] hover:text-[#F9F6F0] border border-[#E6DFD5] transition-colors"
                  >
                    ৳{preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#1C1917]/80">
                  Compare-At / MRP Price (ঐচ্ছিক স্ট্রাইকথ্রু মূল্য - ৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono text-[#1C1917]/50">৳</span>
                  <input
                    type="number"
                    min={1}
                    value={editCompareAtInput}
                    onChange={(e) => setEditCompareAtInput(e.target.value)}
                    placeholder="e.g. 2800"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-sm font-mono text-[#1C1917] focus:border-[#C7A97B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-mono text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  এই বাটন চাপার সাথে সাথে মূল্যটি সরাসরি <strong>Supabase Cloud PostgreSQL Database</strong> এ সেভ হবে এবং স্টোরফ্রন্টে লাইভ দেখাবে।
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-[#E6DFD5] rounded text-xs hover:bg-[#F9F6F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrice}
                  className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono uppercase tracking-wider rounded font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingPrice ? (
                    <span>Saving to Database...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C7A97B]" />
                      <span>Save Price to Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
