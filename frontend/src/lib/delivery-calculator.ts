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
  { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'Dhaka', division: 'Dhaka', estimatedDaysEn: '1-2 Days (Next Day Available)', estimatedDaysBn: '1-2 Days (Next Day Available)', feeBdt: 70 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'Gazipur', division: 'Dhaka', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '2-3 Days', feeBdt: 130 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'Narayanganj', division: 'Dhaka', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '2-3 Days', feeBdt: 130 },
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'Chattogram', division: 'Chattogram', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '2-3 Days', feeBdt: 130 },
  { id: 'coxsbazar', nameEn: "Cox's Bazar", nameBn: "Cox's Bazar", division: 'Chattogram', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '3-4 Days', feeBdt: 130 },
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'Sylhet', division: 'Sylhet', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '2-3 Days', feeBdt: 130 },
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'Rajshahi', division: 'Rajshahi', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '3-4 Days', feeBdt: 130 },
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'Khulna', division: 'Khulna', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '3-4 Days', feeBdt: 130 },
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'Barishal', division: 'Barishal', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '3-4 Days', feeBdt: 130 },
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'Rangpur', division: 'Rangpur', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '3-4 Days', feeBdt: 130 },
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'Mymensingh', division: 'Mymensingh', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '2-3 Days', feeBdt: 130 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'Cumilla', division: 'Chattogram', estimatedDaysEn: '2-3 Days', estimatedDaysBn: '2-3 Days', feeBdt: 130 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: 'Bogura', division: 'Rajshahi', estimatedDaysEn: '3-4 Days', estimatedDaysBn: '3-4 Days', feeBdt: 130 },
];

export function getDeliveryEstimate(districtId: string, cartTotalBdt: number = 0) {
  const district = BD_DISTRICTS.find((d) => d.id === districtId) || BD_DISTRICTS[0];
  const isFree = cartTotalBdt >= 2000;
  return {
    district,
    isFreeDelivery: isFree,
    deliveryFeeBdt: isFree ? 0 : district.feeBdt,
    estimatedDaysEn: district.estimatedDaysEn,
    estimatedDaysBn: district.estimatedDaysEn,
  };
}
