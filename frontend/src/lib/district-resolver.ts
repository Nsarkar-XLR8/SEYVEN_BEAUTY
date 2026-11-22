/**
 * Universal Intelligent Bangladesh District Resolver for Storefront Checkout.
 * Automatically resolves authentic District and Logistics Hub from raw address text.
 * Delivery fees are dynamically synchronized with Admin Platform Settings.
 */

export type ZoneType = 'DHAKA_CITY' | 'DHAKA_SUBURBS' | 'OUTSIDE_DHAKA';

export interface DistrictPattern {
  id: string;
  name: string;
  zoneType: ZoneType;
  keywords: string[];
}

export interface DeliveryFeeConfig {
  insideDhakaFee?: number;
  outsideDhakaFee?: number;
  suburbsFee?: number;
}

// Module-level live fee configuration (dynamically updated from platform settings)
let globalDeliveryFeeConfig: DeliveryFeeConfig = {
  insideDhakaFee: 70,
  outsideDhakaFee: 130,
  suburbsFee: 100,
};

export function updateGlobalDeliveryFeeConfig(config: Partial<DeliveryFeeConfig>) {
  globalDeliveryFeeConfig = {
    ...globalDeliveryFeeConfig,
    ...config,
  };
}

export function getGlobalDeliveryFeeConfig(): DeliveryFeeConfig {
  return { ...globalDeliveryFeeConfig };
}

