export interface ThanaOption {
  id: string;
  nameEn: string;
  nameBn: string;
}

export interface DistrictGeo {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionId: string;
  isDhakaCity?: boolean;
  standardFeeBdt: number;
  estimatedTransitEn: string;
  estimatedTransitBn: string;
  thanas: ThanaOption[];
}

export interface DivisionGeo {
  id: string;
  nameEn: string;
  nameBn: string;
}

export const BD_DIVISIONS: DivisionGeo[] = [
  { id: 'dhaka', nameEn: 'Dhaka Division', nameBn: 'ঢাকা বিভাগ' },
  { id: 'chattogram', nameEn: 'Chattogram Division', nameBn: 'চট্টগ্রাম বিভাগ' },
  { id: 'sylhet', nameEn: 'Sylhet Division', nameBn: 'সিলেট বিভাগ' },
  { id: 'rajshahi', nameEn: 'Rajshahi Division', nameBn: 'রাজশাহী বিভাগ' },
  { id: 'khulna', nameEn: 'Khulna Division', nameBn: 'খুলনা বিভাগ' },
  { id: 'barishal', nameEn: 'Barishal Division', nameBn: 'বরিশাল বিভাগ' },
  { id: 'rangpur', nameEn: 'Rangpur Division', nameBn: 'রংপুর বিভাগ' },
  { id: 'mymensingh', nameEn: 'Mymensingh Division', nameBn: 'ময়মনসিংহ বিভাগ' },
];

