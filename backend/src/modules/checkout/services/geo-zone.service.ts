import { Injectable } from '@nestjs/common';
import {
  GeoDistrict,
  GeoDivision,
  GeoThana,
} from '../interfaces/checkout.interface';

@Injectable()
export class GeoZoneService {
  private readonly DIVISIONS: GeoDivision[] = [
    {
      nameEn: 'Dhaka',
      nameBn: 'ঢাকা',
      districts: [
        'Dhaka',
        'Gazipur',
        'Narayanganj',
        'Tangail',
        'Narsingdi',
        'Manikganj',
        'Munshiganj',
        'Faridpur',
        'Gopalganj',
        'Madaripur',
        'Rajbari',
        'Shariatpur',
        'Kishoreganj',
      ],
    },
    {
      nameEn: 'Chittagong',
      nameBn: 'চট্টগ্রাম',
      districts: [
        'Chittagong',
        'Cox\'s Bazar',
        'Cumilla',
        'Feni',
        'Noakhali',
        'Brahmanbaria',
        'Chandpur',
        'Lakshmipur',
        'Bandarban',
        'Rangamati',
        'Khagrachhari',
      ],
    },
    {
      nameEn: 'Sylhet',
      nameBn: 'সিলেট',
      districts: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
    },
    {
      nameEn: 'Rajshahi',
      nameBn: 'রাজশাহী',
      districts: [
        'Rajshahi',
        'Bogra',
        'Pabna',
        'Sirajganj',
        'Naogaon',
        'Natore',
        'Chapai Nawabganj',
        'Joypurhat',
      ],
    },
    {
      nameEn: 'Khulna',
      nameBn: 'খুলনা',
      districts: [
        'Khulna',
        'Jashore',
        'Kushtia',
        'Satkhira',
        'Bagerhat',
        'Jhenaidah',
        'Chuadanga',
        'Magura',
        'Meherpur',
        'Narail',
      ],
    },
    {
      nameEn: 'Barisal',
      nameBn: 'বরিশাল',
      districts: [
        'Barisal',
        'Bhola',
        'Patuakhali',
        'Pirojpur',
        'Barguna',
        'Jhalokati',
      ],
    },
    {
      nameEn: 'Rangpur',
      nameBn: 'রংপুর',
      districts: [
        'Rangpur',
        'Dinajpur',
        'Gaibandha',
        'Kurigram',
        'Lalmonirhat',
        'Nilphamari',
        'Panchagarh',
        'Thakurgaon',
      ],
    },
    {
      nameEn: 'Mymensingh',
      nameBn: 'ময়মনসিংহ',
      districts: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
    },
  ];

  private readonly DISTRICT_THANAS: Record<string, GeoThana[]> = {
    Dhaka: [
      { nameEn: 'Dhanmondi', nameBn: 'ধানমন্ডি', courierZoneId: 1, postCode: '1209' },
      { nameEn: 'Gulshan', nameBn: 'গুলশান', courierZoneId: 1, postCode: '1212' },
      { nameEn: 'Banani', nameBn: 'বনানী', courierZoneId: 1, postCode: '1213' },
      { nameEn: 'Uttara', nameBn: 'উত্তরা', courierZoneId: 1, postCode: '1230' },
      { nameEn: 'Mirpur', nameBn: 'মিরপুর', courierZoneId: 1, postCode: '1216' },
      { nameEn: 'Mohammadpur', nameBn: 'মোহাম্মদপুর', courierZoneId: 1, postCode: '1207' },
      { nameEn: 'Badda', nameBn: 'বাড্ডা', courierZoneId: 1, postCode: '1212' },
      { nameEn: 'Bashundhara R/A', nameBn: 'বসুন্ধরা আ/এ', courierZoneId: 1, postCode: '1229' },
      { nameEn: 'Motijheel', nameBn: 'মতিঝিল', courierZoneId: 1, postCode: '1000' },
      { nameEn: 'Old Dhaka', nameBn: 'পুরান ঢাকা', courierZoneId: 1, postCode: '1100' },
      { nameEn: 'Savar', nameBn: 'সাভার', courierZoneId: 2, postCode: '1340' },
      { nameEn: 'Keraniganj', nameBn: 'কেরানীগঞ্জ', courierZoneId: 2, postCode: '1310' },
      { nameEn: 'Dhamrai', nameBn: 'ধামরাই', courierZoneId: 2, postCode: '1350' },
    ],
    Gazipur: [
      { nameEn: 'Gazipur Sadar', nameBn: 'গাজীপুর সদর', courierZoneId: 2, postCode: '1700' },
      { nameEn: 'Tongi', nameBn: 'টঙ্গী', courierZoneId: 2, postCode: '1710' },
      { nameEn: 'Kaliakair', nameBn: 'কালিয়াকৈর', courierZoneId: 3, postCode: '1750' },
    ],
    Narayanganj: [
      { nameEn: 'Narayanganj Sadar', nameBn: 'নারায়ণগঞ্জ সদর', courierZoneId: 2, postCode: '1400' },
      { nameEn: 'Fatullah', nameBn: 'ফতুল্লা', courierZoneId: 2, postCode: '1420' },
      { nameEn: 'Siddhirganj', nameBn: 'সিদ্ধিরগঞ্জ', courierZoneId: 2, postCode: '1430' },
    ],
    Chittagong: [
      { nameEn: 'Kotwali', nameBn: 'কোতোয়ালী', courierZoneId: 3, postCode: '4000' },
      { nameEn: 'Panchlaish', nameBn: 'পাঁচলাইশ', courierZoneId: 3, postCode: '4203' },
      { nameEn: 'Agrabad', nameBn: 'আগ্রাবাদ', courierZoneId: 3, postCode: '4100' },
      { nameEn: 'Halishahar', nameBn: 'হালিশহর', courierZoneId: 3, postCode: '4216' },
      { nameEn: 'Nasirabad', nameBn: 'নাসিরাবাদ', courierZoneId: 3, postCode: '4209' },
    ],
    Sylhet: [
      { nameEn: 'Sylhet Sadar', nameBn: 'সিলেট সদর', courierZoneId: 3, postCode: '3100' },
      { nameEn: 'Zindabazar', nameBn: 'জিন্দাবাজার', courierZoneId: 3, postCode: '3100' },
      { nameEn: 'Amberkhana', nameBn: 'আম্বরখানা', courierZoneId: 3, postCode: '3100' },
    ],
    Rajshahi: [
      { nameEn: 'Boalia', nameBn: 'বোয়ালিয়া', courierZoneId: 3, postCode: '6000' },
      { nameEn: 'Motihar', nameBn: 'মতিহার', courierZoneId: 3, postCode: '6205' },
    ],
    Khulna: [
      { nameEn: 'Khulna Sadar', nameBn: 'খুলনা সদর', courierZoneId: 3, postCode: '9100' },
      { nameEn: 'Sonadanga', nameBn: 'সোনাডাঙ্গা', courierZoneId: 3, postCode: '9000' },
    ],
  };

