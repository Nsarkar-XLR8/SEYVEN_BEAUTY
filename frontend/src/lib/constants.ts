export const BRAND = {
  name: 'SEYVEN',
  tagline: 'THE SANCTUARY OF BEAUTY',
  description: '100% Authentic Imported International Luxury Skincare & Beauty',
  taglineEn: 'THE SANCTUARY OF BEAUTY',
  taglineBn: 'THE SANCTUARY OF BEAUTY',
  descriptionEn: 'Curated 100% Authentic Imported International Skincare for Bangladesh',
  descriptionBn: 'Curated 100% Authentic Imported International Skincare for Bangladesh',
  logoPath: '/images/seyven-monogram.png',
  supportPhone: '',
  supportWhatsApp: '',
  supportMessenger: 'https://m.me/seyvenofficial',
  supportInstagram: 'https://www.instagram.com/seyven_beauty/',
  supportFacebook: 'https://www.facebook.com/seyvenofficial',
  supportEmail: 'officialseyven@gmail.com',
  officeHours: '9:00 AM – 9:00 PM BST (Saturday to Thursday)',
  registeredAddress: 'K.B. Saha Road, Amlapara, Chashara Commercial Area, Narayanganj - 1400, Bangladesh',
  corporate: {
    dbid: 'DBID-982104-2026',
    tradeLicense: 'TRAD/DSCC/019284/2026',
    vatBin: '003918204-0101',
    tin: '782910482910',
  },
  thresholds: {
    freeDeliveryBdt: 3000,
    standardDeliveryDhakaBdt: 70,
    standardDeliveryOutsideBdt: 130,
  },
};

export const GUEST_NAV_LINKS = [
  { href: '/catalog', labelEn: 'SHOP ALL', labelBn: 'SHOP ALL' },
  { href: '/customer/loyalty', labelEn: 'PRIVILEGE', labelBn: 'PRIVILEGE' },
  { href: '/about', labelEn: 'ABOUT US', labelBn: 'ABOUT US' },
];

export const AUTH_NAV_LINKS = [
  { href: '/catalog', labelEn: 'SHOP ALL', labelBn: 'SHOP ALL' },
  { href: '/customer/loyalty', labelEn: 'PRIVILEGE', labelBn: 'PRIVILEGE' },
  { href: '/track-order', labelEn: 'TRACK PARCEL', labelBn: 'TRACK PARCEL' },
  { href: '/about', labelEn: 'ABOUT US', labelBn: 'ABOUT US' },
];

export const NAV_LINKS = GUEST_NAV_LINKS;

export const FOOTER_LINKS = {
  sanctuary: [
    { href: '/catalog?routine=morning', labelEn: 'Morning Shield Routine', labelBn: 'Morning Shield Routine' },
    { href: '/catalog?routine=evening', labelEn: 'Evening Recovery Regimen', labelBn: 'Evening Recovery Regimen' },
    { href: '/catalog?concern=barrier', labelEn: 'Barrier Comfort Collection', labelBn: 'Barrier Comfort Collection' },
    { href: '/catalog?concern=pigmentation', labelEn: 'Luminous Glow Collection', labelBn: 'Luminous Glow Collection' },
  ],
  clientCare: [
    { href: '/track-order', labelEn: 'Track Your Parcel', labelBn: 'Track Your Parcel' },
    { href: '/customer/loyalty', labelEn: 'Sanctuary VIP Privileges', labelBn: 'Sanctuary VIP Privileges' },
    { href: '/legal/return_refund', labelEn: 'Return & Exchange Policy', labelBn: 'Return & Exchange Policy' },
    { href: '/support/grievance', labelEn: 'Client Support Concierge', labelBn: 'Client Support Concierge' },
  ],
  legal: [
    { href: '/legal/terms', labelEn: 'Terms of Service', labelBn: 'Terms of Service' },
    { href: '/legal/privacy', labelEn: 'Privacy & Data Protection', labelBn: 'Privacy & Data Protection' },
    { href: '/legal/shipping_delivery', labelEn: 'Shipping & Delivery', labelBn: 'Shipping & Delivery' },
  ],
};