export const BD_GEO_DISTRICTS: DistrictGeo[] = [
  {
    id: 'dhaka-metro',
    nameEn: 'Dhaka City (Metropolitan)',
    nameBn: 'ঢাকা মেট্রোপলিটন',
    divisionId: 'dhaka',
    isDhakaCity: true,
    standardFeeBdt: 70,
    estimatedTransitEn: '1-2 Days (Next Day Available)',
    estimatedTransitBn: '১-২ কর্মদিবস (পরের দিন ডেলিভারি)',
    thanas: [
      { id: 'gulshan', nameEn: 'Gulshan (1 & 2)', nameBn: 'গুলশান' },
      { id: 'banani', nameEn: 'Banani', nameBn: 'বনানী' },
      { id: 'dhanmondi', nameEn: 'Dhanmondi', nameBn: 'ধানমন্ডি' },
      { id: 'uttara', nameEn: 'Uttara (All Sectors)', nameBn: 'উত্তরা' },
      { id: 'bashundhara', nameEn: 'Bashundhara R/A', nameBn: 'বসুন্ধরা আ/এ' },
      { id: 'mirpur', nameEn: 'Mirpur (All Sections)', nameBn: 'মিরপুর' },
      { id: 'mohammadpur', nameEn: 'Mohammadpur', nameBn: 'মোহাম্মদপুর' },
      { id: 'badda', nameEn: 'Badda & Rampura', nameBn: 'বাড্ডা ও রামপুরা' },
      { id: 'khilgaon', nameEn: 'Khilgaon & Malibagh', nameBn: 'খিলগাঁও ও মালিবাগ' },
      { id: 'motijheel', nameEn: 'Motijheel & Paltan', nameBn: 'মতিঝিল ও পল্টন' },
      { id: 'old-dhaka', nameEn: 'Old Dhaka (Lalbagh/Kotwali)', nameBn: 'পুরান ঢাকা' },
      { id: 'cantonment', nameEn: 'Dhaka Cantonment', nameBn: 'ক্যান্টনমেন্ট' },
    ],
  },
  {
    id: 'dhaka-suburb',
    nameEn: 'Dhaka Suburbs (Savar, Keraniganj, Dhamrai)',
    nameBn: 'ঢাকা উপশহর (সাভার, কেরানীগঞ্জ)',
    divisionId: 'dhaka',
    standardFeeBdt: 100,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '২-৩ কর্মদিবস',
    thanas: [
      { id: 'savar', nameEn: 'Savar', nameBn: 'সাভার' },
      { id: 'keraniganj', nameEn: 'Keraniganj', nameBn: 'কেরানীগঞ্জ' },
      { id: 'dhamrai', nameEn: 'Dhamrai', nameBn: 'ধামরাই' },
      { id: 'ashulia', nameEn: 'Ashulia', nameBn: 'আশুলিয়া' },
    ],
  },
  {
    id: 'gazipur',
    nameEn: 'Gazipur',
    nameBn: 'গাজীপুর',
    divisionId: 'dhaka',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '২-৩ কর্মদিবস',
    thanas: [
      { id: 'gazipur-sadar', nameEn: 'Gazipur Sadar', nameBn: 'গাজীপুর সদর' },
      { id: 'tongie', nameEn: 'Tongi', nameBn: 'টঙ্গী' },
      { id: 'kaliakair', nameEn: 'Kaliakair', nameBn: 'কালিয়াকৈর' },
      { id: 'kapasia', nameEn: 'Kapasia', nameBn: 'কাপাসিয়া' },
    ],
  },
  {
    id: 'narayanganj',
    nameEn: 'Narayanganj',
    nameBn: 'নারায়ণগঞ্জ',
    divisionId: 'dhaka',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '২-৩ কর্মদিবস',
    thanas: [
      { id: 'narayanganj-sadar', nameEn: 'Narayanganj Sadar', nameBn: 'নারায়ণগঞ্জ সদর' },
      { id: 'fatullah', nameEn: 'Fatullah', nameBn: 'ফতুল্লা' },
      { id: 'siddhirganj', nameEn: 'Siddhirganj', nameBn: 'সিদ্ধিরগঞ্জ' },
      { id: 'sonargaon', nameEn: 'Sonargaon', nameBn: 'সোনারগাঁও' },
    ],
  },
  {
    id: 'chattogram-metro',
    nameEn: 'Chattogram City (Metropolitan)',
    nameBn: 'চট্টগ্রাম মেট্রোপলিটন',
    divisionId: 'chattogram',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '২-৩ কর্মদিবস',
    thanas: [
      { id: 'khulshi', nameEn: 'Khulshi & GEC', nameBn: 'খুলশী ও জিইসি' },
      { id: 'panchlaish', nameEn: 'Panchlaish', nameBn: 'পাঁচলাইশ' },
      { id: 'kotwali-ctg', nameEn: 'Kotwali & Agrabad', nameBn: 'কোতোয়ালী ও আগ্রাবাদ' },
      { id: 'nasirabad', nameEn: 'Nasirabad', nameBn: 'নাসিরাবাদ' },
      { id: 'halishahar', nameEn: 'Halishahar', nameBn: 'হালিশহর' },
    ],
  },
  {
    id: 'coxsbazar',
    nameEn: "Cox's Bazar",
    nameBn: 'কক্সবাজার',
    divisionId: 'chattogram',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '৩-৪ কর্মদিবস',
    thanas: [
      { id: 'cox-sadar', nameEn: "Cox's Bazar Sadar", nameBn: 'কক্সবাজার সদর' },
      { id: 'ramu', nameEn: 'Ramu', nameBn: 'রামু' },
      { id: 'teknaf', nameEn: 'Teknaf', nameBn: 'টেকনাফ' },
    ],
  },
  {
    id: 'sylhet-metro',
    nameEn: 'Sylhet City (Metropolitan)',
    nameBn: 'সিলেট মেট্রোপলিটন',
    divisionId: 'sylhet',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '২-৩ কর্মদিবস',
    thanas: [
      { id: 'sylhet-sadar', nameEn: 'Sylhet Sadar / Zindabazar', nameBn: 'সিলেট সদর / জিন্দাবাজার' },
      { id: 'amberkhana', nameEn: 'Amberkhana & Shibganj', nameBn: 'আম্বরখানা ও শিবগঞ্জ' },
      { id: 'south-surma', nameEn: 'South Surma', nameBn: 'দক্ষিণ সুরমা' },
      { id: 'shah-paran', nameEn: 'Shah Paran', nameBn: 'শাহ পরাণ' },
    ],
  },
  {
    id: 'rajshahi-metro',
    nameEn: 'Rajshahi Metropolitan',
    nameBn: 'রাজশাহী মেট্রোপলিটন',
    divisionId: 'rajshahi',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '৩-৪ কর্মদিবস',
    thanas: [
      { id: 'boalia', nameEn: 'Boalia', nameBn: 'বোয়ালিয়া' },
      { id: 'rajpara', nameEn: 'Rajpara', nameBn: 'রাজপাড়া' },
      { id: 'motihar', nameEn: 'Motihar', nameBn: 'মতিহার' },
    ],
  },
  {
    id: 'khulna-metro',
    nameEn: 'Khulna Metropolitan',
    nameBn: 'খুলনা মেট্রোপলিটন',
    divisionId: 'khulna',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '৩-৪ কর্মদিবস',
    thanas: [
      { id: 'khulna-sadar', nameEn: 'Khulna Sadar', nameBn: 'খুলনা সদর' },
      { id: 'sonadanga', nameEn: 'Sonadanga', nameBn: 'সোনাডাঙ্গা' },
      { id: 'khalishpur', nameEn: 'Khalishpur', nameBn: 'খালিশপুর' },
    ],
  },
  {
    id: 'barishal-metro',
    nameEn: 'Barishal Metropolitan',
    nameBn: 'বরিশাল মেট্রোপলিটন',
    divisionId: 'barishal',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '৩-৪ কর্মদিবস',
    thanas: [
      { id: 'barishal-sadar', nameEn: 'Barishal Sadar', nameBn: 'বরিশাল সদর' },
      { id: 'kotwali-barishal', nameEn: 'Kotwali', nameBn: 'কোতোয়ালী' },
    ],
  },
  {
    id: 'rangpur-metro',
    nameEn: 'Rangpur Metropolitan',
    nameBn: 'রংপুর মেট্রোপলিটন',
    divisionId: 'rangpur',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '৩-৪ কর্মদিবস',
    thanas: [
      { id: 'rangpur-sadar', nameEn: 'Rangpur Sadar', nameBn: 'রংপুর সদর' },
      { id: 'tajhat', nameEn: 'Tajhat', nameBn: 'তাজহাট' },
    ],
  },
  {
    id: 'mymensingh-metro',
    nameEn: 'Mymensingh Metropolitan',
    nameBn: 'ময়মনসিংহ মেট্রোপলিটন',
    divisionId: 'mymensingh',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '২-৩ কর্মদিবস',
    thanas: [
      { id: 'mymensingh-sadar', nameEn: 'Mymensingh Sadar', nameBn: 'ময়মনসিংহ সদর' },
      { id: 'muktagacha', nameEn: 'Muktagacha', nameBn: 'মুক্তাগাছা' },
    ],
  },
];

export function getDistrictsByDivision(divisionId: string): DistrictGeo[] {
  return BD_GEO_DISTRICTS.filter((d) => d.divisionId === divisionId);
}

export function getDistrictById(districtId: string): DistrictGeo | undefined {
  return BD_GEO_DISTRICTS.find((d) => d.id === districtId);
}
