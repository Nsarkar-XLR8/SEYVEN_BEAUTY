export interface DistrictOption {
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  estimatedDaysEn: string;
  estimatedDaysBn: string;
  feeBdt: number;
}

export const BD_DISTRICTS: DistrictOption[] = [
  { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', division: 'Dhaka', estimatedDaysEn: '1-2 Days (Next Day Available)', estimatedDaysBn: '১-২ কর্মদিবস (পরের দিন ডেলিভারি)', feeBdt: 70 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', division: 'Dhaka', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '২-৩ কর্মদিবস', feeBdt: 130 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', division: 'Dhaka', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '২-৩ কর্মদিবস', feeBdt: 130 },
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', division: 'Chattogram', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '২-৩ কর্মদিবস', feeBdt: 130 },
  { id: 'coxsbazar', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার', division: 'Chattogram', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '৩-৪ কর্মদিবস', feeBdt: 130 },
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', division: 'Sylhet', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '২-৩ কর্মদিবস', feeBdt: 130 },
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', division: 'Rajshahi', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '৩-৪ কর্মদিবস', feeBdt: 130 },
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', division: 'Khulna', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '৩-৪ কর্মদিবস', feeBdt: 130 },
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', division: 'Barishal', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '৩-৪ কর্মদিবস', feeBdt: 130 },
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', division: 'Rangpur', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '৩-৪ কর্মদিবস', feeBdt: 130 },
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', division: 'Mymensingh', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '২-৩ কর্মদিবস', feeBdt: 130 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', division: 'Chattogram', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '২-৩ কর্মদিবস', feeBdt: 130 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', division: 'Rajshahi', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '৩-৪ কর্মদিবস', feeBdt: 130 },
];

export function getDeliveryEstimate(districtId: string, cartTotalBdt: number = 0) {
  const district = BD_DISTRICTS.find((d) => d.id === districtId) || BD_DISTRICTS[0];
  const isFree = cartTotalBdt >= 2000;
  return {
    district,
    isFreeDelivery: isFree,
    deliveryFeeBdt: isFree ? 0 : district.feeBdt,
    estimatedDaysEn: district.estimatedDaysEn,
    estimatedDaysBn: district.estimatedDaysBn,
  };
}
