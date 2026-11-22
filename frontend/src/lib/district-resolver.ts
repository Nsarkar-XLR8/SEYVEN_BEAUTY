/**
 * Universal Intelligent Bangladesh District Resolver for Storefront Checkout.
 */

interface DistrictPattern {
  id: string;
  name: string;
  fee: number;
  keywords: string[];
}

const DISTRICT_PATTERNS: DistrictPattern[] = [
  // 1. All Non-Dhaka 63 Districts
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

  // 2. Dhaka Suburbs
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

  // 3. Dhaka City Metro
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
      'shewrapara', 'শেওড়াপাড়া', 'kazipara', 'কাজীপাড়া',
      'agargaon', 'আগারগাঁও', 'kalabagan', 'বাগান', 'niketan', 'নিকেতন',
      'aftabnagar', 'আফতাবনগর', 'nikunja', 'নিকুঞ্জ', 'khilkhet', 'খিলক্ষেত',
      'cantonment', 'সেনানিবাস', 'shyamoli', 'শ্যামলী', 'kallyanpur', 'কল্যাণপুর'
    ],
  },
];

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