  /**
   * Get all geographic divisions with their respective district lists.
   */
  getAllDivisions(): GeoDivision[] {
    return this.DIVISIONS;
  }

  /**
   * Get thana list for a specific district.
   */
  getThanasForDistrict(districtName: string): GeoThana[] {
    const matched = Object.keys(this.DISTRICT_THANAS).find(
      (k) => k.toLowerCase() === districtName.trim().toLowerCase(),
    );

    if (matched && this.DISTRICT_THANAS[matched]) {
      return this.DISTRICT_THANAS[matched];
    }

    // Fallback default thana for any unlisted district
    return [
      {
        nameEn: `${districtName} Sadar`,
        nameBn: `${districtName} সদর`,
        courierZoneId: 3,
        postCode: '0000',
      },
    ];
  }

  /**
   * Resolve courier zone and delivery rate for a given destination.
   */
  resolveCourierZone(
    division?: string,
    district?: string,
    thana?: string,
  ): {
    courierZoneId: number;
    zoneName: string;
    zoneNameBn: string;
    baseFee: number;
    estimatedDays: string;
    estimatedDaysBn: string;
  } {
    const distLower = (district || 'dhaka').trim().toLowerCase();
    const thanaLower = (thana || '').trim().toLowerCase();

    // Check Dhaka Metropolitan (Zone 1)
    if (distLower === 'dhaka') {
      const suburbanThanas = ['savar', 'keraniganj', 'dhamrai', 'dohar', 'nawabganj'];
      if (suburbanThanas.includes(thanaLower)) {
        return {
          courierZoneId: 2,
          zoneName: 'Dhaka Suburbs',
          zoneNameBn: 'ঢাকা উপশহর',
          baseFee: 100,
          estimatedDays: '24-48 Hours',
          estimatedDaysBn: '২৪-৪৮ ঘণ্টা',
        };
      }
      return {
        courierZoneId: 1,
        zoneName: 'Inside Dhaka Metropolitan',
        zoneNameBn: 'ঢাকা মেট্রোপলিটন',
        baseFee: 80,
        estimatedDays: '12-24 Hours (Next Day)',
        estimatedDaysBn: '১২-২৪ ঘণ্টা (পরের দিন)',
      };
    }

    // Dhaka Suburbs (Zone 2)
    if (distLower === 'gazipur' || distLower === 'narayanganj') {
      return {
        courierZoneId: 2,
        zoneName: 'Dhaka Suburbs & Neighboring Districts',
        zoneNameBn: 'ঢাকা সংলগ্ন জেলা',
        baseFee: 100,
        estimatedDays: '24-48 Hours',
        estimatedDaysBn: '২৪-৪৮ ঘণ্টা',
      };
    }

    // Outside Dhaka (Zone 3)
    return {
      courierZoneId: 3,
      zoneName: 'Outside Dhaka (Nationwide)',
      zoneNameBn: 'ঢাকার বাইরে (সারাদেশ)',
      baseFee: 120,
      estimatedDays: '48-72 Hours',
      estimatedDaysBn: '৪৮-৭২ ঘণ্টা',
    };
  }
}
