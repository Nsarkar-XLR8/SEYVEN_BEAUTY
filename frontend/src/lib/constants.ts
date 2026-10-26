export const BRAND = {
  name: 'SEYVEN',
  taglineEn: 'THE SANCTUARY OF BEAUTY',
  taglineBn: 'সৌন্দর্যের অভয়ারণ্য',
  descriptionEn: 'Curated International Skincare for Bangladeshi Women',
  descriptionBn: 'বাংলাদেশি নারীদের ত্বকের যত্নে আন্তর্জাতিক স্কিনকেয়ার সমাধান',
  logoPath: '/images/seyven-monogram.png',
  supportPhone: '+880 9612 000000',
  supportWhatsApp: '+880 1700 000000',
  supportEmail: 'care@seyven.com.bd',
  officeHours: '9:00 AM – 9:00 PM BST (Saturday to Thursday)',
  registeredAddress: 'Level 14, Lotus Kamal Tower, Gulshan-1, Dhaka-1212, Bangladesh',
  corporate: {
    dbid: 'DBID-982104-2026',
    tradeLicense: 'TRAD/DSCC/019284/2026',
    vatBin: '003918204-0101',
    tin: '782910482910',
  },
  thresholds: {
    freeDeliveryBdt: 2000,
    standardDeliveryDhakaBdt: 70,
    standardDeliveryOutsideBdt: 130,
  },
};

export const GUEST_NAV_LINKS = [
  { href: '/catalog', labelEn: 'SHOP ALL', labelBn: 'সকল প্রোডাক্ট' },
  { href: '/customer/loyalty', labelEn: 'PRIVILEGE', labelBn: 'ক্লায়েন্ট প্রিভিলেজ' },
  { href: '/about', labelEn: 'ABOUT US', labelBn: 'আমাদের সম্পর্কে' },
];

export const AUTH_NAV_LINKS = [
  { href: '/catalog', labelEn: 'SHOP ALL', labelBn: 'সকল প্রোডাক্ট' },
  { href: '/customer/loyalty', labelEn: 'PRIVILEGE', labelBn: 'ক্লায়েন্ট প্রিভিলেজ' },
  { href: '/track-order', labelEn: 'TRACK PARCEL', labelBn: 'পার্সেল ট্র্যাকিং' },
  { href: '/about', labelEn: 'ABOUT US', labelBn: 'আমাদের সম্পর্কে' },
];

export const NAV_LINKS = GUEST_NAV_LINKS;

export const FOOTER_LINKS = {
  sanctuary: [
    { href: '/catalog?routine=morning', labelEn: 'Morning Shield Routine', labelBn: 'সকালের সুরক্ষার রুটিন' },
    { href: '/catalog?routine=evening', labelEn: 'Evening Recovery Regimen', labelBn: 'রাতের পরিচর্যার রুটিন' },
    { href: '/catalog?concern=barrier', labelEn: 'Barrier Comfort Collection', labelBn: 'ব্যারিয়ার সুরক্ষা' },
    { href: '/catalog?concern=pigmentation', labelEn: 'Luminous Glow Collection', labelBn: 'উজ্জ্বলতা বৃদ্ধি' },
  ],
  clientCare: [
    { href: '/track-order', labelEn: 'Track Your Parcel', labelBn: 'অর্ডার ট্র্যাক করুন' },
    { href: '/customer/loyalty', labelEn: 'Sanctuary VIP Privileges', labelBn: 'ভিআইপি লয়্যালটি প্রোগ্রাম' },
    { href: '/legal/return_refund', labelEn: 'Return & Exchange Policy', labelBn: 'রিটার্ন ও রিফান্ড নীতি' },
    { href: '/support/grievance', labelEn: 'Client Support Concierge', labelBn: 'গ্রাহক সহায়তা ও অভিযোগ' },
  ],
  legal: [
    { href: '/legal/terms', labelEn: 'Terms of Service', labelBn: 'ব্যবহারের শর্তাবলী' },
    { href: '/legal/privacy', labelEn: 'Privacy & Data Protection', labelBn: 'তথ্য সুরক্ষা নীতিমালা' },
    { href: '/legal/shipping_delivery', labelEn: 'Shipping & Delivery', labelBn: 'ডেলিভারি সংক্রান্ত নিয়ম' },
  ],
};
