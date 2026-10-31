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
  { id: 'dhaka', nameEn: 'Dhaka Division', nameBn: '' },
  { id: 'chattogram', nameEn: 'Chattogram Division', nameBn: '' },
  { id: 'sylhet', nameEn: 'Sylhet Division', nameBn: '' },
  { id: 'rajshahi', nameEn: 'Rajshahi Division', nameBn: '' },
  { id: 'khulna', nameEn: 'Khulna Division', nameBn: '' },
  { id: 'barishal', nameEn: 'Barishal Division', nameBn: '' },
  { id: 'rangpur', nameEn: 'Rangpur Division', nameBn: '' },
  { id: 'mymensingh', nameEn: 'Mymensingh Division', nameBn: '' },
];

export const BD_GEO_DISTRICTS: DistrictGeo[] = [
  {
    id: 'dhaka-metro',
    nameEn: 'Dhaka City (Metropolitan)',
    nameBn: '',
    divisionId: 'dhaka',
    isDhakaCity: true,
    standardFeeBdt: 70,
    estimatedTransitEn: '1-2 Days (Next Day Available)',
    estimatedTransitBn: '',
    thanas: [
      { id: 'gulshan', nameEn: 'Gulshan (1 & 2)', nameBn: '' },
      { id: 'banani', nameEn: 'Banani', nameBn: '' },
      { id: 'dhanmondi', nameEn: 'Dhanmondi', nameBn: '' },
      { id: 'uttara', nameEn: 'Uttara (All Sectors)', nameBn: '' },
      { id: 'bashundhara', nameEn: 'Bashundhara R/A', nameBn: '' },
      { id: 'mirpur', nameEn: 'Mirpur (All Sections)', nameBn: '' },
      { id: 'mohammadpur', nameEn: 'Mohammadpur', nameBn: '' },
      { id: 'badda', nameEn: 'Badda & Rampura', nameBn: '' },
      { id: 'khilgaon', nameEn: 'Khilgaon & Malibagh', nameBn: '' },
      { id: 'motijheel', nameEn: 'Motijheel & Paltan', nameBn: '' },
      { id: 'old-dhaka', nameEn: 'Old Dhaka (Lalbagh/Kotwali)', nameBn: '' },
      { id: 'cantonment', nameEn: 'Dhaka Cantonment', nameBn: '' },
    ],
  },
  {
    id: 'dhaka-suburb',
    nameEn: 'Dhaka Suburbs (Savar, Keraniganj, Dhamrai)',
    nameBn: '',
    divisionId: 'dhaka',
    standardFeeBdt: 100,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'savar', nameEn: 'Savar', nameBn: '' },
      { id: 'keraniganj', nameEn: 'Keraniganj', nameBn: '' },
      { id: 'dhamrai', nameEn: 'Dhamrai', nameBn: '' },
      { id: 'ashulia', nameEn: 'Ashulia', nameBn: '' },
    ],
  },
  {
    id: 'gazipur',
    nameEn: 'Gazipur',
    nameBn: '',
    divisionId: 'dhaka',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'gazipur-sadar', nameEn: 'Gazipur Sadar', nameBn: '' },
      { id: 'tongie', nameEn: 'Tongi', nameBn: '' },
      { id: 'kaliakair', nameEn: 'Kaliakair', nameBn: '' },
      { id: 'kapasia', nameEn: 'Kapasia', nameBn: '' },
    ],
  },
  {
    id: 'narayanganj',
    nameEn: 'Narayanganj',
    nameBn: '',
    divisionId: 'dhaka',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'narayanganj-sadar', nameEn: 'Narayanganj Sadar', nameBn: '' },
      { id: 'fatullah', nameEn: 'Fatullah', nameBn: '' },
      { id: 'siddhirganj', nameEn: 'Siddhirganj', nameBn: '' },
      { id: 'sonargaon', nameEn: 'Sonargaon', nameBn: '' },
    ],
  },
  {
    id: 'chattogram-metro',
    nameEn: 'Chattogram City (Metropolitan)',
    nameBn: '',
    divisionId: 'chattogram',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'khulshi', nameEn: 'Khulshi & GEC', nameBn: '' },
      { id: 'panchlaish', nameEn: 'Panchlaish', nameBn: '' },
      { id: 'kotwali-ctg', nameEn: 'Kotwali & Agrabad', nameBn: '' },
      { id: 'nasirabad', nameEn: 'Nasirabad', nameBn: '' },
      { id: 'halishahar', nameEn: 'Halishahar', nameBn: '' },
    ],
  },
  {
    id: 'coxsbazar',
    nameEn: "Cox's Bazar",
    nameBn: '',
    divisionId: 'chattogram',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'cox-sadar', nameEn: "Cox's Bazar Sadar", nameBn: '' },
      { id: 'ramu', nameEn: 'Ramu', nameBn: '' },
      { id: 'teknaf', nameEn: 'Teknaf', nameBn: '' },
    ],
  },
  {
    id: 'sylhet-metro',
    nameEn: 'Sylhet City (Metropolitan)',
    nameBn: '',
    divisionId: 'sylhet',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'sylhet-sadar', nameEn: 'Sylhet Sadar / Zindabazar', nameBn: '' },
      { id: 'amberkhana', nameEn: 'Amberkhana & Shibganj', nameBn: '' },
      { id: 'south-surma', nameEn: 'South Surma', nameBn: '' },
      { id: 'shah-paran', nameEn: 'Shah Paran', nameBn: '' },
    ],
  },
  {
    id: 'rajshahi-metro',
    nameEn: 'Rajshahi Metropolitan',
    nameBn: '',
    divisionId: 'rajshahi',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'boalia', nameEn: 'Boalia', nameBn: '' },
      { id: 'rajpara', nameEn: 'Rajpara', nameBn: '' },
      { id: 'motihar', nameEn: 'Motihar', nameBn: '' },
    ],
  },
  {
    id: 'khulna-metro',
    nameEn: 'Khulna Metropolitan',
    nameBn: '',
    divisionId: 'khulna',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'khulna-sadar', nameEn: 'Khulna Sadar', nameBn: '' },
      { id: 'sonadanga', nameEn: 'Sonadanga', nameBn: '' },
      { id: 'khalishpur', nameEn: 'Khalishpur', nameBn: '' },
    ],
  },
  {
    id: 'barishal-metro',
    nameEn: 'Barishal Metropolitan',
    nameBn: '',
    divisionId: 'barishal',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'barishal-sadar', nameEn: 'Barishal Sadar', nameBn: '' },
      { id: 'kotwali-barishal', nameEn: 'Kotwali', nameBn: '' },
    ],
  },
  {
    id: 'rangpur-metro',
    nameEn: 'Rangpur Metropolitan',
    nameBn: '',
    divisionId: 'rangpur',
    standardFeeBdt: 130,
    estimatedTransitEn: '3-4 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'rangpur-sadar', nameEn: 'Rangpur Sadar', nameBn: '' },
      { id: 'tajhat', nameEn: 'Tajhat', nameBn: '' },
    ],
  },
  {
    id: 'mymensingh-metro',
    nameEn: 'Mymensingh Metropolitan',
    nameBn: '',
    divisionId: 'mymensingh',
    standardFeeBdt: 130,
    estimatedTransitEn: '2-3 Days',
    estimatedTransitBn: '',
    thanas: [
      { id: 'mymensingh-sadar', nameEn: 'Mymensingh Sadar', nameBn: '' },
      { id: 'muktagacha', nameEn: 'Muktagacha', nameBn: '' },
    ],
  },
];

export function getDistrictsByDivision(divisionId: string): DistrictGeo[] {
  return BD_GEO_DISTRICTS.filter((d) => d.divisionId === divisionId);
}

export function getDistrictById(districtId: string): DistrictGeo | undefined {
  return BD_GEO_DISTRICTS.find((d) => d.id === districtId);
}
