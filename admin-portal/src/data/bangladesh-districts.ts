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
  { id: 'dhaka-city', nameEn: 'Dhaka City (Metro)', nameBn: 'ঢাকা সিটি (মেট্রো)', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 70, isDhakaCity: true },
  { id: 'dhaka-suburbs', nameEn: 'Dhaka Suburbs (Savar/Keraniganj/Ashulia)', nameBn: 'ঢাকা উপশহর (সাভার/কেরানীগঞ্জ)', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 100 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },
  { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 130 },

  // Chattogram Division (11 Districts)
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'coxs-bazar', nameEn: 'Cox\'s Bazar', nameBn: 'কক্সবাজার', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
  { id: 'khagrachhari', nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },

  // Sylhet Division (4 Districts)
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', division: 'Sylhet', divisionBn: 'সিলেট', standardFee: 130 },
  { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', division: 'Sylhet', divisionBn: 'সিলেট', standardFee: 130 },
  { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', division: 'Sylhet', divisionBn: 'সিলেট', standardFee: 130 },
  { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', division: 'Sylhet', divisionBn: 'সিলেট', standardFee: 130 },

  // Rajshahi Division (8 Districts)
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'pabna', nameEn: 'Pabna', nameBn: 'পাবনা', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'natore', nameEn: 'Natore', nameBn: 'নাটোর', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'chapainawabganj', nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },
  { id: 'joypurhat', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', division: 'Rajshahi', divisionBn: 'রাজশাহী', standardFee: 130 },

  // Khulna Division (10 Districts)
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'jashore', nameEn: 'Jashore', nameBn: 'যশোর', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'magura', nameEn: 'Magura', nameBn: 'মাগুরা', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },
  { id: 'narail', nameEn: 'Narail', nameBn: 'নড়াইল', division: 'Khulna', divisionBn: 'খুলনা', standardFee: 130 },

  // Barishal Division (6 Districts)
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', division: 'Barishal', divisionBn: 'বরিশাল', standardFee: 130 },
  { id: 'bhola', nameEn: 'Bhola', nameBn: 'ভোলা', division: 'Barishal', divisionBn: 'বরিশাল', standardFee: 130 },
  { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', division: 'Barishal', divisionBn: 'বরিশাল', standardFee: 130 },
  { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', division: 'Barishal', divisionBn: 'বরিশাল', standardFee: 130 },
  { id: 'barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', division: 'Barishal', divisionBn: 'বরিশাল', standardFee: 130 },
  { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', division: 'Barishal', divisionBn: 'বরিশাল', standardFee: 130 },

  // Rangpur Division (8 Districts)
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },
  { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', division: 'Rangpur', divisionBn: 'রংপুর', standardFee: 130 },

  // Mymensingh Division (4 Districts)
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', standardFee: 130 },
  { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', standardFee: 130 },
  { id: 'netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', standardFee: 130 },
  { id: 'sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', standardFee: 130 },
];
