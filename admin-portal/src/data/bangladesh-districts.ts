export interface DistrictItem {
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  standardFee: number;
  isDhakaCity?: boolean;
  isDhakaSuburbs?: boolean;
}

export const BD_ALL_DISTRICTS: DistrictItem[] = [
  // Dhaka Division (City + Suburbs + 12 Districts)
  { id: 'dhaka-city', nameEn: 'Dhaka City (Metro)', nameBn: 'ঢাকা সিটি', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 70, isDhakaCity: true },
  { id: 'dhaka-suburbs', nameEn: 'Dhaka Suburbs (Savar/Keraniganj/Ashulia)', nameBn: 'ঢাকা উপশহর (সাভার/কেরানীগঞ্জ/আশুলিয়া)', division: 'Dhaka', divisionBn: 'ঢাকা', standardFee: 100, isDhakaSuburbs: true },
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
  { id: 'coxs-bazar', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', standardFee: 130 },
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

/**
 * Intelligent Keyword & Regex Patterns for 64 Districts, Dhaka Suburbs, and Dhaka City Metros.
 * Priority ordered: Specific Non-Dhaka Districts first -> Dhaka Suburbs -> Dhaka Metro.
 */
interface DistrictPattern {
  id: string;
  name: string;
  fee: number;
  keywords: string[];
}

const DISTRICT_PATTERNS: DistrictPattern[] = [
  // 1. All Non-Dhaka 63 Districts (Checked FIRST to avoid accidental Dhaka fallback!)
  { id: 'manikganj', name: 'Manikganj', fee: 130, keywords: ['manikganj', 'manikgonj', 'মানিকগঞ্জ'] },
  { id: 'gazipur', name: 'Gazipur', fee: 130, keywords: ['gazipur', 'গাজীপুর', 'tongi', 'টঙ্গী', 'joydebpur', 'জয়দেবপুর', 'konabari', 'কোনাবাড়ী', 'chourasta', 'চৌরাস্তা'] },
  { id: 'narayanganj', name: 'Narayanganj', fee: 130, keywords: ['narayanganj', 'narayangonj', 'নারায়ণগঞ্জ', 'নারায়নগঞ্জ', 'siddhirganj', 'সিদ্ধিরগঞ্জ', 'fatullah', 'ফতুল্লা', 'chasara', 'চাষাড়া'] },
  { id: 'narsingdi', name: 'Narsingdi', fee: 130, keywords: ['narsingdi', 'নরসিংদী'] },
  { id: 'tangail', name: 'Tangail', fee: 130, keywords: ['tangail', 'টাঙ্গাইল', 'modhupur', 'মধুপুর', 'mirzapur', 'মির্জাপুর'] },
  { id: 'munshiganj', name: 'Munshiganj', fee: 130, keywords: ['munshiganj', 'munshigonj', 'মুন্সীগঞ্জ', 'মুন্সিগঞ্জ', 'srinagar', 'শ্রীনগর'] },
  { id: 'faridpur', name: 'Faridpur', fee: 130, keywords: ['faridpur', 'ফরিদপুর'] },
  { id: 'gopalganj', name: 'Gopalganj', fee: 130, keywords: ['gopalganj', 'গোপালগঞ্জ', 'tungipara', 'টুঙ্গিপাড়া'] },
  { id: 'madaripur', name: 'Madaripur', fee: 130, keywords: ['madaripur', 'মাদারীপুর', 'shibchar', 'শিবচর'] },
  { id: 'rajbari', name: 'Rajbari', fee: 130, keywords: ['rajbari', 'রাজবাড়ী', 'রাজবাড়ি'] },
  { id: 'shariatpur', name: 'Shariatpur', fee: 130, keywords: ['shariatpur', 'শরীয়তপুর', 'শরিয়তপুর'] },
  { id: 'kishoreganj', name: 'Kishoreganj', fee: 130, keywords: ['kishoreganj', 'কিশোরগঞ্জ', 'bhairab', 'ভৈরব'] },

  { id: 'chattogram', name: 'Chattogram', fee: 130, keywords: ['chattogram', 'chittagong', 'ctg', 'চট্টগ্রাম', 'agrabad', 'আগ্রাবাদ', 'gec', 'জিইসি', 'nasirabad', 'নাসিরাবাদ', 'halishahar', 'হালিশহর', 'chawkbazar ctg', 'চকবাজার চট্টগ্রাম', 'panchlaish', 'পাঁচলাইশ', 'kotwali ctg'] },
  { id: 'coxs-bazar', name: "Cox's Bazar", fee: 130, keywords: ['coxs bazar', "cox's bazar", 'coxsbazar', 'কক্সবাজার'] },
  { id: 'cumilla', name: 'Cumilla', fee: 130, keywords: ['cumilla', 'comilla', 'কুমিল্লা', 'kandirpar', 'কান্দিরপাড়'] },
  { id: 'feni', name: 'Feni', fee: 130, keywords: ['feni', 'ফেনী'] },
  { id: 'noakhali', name: 'Noakhali', fee: 130, keywords: ['noakhali', 'নোয়াখালী', 'maijdee', 'মাইজদী'] },
  { id: 'brahmanbaria', name: 'Brahmanbaria', fee: 130, keywords: ['brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'b.baria'] },
  { id: 'chandpur', name: 'Chandpur', fee: 130, keywords: ['chandpur', 'চাঁদপুর', 'হাজীগঞ্জ'] },
  { id: 'lakshmipur', name: 'Lakshmipur', fee: 130, keywords: ['lakshmipur', 'laxmipur', 'লক্ষ্মীপুর'] },
  { id: 'bandarban', name: 'Bandarban', fee: 130, keywords: ['bandarban', 'বান্দরবান'] },
  { id: 'rangamati', name: 'Rangamati', fee: 130, keywords: ['rangamati', 'রাঙ্গামাটি'] },
  { id: 'khagrachhari', name: 'Khagrachhari', fee: 130, keywords: ['khagrachhari', 'খাগড়াছড়ি'] },

  { id: 'sylhet', name: 'Sylhet', fee: 130, keywords: ['sylhet', 'সিলেট', 'zindabazar', 'জিন্দাবাজার', 'amberkhana', 'আম্বরখানা', 'subidbazar', 'সুবিদবাজার', 'shahi eidgah', 'শাহ ঈদগাহ'] },
  { id: 'moulvibazar', name: 'Moulvibazar', fee: 130, keywords: ['moulvibazar', 'moulvibazar', 'মৌলভীবাজার', 'sreemangal', 'শ্রীমঙ্গল'] },
  { id: 'habiganj', name: 'Habiganj', fee: 130, keywords: ['habiganj', 'হবিগঞ্জ', 'shaistaganj', 'শায়েস্তাগঞ্জ'] },
  { id: 'sunamganj', name: 'Sunamganj', fee: 130, keywords: ['sunamganj', 'সুনামগঞ্জ'] },

  { id: 'rajshahi', name: 'Rajshahi', fee: 130, keywords: ['rajshahi', 'রাজশাহী', 'saheb bazar', 'সাহেব বাজার', 'motihar', 'মতিহার', 'boalia', 'বোয়ালিয়া'] },
  { id: 'bogura', name: 'Bogura', fee: 130, keywords: ['bogura', 'bogra', 'বগুড়া', 'বগুরা', 'satmatha', 'সাতমাথা'] },
  { id: 'pabna', name: 'Pabna', fee: 130, keywords: ['pabna', 'পাবনা', 'ishwardi', 'ঈশ্বরদী'] },
  { id: 'sirajganj', name: 'Sirajganj', fee: 130, keywords: ['sirajganj', 'সিরাজগঞ্জ'] },
  { id: 'naogaon', name: 'Naogaon', fee: 130, keywords: ['naogaon', 'নওগাঁ'] },
  { id: 'natore', name: 'Natore', fee: 130, keywords: ['natore', 'নাটোর'] },
  { id: 'chapainawabganj', name: 'Chapainawabganj', fee: 130, keywords: ['chapainawabganj', 'চাঁপাইনবাবগঞ্জ'] },
  { id: 'joypurhat', name: 'Joypurhat', fee: 130, keywords: ['joypurhat', 'জয়পুরহাট'] },

  { id: 'khulna', name: 'Khulna', fee: 130, keywords: ['khulna', 'খুলনা', 'sonadanga', 'সোনাডাঙ্গা', 'daulatpur', 'দৌলতপুর', 'khalishpur', 'খালিশপুর'] },
  { id: 'jashore', name: 'Jashore', fee: 130, keywords: ['jashore', 'jessore', 'যশোর', 'benapole', 'বেনাপোল'] },
  { id: 'kushtia', name: 'Kushtia', fee: 130, keywords: ['kushtia', 'কুষ্টিয়া'] },
  { id: 'satkhira', name: 'Satkhira', fee: 130, keywords: ['satkhira', 'সাতক্ষীরা'] },
  { id: 'bagerhat', name: 'Bagerhat', fee: 130, keywords: ['bagerhat', 'বাগেরহাট', 'mongla', 'মংলা'] },
  { id: 'jhenaidah', name: 'Jhenaidah', fee: 130, keywords: ['jhenaidah', 'ঝিনাইদহ'] },
  { id: 'chuadanga', name: 'Chuadanga', fee: 130, keywords: ['chuadanga', 'চুয়াডাঙ্গা', 'darshana', 'দর্শনা'] },
  { id: 'magura', name: 'Magura', fee: 130, keywords: ['magura', 'মাগুরা'] },
  { id: 'meherpur', name: 'Meherpur', fee: 130, keywords: ['meherpur', 'মেহেরপুর'] },
  { id: 'narail', name: 'Narail', fee: 130, keywords: ['narail', 'নড়াইল'] },

  { id: 'barishal', name: 'Barishal', fee: 130, keywords: ['barishal', 'barisal', 'বরিশাল', 'rupatali', 'রূপাতলী'] },
  { id: 'bhola', name: 'Bhola', fee: 130, keywords: ['bhola', 'ভোলা'] },
  { id: 'patuakhali', name: 'Patuakhali', fee: 130, keywords: ['patuakhali', 'পটুয়াখালী', 'kuakata', 'কুয়াকাটা'] },
  { id: 'pirojpur', name: 'Pirojpur', fee: 130, keywords: ['pirojpur', 'পিরোজপুর'] },
  { id: 'barguna', name: 'Barguna', fee: 130, keywords: ['barguna', 'বরগুনা'] },
  { id: 'jhalokati', name: 'Jhalokati', fee: 130, keywords: ['jhalokati', 'jhalakati', 'ঝালকাঠি'] },

  { id: 'rangpur', name: 'Rangpur', fee: 130, keywords: ['rangpur', 'রংপুর', 'payra chottor', 'পায়রা চত্বর'] },
  { id: 'dinajpur', name: 'Dinajpur', fee: 130, keywords: ['dinajpur', 'দিনাজপুর', 'hili', 'হিলি'] },
  { id: 'gaibandha', name: 'Gaibandha', fee: 130, keywords: ['gaibandha', 'গাইবান্ধা'] },
  { id: 'kurigram', name: 'Kurigram', fee: 130, keywords: ['kurigram', 'কুড়িগ্রাম'] },
  { id: 'lalmonirhat', name: 'Lalmonirhat', fee: 130, keywords: ['lalmonirhat', 'লালমনিরহাট'] },
  { id: 'nilphamari', name: 'Nilphamari', fee: 130, keywords: ['nilphamari', 'নীলফামারী', 'saidpur', 'সৈয়দপুর'] },
  { id: 'panchagarh', name: 'Panchagarh', fee: 130, keywords: ['panchagarh', 'পঞ্চগড়'] },
  { id: 'thakurgaon', name: 'Thakurgaon', fee: 130, keywords: ['thakurgaon', 'ঠাকুরগাঁও'] },

  { id: 'mymensingh', name: 'Mymensingh', fee: 130, keywords: ['mymensingh', 'ময়মনসিংহ'] },
  { id: 'jamalpur', name: 'Jamalpur', fee: 130, keywords: ['jamalpur', 'জামালপুর'] },
  { id: 'netrokona', name: 'Netrokona', fee: 130, keywords: ['netrokona', 'নেত্রকোণা', 'নেত্রকোনা'] },
  { id: 'sherpur', name: 'Sherpur', fee: 130, keywords: ['sherpur', 'শেরপুর'] },

  // 2. Dhaka Suburbs (Specific Suburb areas outside Metro)
  {
    id: 'dhaka-suburbs',
    name: 'Dhaka Suburbs (Savar/Keraniganj/Ashulia)',
    fee: 100,
    keywords: [
      'savar', 'সাভার', 'keraniganj', 'কেরানীগঞ্জ', 'কেরানিগঞ্জ',
      'ashulia', 'আশুলিয়া', 'আশুলিয়া', 'dhamrai', 'ধামরাই',
      'hemayetpur', 'হেমায়েতপুর', 'হেমায়েতপুর', 'zirani', 'জিরানী',
      'epz savar', 'baipail', 'বাইপাইল', 'nabinagar', 'নবীনগর'
    ],
  },

  // 3. Dhaka City Metro Thanas & Areas (Checked LAST so district names take precedence!)
  {
    id: 'dhaka-city',
    name: 'Dhaka City (Metro)',
    fee: 70,
    keywords: [
      'dhaka city', 'dhaka metro', 'ঢাকা সিটি', 'inside dhaka',
      'uttara', 'উত্তরা', 'mirpur', 'মিরপুর', 'dhanmondi', 'ধানমন্ডি',
      'gulshan', 'গুলশান', 'banani', 'বনানী', 'badda', 'বাড্ডা',
      'mohammadpur', 'মোহাম্মদপুর', 'malibagh', 'মালিবাগ', 'khilgaon', 'খিলগাঁও',
      'motijheel', 'মতিঝিল', 'basabo', 'বাসাবো', 'rampura', 'রামপুরা',
      'bashundhara', 'বসুন্ধরা', 'baridhara', 'বারিধারা', 'azimpur', 'আজিমপুর',
      'lalbagh', 'লালবাগ', 'shantinagar', 'শান্তিনগর', 'farmgate', 'ফার্মগেট',
      'tejgaon', 'তেজগাঁও', 'shahbagh', 'শাহবাগ', 'paltan', 'পল্টন',
      'jatrabari', 'যাত্রাবাড়ী', 'যাত্রাবাড়ি', 'wari', 'ওয়ারী',
      'chawkbazar', 'চকবাজার', 'puran dhaka', 'পুরান ঢাকা', 'old dhaka',
      'mogbazar', 'মগবাজার', 'eskaton', 'ইস্কাটন', 'kakrail', 'কাকরাইল',
      'mojammel', 'shewrapara', 'শেওড়াপাড়া', 'kazipara', 'কাজীপাড়া',
      'agargaon', 'আগারগাঁও', 'kalabagan', 'বাগান', 'niketan', 'নিকেতন',
      'aftabnagar', 'আফতাবনগর', 'nikunja', 'নিকুঞ্জ', 'khilkhet', 'খিলক্ষেত',
      'cantonment', 'সেনানিবাস', 'mirpur dosh', 'মিরপুর ১০', 'mirpur 10',
      'mirpur 1', 'মিরপুর ১', 'mirpur 2', 'মিরপুর ২', 'mirpur 11', 'মিরপুর ১১',
      'mirpur 12', 'মিরপুর ১২', 'mohammadia', 'shyamoli', 'শ্যামলী', 'kallyanpur', 'কল্যাণপুর'
    ],
  },
];

/**
 * Intelligent Bangladesh District & Zone Resolver.
 * Given ANY raw address text in Bengali, English, or mixed:
 * Detects the authentic Bangladesh District, appropriate delivery fee (৳70, ৳100, ৳130),
 * and standard logistics routing name.
 */
export function detectDistrictFromAddress(rawAddress: string): {
  district: string;
  zone: string;
  deliveryFee: number;
  matchedKeyword?: string;
  isDhakaCity: boolean;
  isSuburbs: boolean;
} | null {
  if (!rawAddress || typeof rawAddress !== 'string') return null;

  const text = rawAddress.toLowerCase().trim();
  if (text.length < 2) return null;

  for (const pattern of DISTRICT_PATTERNS) {
    for (const kw of pattern.keywords) {
      const lowerKw = kw.toLowerCase();
      // Match whole word or bounded token in Bangla/English
      const regex = new RegExp(`(^|[^a-zA-Z0-9\u0980-\u09FF])${lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zA-Z0-9\u0980-\u09FF]|$)`, 'i');
      if (regex.test(text) || text.includes(lowerKw)) {
        const isDhakaCity = pattern.id === 'dhaka-city';
        const isSuburbs = pattern.id === 'dhaka-suburbs';

        return {
          district: pattern.name,
          zone: isDhakaCity ? 'Dhaka City' : (isSuburbs ? 'Dhaka Suburbs' : pattern.name),
          deliveryFee: pattern.fee,
          matchedKeyword: kw,
          isDhakaCity,
          isSuburbs,
        };
      }
    }
  }

  return null;
}