export const BD_ALL_DISTRICT_OPTIONS = [
  { id: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা', isDhaka: true },
  { id: 'manikganj', name: 'Manikganj', nameBn: 'মানিকগঞ্জ' },
  { id: 'gazipur', name: 'Gazipur', nameBn: 'গাজীপুর' },
  { id: 'narayanganj', name: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ' },
  { id: 'narsingdi', name: 'Narsingdi', nameBn: 'নরসিংদী' },
  { id: 'tangail', name: 'Tangail', nameBn: 'টাঙ্গাইল' },
  { id: 'munshiganj', name: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ' },
  { id: 'faridpur', name: 'Faridpur', nameBn: 'ফরিদপুর' },
  { id: 'gopalganj', name: 'Gopalganj', nameBn: 'গোপালগঞ্জ' },
  { id: 'madaripur', name: 'Madaripur', nameBn: 'মাদারীপুর' },
  { id: 'rajbari', name: 'Rajbari', nameBn: 'রাজবাড়ী' },
  { id: 'shariatpur', name: 'Shariatpur', nameBn: 'শরীয়তপুর' },
  { id: 'kishoreganj', name: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ' },
  { id: 'chattogram', name: 'Chattogram', nameBn: 'চট্টগ্রাম' },
  { id: 'coxs-bazar', name: "Cox's Bazar", nameBn: 'কক্সবাজার' },
  { id: 'cumilla', name: 'Cumilla', nameBn: 'কুমিল্লা' },
  { id: 'feni', name: 'Feni', nameBn: 'ফেনী' },
  { id: 'noakhali', name: 'Noakhali', nameBn: 'নোয়াখালী' },
  { id: 'brahmanbaria', name: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া' },
  { id: 'chandpur', name: 'Chandpur', nameBn: 'চাঁদপুর' },
  { id: 'lakshmipur', name: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর' },
  { id: 'bandarban', name: 'Bandarban', nameBn: 'বান্দরবান' },
  { id: 'rangamati', name: 'Rangamati', nameBn: 'রাঙ্গামাটি' },
  { id: 'khagrachhari', name: 'Khagrachhari', nameBn: 'খাগড়াছড়ি' },
  { id: 'sylhet', name: 'Sylhet', nameBn: 'সিলেট' },
  { id: 'moulvibazar', name: 'Moulvibazar', nameBn: 'মৌলভীবাজার' },
  { id: 'habiganj', name: 'Habiganj', nameBn: 'হবিগঞ্জ' },
  { id: 'sunamganj', name: 'Sunamganj', nameBn: 'সুনামগঞ্জ' },
  { id: 'rajshahi', name: 'Rajshahi', nameBn: 'রাজশাহী' },
  { id: 'bogura', name: 'Bogura', nameBn: 'বগুড়া' },
  { id: 'pabna', name: 'Pabna', nameBn: 'পাবনা' },
  { id: 'sirajganj', name: 'Sirajganj', nameBn: 'সিরাজগঞ্জ' },
  { id: 'naogaon', name: 'Naogaon', nameBn: 'নওগাঁ' },
  { id: 'natore', name: 'Natore', nameBn: 'নাটোর' },
  { id: 'chapainawabganj', name: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ' },
  { id: 'joypurhat', name: 'Joypurhat', nameBn: 'জয়পুরহাট' },
  { id: 'khulna', name: 'Khulna', nameBn: 'খুলনা' },
  { id: 'jashore', name: 'Jashore', nameBn: 'যশোর' },
  { id: 'kushtia', name: 'Kushtia', nameBn: 'কুষ্টিয়া' },
  { id: 'satkhira', name: 'Satkhira', nameBn: 'সাতক্ষীরা' },
  { id: 'bagerhat', name: 'Bagerhat', nameBn: 'বাগেরহাট' },
  { id: 'jhenaidah', name: 'Jhenaidah', nameBn: 'ঝিনাইদহ' },
  { id: 'chuadanga', name: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা' },
  { id: 'magura', name: 'Magura', nameBn: 'মাগুরা' },
  { id: 'meherpur', name: 'Meherpur', nameBn: 'মেহেরপুর' },
  { id: 'narail', name: 'Narail', nameBn: 'নড়াইল' },
  { id: 'barishal', name: 'Barishal', nameBn: 'বরিশাল' },
  { id: 'bhola', name: 'Bhola', nameBn: 'ভোলা' },
  { id: 'patuakhali', name: 'Patuakhali', nameBn: 'পটুয়াখালী' },
  { id: 'pirojpur', name: 'Pirojpur', nameBn: 'পিরোজপুর' },
  { id: 'barguna', name: 'Barguna', nameBn: 'বরগুনা' },
  { id: 'jhalokati', name: 'Jhalokati', nameBn: 'ঝালকাঠি' },
  { id: 'rangpur', name: 'Rangpur', nameBn: 'রংপুর' },
  { id: 'dinajpur', name: 'Dinajpur', nameBn: 'দিনাজপুর' },
  { id: 'gaibandha', name: 'Gaibandha', nameBn: 'গাইবান্ধা' },
  { id: 'kurigram', name: 'Kurigram', nameBn: 'কুড়িগ্রাম' },
  { id: 'lalmonirhat', name: 'Lalmonirhat', nameBn: 'লালমনিরহাট' },
  { id: 'nilphamari', name: 'Nilphamari', nameBn: 'নীলফামারী' },
  { id: 'panchagarh', name: 'Panchagarh', nameBn: 'পঞ্চগড়' },
  { id: 'thakurgaon', name: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও' },
  { id: 'mymensingh', name: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
  { id: 'jamalpur', name: 'Jamalpur', nameBn: 'জামালপুর' },
  { id: 'netrokona', name: 'Netrokona', nameBn: 'নেত্রকোণা' },
  { id: 'sherpur', name: 'Sherpur', nameBn: 'শেরপুর' },
];

export const DISTRICT_PATTERNS: DistrictPattern[] = [
  // 1. All Non-Dhaka 63 Districts (Checked FIRST to avoid accidental Dhaka fallback!)
  { id: 'manikganj', name: 'Manikganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['manikganj', 'manikgonj', 'মানিকগঞ্জ'] },
  { id: 'gazipur', name: 'Gazipur', zoneType: 'OUTSIDE_DHAKA', keywords: ['gazipur', 'গাজীপুর', 'tongi', 'টঙ্গী', 'joydebpur', 'জয়দেবপুর', 'konabari', 'কোনাবাড়ী', 'chourasta', 'চৌরাস্তা'] },
  { id: 'narayanganj', name: 'Narayanganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['narayanganj', 'narayangonj', 'নারায়ণগঞ্জ', 'নারায়নগঞ্জ', 'siddhirganj', 'সিদ্ধিরগঞ্জ', 'fatullah', 'ফতুল্লা', 'chasara', 'চাষাড়া'] },
  { id: 'narsingdi', name: 'Narsingdi', zoneType: 'OUTSIDE_DHAKA', keywords: ['narsingdi', 'নরসিংদী'] },
  { id: 'tangail', name: 'Tangail', zoneType: 'OUTSIDE_DHAKA', keywords: ['tangail', 'টাঙ্গাইল', 'modhupur', 'মধুপুর', 'mirzapur', 'মির্জাপুর'] },
  { id: 'munshiganj', name: 'Munshiganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['munshiganj', 'munshigonj', 'মুন্সীগঞ্জ', 'মুন্সিগঞ্জ', 'srinagar', 'শ্রীনগর'] },
  { id: 'faridpur', name: 'Faridpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['faridpur', 'ফরিদপুর'] },
  { id: 'gopalganj', name: 'Gopalganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['gopalganj', 'গোপালগঞ্জ', 'tungipara', 'টুঙ্গিপাড়া'] },
  { id: 'madaripur', name: 'Madaripur', zoneType: 'OUTSIDE_DHAKA', keywords: ['madaripur', 'মাদারীপুর', 'shibchar', 'শিবচর'] },
  { id: 'rajbari', name: 'Rajbari', zoneType: 'OUTSIDE_DHAKA', keywords: ['rajbari', 'রাজবাড়ী', 'রাজবাড়ি'] },
  { id: 'shariatpur', name: 'Shariatpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['shariatpur', 'শরীয়তপুর', 'শরিয়তপুর'] },
  { id: 'kishoreganj', name: 'Kishoreganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['kishoreganj', 'কিশোরগঞ্জ', 'bhairab', 'ভৈরব'] },

  { id: 'chattogram', name: 'Chattogram', zoneType: 'OUTSIDE_DHAKA', keywords: ['chattogram', 'chittagong', 'ctg', 'চট্টগ্রাম', 'agrabad', 'আগ্রাবাদ', 'gec', 'জিইসি', 'nasirabad', 'নাসিরাবাদ', 'halishahar', 'হালিশহর', 'chawkbazar ctg', 'চকবাজার চট্টগ্রাম', 'panchlaish', 'পাঁচলাইশ', 'kotwali ctg'] },
  { id: 'coxs-bazar', name: "Cox's Bazar", zoneType: 'OUTSIDE_DHAKA', keywords: ['coxs bazar', "cox's bazar", 'coxsbazar', 'কক্সবাজার'] },
  { id: 'cumilla', name: 'Cumilla', zoneType: 'OUTSIDE_DHAKA', keywords: ['cumilla', 'comilla', 'কুমিল্লা', 'kandirpar', 'কান্দিরপাড়'] },
  { id: 'feni', name: 'Feni', zoneType: 'OUTSIDE_DHAKA', keywords: ['feni', 'ফেনী'] },
  { id: 'noakhali', name: 'Noakhali', zoneType: 'OUTSIDE_DHAKA', keywords: ['noakhali', 'নোয়াখালী', 'maijdee', 'মাইজদী'] },
  { id: 'brahmanbaria', name: 'Brahmanbaria', zoneType: 'OUTSIDE_DHAKA', keywords: ['brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'b.baria'] },
  { id: 'chandpur', name: 'Chandpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['chandpur', 'চাঁদপুর', 'হাজীগঞ্জ'] },
  { id: 'lakshmipur', name: 'Lakshmipur', zoneType: 'OUTSIDE_DHAKA', keywords: ['lakshmipur', 'laxmipur', 'লক্ষ্মীপুর'] },
  { id: 'bandarban', name: 'Bandarban', zoneType: 'OUTSIDE_DHAKA', keywords: ['bandarban', 'বান্দরবান'] },
  { id: 'rangamati', name: 'Rangamati', zoneType: 'OUTSIDE_DHAKA', keywords: ['rangamati', 'রাঙ্গামাটি'] },
  { id: 'khagrachhari', name: 'Khagrachhari', zoneType: 'OUTSIDE_DHAKA', keywords: ['khagrachhari', 'খাগড়াছড়ি'] },

  { id: 'sylhet', name: 'Sylhet', zoneType: 'OUTSIDE_DHAKA', keywords: ['sylhet', 'সিলেট', 'zindabazar', 'জিন্দাবাজার', 'amberkhana', 'আম্বরখানা', 'subidbazar', 'সুবিদবাজার', 'shahi eidgah', 'শাহ ঈদগাহ'] },
  { id: 'moulvibazar', name: 'Moulvibazar', zoneType: 'OUTSIDE_DHAKA', keywords: ['moulvibazar', 'moulvibazar', 'মৌলভীবাজার', 'sreemangal', 'শ্রীমঙ্গল'] },
  { id: 'habiganj', name: 'Habiganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['habiganj', 'হবিগঞ্জ', 'shaistaganj', 'শায়েস্তাগঞ্জ'] },
  { id: 'sunamganj', name: 'Sunamganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['sunamganj', 'সুনামগঞ্জ'] },

  { id: 'rajshahi', name: 'Rajshahi', zoneType: 'OUTSIDE_DHAKA', keywords: ['rajshahi', 'রাজশাহী', 'saheb bazar', 'সাহেব বাজার', 'motihar', 'মতিহার', 'boalia', 'বোয়ালিয়া'] },
  { id: 'bogura', name: 'Bogura', zoneType: 'OUTSIDE_DHAKA', keywords: ['bogura', 'bogra', 'বগুড়া', 'বগুরা', 'satmatha', 'সাতমাথা'] },
  { id: 'pabna', name: 'Pabna', zoneType: 'OUTSIDE_DHAKA', keywords: ['pabna', 'পাবনা', 'ishwardi', 'ঈশ্বরদী'] },
  { id: 'sirajganj', name: 'Sirajganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['sirajganj', 'সিরাজগঞ্জ'] },
  { id: 'naogaon', name: 'Naogaon', zoneType: 'OUTSIDE_DHAKA', keywords: ['naogaon', 'নওগাঁ'] },
  { id: 'natore', name: 'Natore', zoneType: 'OUTSIDE_DHAKA', keywords: ['natore', 'নাটোর'] },
  { id: 'chapainawabganj', name: 'Chapainawabganj', zoneType: 'OUTSIDE_DHAKA', keywords: ['chapainawabganj', 'চাঁপাইনবাবগঞ্জ'] },
  { id: 'joypurhat', name: 'Joypurhat', zoneType: 'OUTSIDE_DHAKA', keywords: ['joypurhat', 'জয়পুরহাট'] },

  { id: 'khulna', name: 'Khulna', zoneType: 'OUTSIDE_DHAKA', keywords: ['khulna', 'খুলনা', 'sonadanga', 'সোনাডাঙ্গা', 'daulatpur', 'দৌলতপুর', 'khalishpur', 'খালিশপুর'] },
  { id: 'jashore', name: 'Jashore', zoneType: 'OUTSIDE_DHAKA', keywords: ['jashore', 'jessore', 'যশোর', 'benapole', 'বেনাপোল'] },
  { id: 'kushtia', name: 'Kushtia', zoneType: 'OUTSIDE_DHAKA', keywords: ['kushtia', 'কুষ্টিয়া'] },
  { id: 'satkhira', name: 'Satkhira', zoneType: 'OUTSIDE_DHAKA', keywords: ['satkhira', 'সাতক্ষীরা'] },
  { id: 'bagerhat', name: 'Bagerhat', zoneType: 'OUTSIDE_DHAKA', keywords: ['bagerhat', 'বাগেরহাট', 'mongla', 'মংলা'] },
  { id: 'jhenaidah', name: 'Jhenaidah', zoneType: 'OUTSIDE_DHAKA', keywords: ['jhenaidah', 'ঝিনাইদহ'] },
  { id: 'chuadanga', name: 'Chuadanga', zoneType: 'OUTSIDE_DHAKA', keywords: ['chuadanga', 'চুয়াডাঙ্গা', 'darshana', 'দর্শনা'] },
  { id: 'magura', name: 'Magura', zoneType: 'OUTSIDE_DHAKA', keywords: ['magura', 'মাগুরা'] },
  { id: 'meherpur', name: 'Meherpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['meherpur', 'মেহেরপুর'] },
  { id: 'narail', name: 'Narail', zoneType: 'OUTSIDE_DHAKA', keywords: ['narail', 'নড়াইল'] },

  { id: 'barishal', name: 'Barishal', zoneType: 'OUTSIDE_DHAKA', keywords: ['barishal', 'barisal', 'বরিশাল', 'rupatali', 'রূপাতলী'] },
  { id: 'bhola', name: 'Bhola', zoneType: 'OUTSIDE_DHAKA', keywords: ['bhola', 'ভোলা'] },
  { id: 'patuakhali', name: 'Patuakhali', zoneType: 'OUTSIDE_DHAKA', keywords: ['patuakhali', 'পটুয়াখালী', 'kuakata', 'কুয়াকাটা'] },
  { id: 'pirojpur', name: 'Pirojpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['pirojpur', 'পিরোজপুর'] },
  { id: 'barguna', name: 'Barguna', zoneType: 'OUTSIDE_DHAKA', keywords: ['barguna', 'বরগুনা'] },
  { id: 'jhalokati', name: 'Jhalokati', zoneType: 'OUTSIDE_DHAKA', keywords: ['jhalokati', 'jhalakati', 'ঝালকাঠি'] },

  { id: 'rangpur', name: 'Rangpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['rangpur', 'রংপুর', 'payra chottor', 'পায়রা চত্বর'] },
  { id: 'dinajpur', name: 'Dinajpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['dinajpur', 'দিনাজপুর', 'hili', 'হিলি'] },
  { id: 'gaibandha', name: 'Gaibandha', zoneType: 'OUTSIDE_DHAKA', keywords: ['gaibandha', 'গাইবান্ধা'] },
  { id: 'kurigram', name: 'Kurigram', zoneType: 'OUTSIDE_DHAKA', keywords: ['kurigram', 'কুড়িগ্রাম'] },
  { id: 'lalmonirhat', name: 'Lalmonirhat', zoneType: 'OUTSIDE_DHAKA', keywords: ['lalmonirhat', 'লালমনিরহাট'] },
  { id: 'nilphamari', name: 'Nilphamari', zoneType: 'OUTSIDE_DHAKA', keywords: ['nilphamari', 'নীলফামারী', 'saidpur', 'সৈয়দপুর'] },
  { id: 'panchagarh', name: 'Panchagarh', zoneType: 'OUTSIDE_DHAKA', keywords: ['panchagarh', 'পঞ্চগড়'] },
  { id: 'thakurgaon', name: 'Thakurgaon', zoneType: 'OUTSIDE_DHAKA', keywords: ['thakurgaon', 'ঠাকুরগাঁও'] },

  { id: 'mymensingh', name: 'Mymensingh', zoneType: 'OUTSIDE_DHAKA', keywords: ['mymensingh', 'ময়মনসিংহ'] },
  { id: 'jamalpur', name: 'Jamalpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['jamalpur', 'জামালপুর'] },
  { id: 'netrokona', name: 'Netrokona', zoneType: 'OUTSIDE_DHAKA', keywords: ['netrokona', 'নেত্রকোণা', 'নেত্রকোনা'] },
  { id: 'sherpur', name: 'Sherpur', zoneType: 'OUTSIDE_DHAKA', keywords: ['sherpur', 'শেরপুর'] },

  // 2. Dhaka Suburbs
  {
    id: 'dhaka-suburbs',
    name: 'Dhaka Suburbs (Savar/Keraniganj/Ashulia)',
    zoneType: 'DHAKA_SUBURBS',
    keywords: [
      'savar', 'সাভার', 'keraniganj', 'কেরানীগঞ্জ', 'কেরানিগঞ্জ',
      'ashulia', 'আশুলিয়া', 'আশুলিয়া', 'dhamrai', 'ধামরাই',
      'hemayetpur', 'হেমায়েতপুর', 'হেমায়েতপুর', 'zirani', 'জিরানী',
      'epz savar', 'baipail', 'বাইপাইল', 'nabinagar', 'নবীনগর'
    ],
  },

  // 3. Dhaka City Metro
  {
    id: 'dhaka-city',
    name: 'Dhaka City (Metro)',
    zoneType: 'DHAKA_CITY',
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
      'shewrapara', 'শেওড়াপাড়া', 'kazipara', 'কাজীপাড়া',
      'agargaon', 'আগারগাঁও', 'kalabagan', 'বাগান', 'niketan', 'নিকেতন',
      'aftabnagar', 'আফতাবনগর', 'nikunja', 'নিকুঞ্জ', 'khilkhet', 'খিলক্ষেত',
      'cantonment', 'সেনানিবাস', 'shyamoli', 'শ্যামলী', 'kallyanpur', 'কল্যাণপুর'
    ],
  },
];

export function detectDistrictFromAddress(
  rawAddress: string,
  feeOverrides?: DeliveryFeeConfig,
): {
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

  const insideDhaka = feeOverrides?.insideDhakaFee ?? globalDeliveryFeeConfig.insideDhakaFee ?? 70;
  const outsideDhaka = feeOverrides?.outsideDhakaFee ?? globalDeliveryFeeConfig.outsideDhakaFee ?? 130;
  const suburbs = feeOverrides?.suburbsFee ?? globalDeliveryFeeConfig.suburbsFee ?? 100;

  for (const pattern of DISTRICT_PATTERNS) {
    for (const kw of pattern.keywords) {
      const lowerKw = kw.toLowerCase();
      const regex = new RegExp(`(^|[^a-zA-Z0-9\u0980-\u09FF])${lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zA-Z0-9\u0980-\u09FF]|$)`, 'i');
      if (regex.test(text) || text.includes(lowerKw)) {
        // Protect against false-positive street/business landmark names (e.g. 'Manikganj Road, Mirpur, Dhaka')
        if (pattern.zoneType === 'OUTSIDE_DHAKA') {
          const landmarkSuffixes = [
            ' road', ' রোড', ' rd', ' mor', ' মোড়', ' stand', ' স্ট্যান্ড',
            ' bus stand', ' বাস স্ট্যান্ড', ' sweets', ' সুইটস', ' plaza', ' প্লাজা',
            ' market', ' মার্কেট', ' bhaban', ' ভবন', ' lane', ' লেন', ' goli', ' গলি'
          ];
          const hasDhakaMetroDestination = [
            'mirpur', 'মিরপুর', 'uttara', 'উত্তরা', 'dhanmondi', 'ধানমন্ডি',
            'gulshan', 'গুলশান', 'banani', 'বনানী', 'mohammadpur', 'মোহাম্মদপুর',
            'farmgate', 'ফার্মগেট', 'gabtoli', 'গাবতলী', 'badda', 'বাড্ডা',
            'motijheel', 'মতিঝিল', 'bashundhara', 'বসুন্ধরা'
          ].some((token) => text.includes(token));

          const isLandmark = landmarkSuffixes.some((sfx) => text.includes(lowerKw + sfx));
          if (isLandmark && hasDhakaMetroDestination) {
            continue;
          }
        }

        const isDhakaCity = pattern.zoneType === 'DHAKA_CITY';
        const isSuburbs = pattern.zoneType === 'DHAKA_SUBURBS';

        const fee = isDhakaCity ? insideDhaka : (isSuburbs ? suburbs : outsideDhaka);

        return {
          district: pattern.name,
          zone: isDhakaCity ? 'Dhaka City' : (isSuburbs ? 'Dhaka Suburbs' : pattern.name),
          deliveryFee: fee,
          matchedKeyword: kw,
          isDhakaCity,
          isSuburbs,
        };
      }
    }
  }

  return null;
}
