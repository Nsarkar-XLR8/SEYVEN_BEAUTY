export interface DistrictItem {
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  standardFee: number;
  isDhakaCity?: boolean;
}

export const BD_ALL_DISTRICTS: DistrictItem[] = [
  // Dhaka Division (City + Suburbs + 12 Districts)
  { id: 'dhaka-city', nameEn: 'Dhaka City (Metro)', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 70, isDhakaCity: true },
  { id: 'dhaka-suburbs', nameEn: 'Dhaka Suburbs (Savar/Keraniganj/Ashulia)', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 100 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'tangail', nameEn: 'Tangail', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'manikganj', nameEn: 'Manikganj', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'faridpur', nameEn: 'Faridpur', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'madaripur', nameEn: 'Madaripur', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'rajbari', nameEn: 'Rajbari', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },
  { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: '', division: 'Dhaka', divisionBn: '', standardFee: 130 },

  // Chattogram Division (11 Districts)
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'coxs-bazar', nameEn: 'Cox\'s Bazar', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'feni', nameEn: 'Feni', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'noakhali', nameEn: 'Noakhali', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'chandpur', nameEn: 'Chandpur', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'bandarban', nameEn: 'Bandarban', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'rangamati', nameEn: 'Rangamati', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },
  { id: 'khagrachhari', nameEn: 'Khagrachhari', nameBn: '', division: 'Chattogram', divisionBn: '', standardFee: 130 },

  // Sylhet Division (4 Districts)
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: '', division: 'Sylhet', divisionBn: '', standardFee: 130 },
  { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: '', division: 'Sylhet', divisionBn: '', standardFee: 130 },
  { id: 'habiganj', nameEn: 'Habiganj', nameBn: '', division: 'Sylhet', divisionBn: '', standardFee: 130 },
  { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: '', division: 'Sylhet', divisionBn: '', standardFee: 130 },

  // Rajshahi Division (8 Districts)
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'pabna', nameEn: 'Pabna', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'naogaon', nameEn: 'Naogaon', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'natore', nameEn: 'Natore', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'chapainawabganj', nameEn: 'Chapainawabganj', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },
  { id: 'joypurhat', nameEn: 'Joypurhat', nameBn: '', division: 'Rajshahi', divisionBn: '', standardFee: 130 },

  // Khulna Division (10 Districts)
  { id: 'khulna', nameEn: 'Khulna', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'jashore', nameEn: 'Jashore', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'kushtia', nameEn: 'Kushtia', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'satkhira', nameEn: 'Satkhira', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'magura', nameEn: 'Magura', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'meherpur', nameEn: 'Meherpur', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },
  { id: 'narail', nameEn: 'Narail', nameBn: '', division: 'Khulna', divisionBn: '', standardFee: 130 },

  // Barishal Division (6 Districts)
  { id: 'barishal', nameEn: 'Barishal', nameBn: '', division: 'Barishal', divisionBn: '', standardFee: 130 },
  { id: 'bhola', nameEn: 'Bhola', nameBn: '', division: 'Barishal', divisionBn: '', standardFee: 130 },
  { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: '', division: 'Barishal', divisionBn: '', standardFee: 130 },
  { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: '', division: 'Barishal', divisionBn: '', standardFee: 130 },
  { id: 'barguna', nameEn: 'Barguna', nameBn: '', division: 'Barishal', divisionBn: '', standardFee: 130 },
  { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: '', division: 'Barishal', divisionBn: '', standardFee: 130 },

  // Rangpur Division (8 Districts)
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'kurigram', nameEn: 'Kurigram', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },
  { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: '', division: 'Rangpur', divisionBn: '', standardFee: 130 },

  // Mymensingh Division (4 Districts)
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: '', division: 'Mymensingh', divisionBn: '', standardFee: 130 },
  { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: '', division: 'Mymensingh', divisionBn: '', standardFee: 130 },
  { id: 'netrokona', nameEn: 'Netrokona', nameBn: '', division: 'Mymensingh', divisionBn: '', standardFee: 130 },
  { id: 'sherpur', nameEn: 'Sherpur', nameBn: '', division: 'Mymensingh', divisionBn: '', standardFee: 130 },
];
