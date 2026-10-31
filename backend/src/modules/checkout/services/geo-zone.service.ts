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
      nameBn: '',
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
      nameBn: '',
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
      nameBn: '',
      districts: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
    },
    {
      nameEn: 'Rajshahi',
      nameBn: '',
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
      nameBn: '',
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
      nameBn: '',
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
      nameBn: '',
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
      nameBn: '',
      districts: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
    },
  ];

  private readonly DISTRICT_THANAS: Record<string, GeoThana[]> = {
    Dhaka: [
      { nameEn: 'Dhanmondi', nameBn: '', courierZoneId: 1, postCode: '1209' },
      { nameEn: 'Gulshan', nameBn: '', courierZoneId: 1, postCode: '1212' },
      { nameEn: 'Banani', nameBn: '', courierZoneId: 1, postCode: '1213' },
      { nameEn: 'Uttara', nameBn: '', courierZoneId: 1, postCode: '1230' },
      { nameEn: 'Mirpur', nameBn: '', courierZoneId: 1, postCode: '1216' },
      { nameEn: 'Mohammadpur', nameBn: '', courierZoneId: 1, postCode: '1207' },
      { nameEn: 'Badda', nameBn: '', courierZoneId: 1, postCode: '1212' },
      { nameEn: 'Bashundhara R/A', nameBn: '', courierZoneId: 1, postCode: '1229' },
      { nameEn: 'Motijheel', nameBn: '', courierZoneId: 1, postCode: '1000' },
      { nameEn: 'Old Dhaka', nameBn: '', courierZoneId: 1, postCode: '1100' },
      { nameEn: 'Savar', nameBn: '', courierZoneId: 2, postCode: '1340' },
      { nameEn: 'Keraniganj', nameBn: '', courierZoneId: 2, postCode: '1310' },
      { nameEn: 'Dhamrai', nameBn: '', courierZoneId: 2, postCode: '1350' },
    ],
    Gazipur: [
      { nameEn: 'Gazipur Sadar', nameBn: '', courierZoneId: 2, postCode: '1700' },
      { nameEn: 'Tongi', nameBn: '', courierZoneId: 2, postCode: '1710' },
      { nameEn: 'Kaliakair', nameBn: '', courierZoneId: 3, postCode: '1750' },
    ],
    Narayanganj: [
      { nameEn: 'Narayanganj Sadar', nameBn: '', courierZoneId: 2, postCode: '1400' },
      { nameEn: 'Fatullah', nameBn: '', courierZoneId: 2, postCode: '1420' },
      { nameEn: 'Siddhirganj', nameBn: '', courierZoneId: 2, postCode: '1430' },
    ],
    Chittagong: [
      { nameEn: 'Kotwali', nameBn: '', courierZoneId: 3, postCode: '4000' },
      { nameEn: 'Panchlaish', nameBn: '', courierZoneId: 3, postCode: '4203' },
      { nameEn: 'Agrabad', nameBn: '', courierZoneId: 3, postCode: '4100' },
      { nameEn: 'Halishahar', nameBn: '', courierZoneId: 3, postCode: '4216' },
      { nameEn: 'Nasirabad', nameBn: '', courierZoneId: 3, postCode: '4209' },
    ],
    Sylhet: [
      { nameEn: 'Sylhet Sadar', nameBn: '', courierZoneId: 3, postCode: '3100' },
      { nameEn: 'Zindabazar', nameBn: '', courierZoneId: 3, postCode: '3100' },
      { nameEn: 'Amberkhana', nameBn: '', courierZoneId: 3, postCode: '3100' },
    ],
    Rajshahi: [
      { nameEn: 'Boalia', nameBn: '', courierZoneId: 3, postCode: '6000' },
      { nameEn: 'Motihar', nameBn: '', courierZoneId: 3, postCode: '6205' },
    ],
    Khulna: [
      { nameEn: 'Khulna Sadar', nameBn: '', courierZoneId: 3, postCode: '9100' },
      { nameEn: 'Sonadanga', nameBn: '', courierZoneId: 3, postCode: '9000' },
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
        nameBn: '',
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
          zoneNameBn: '',
          baseFee: 100,
          estimatedDays: '24-48 Hours',
          estimatedDaysBn: '',
        };
      }
      return {
        courierZoneId: 1,
        zoneName: 'Inside Dhaka Metropolitan',
        zoneNameBn: '',
        baseFee: 80,
        estimatedDays: '12-24 Hours (Next Day)',
        estimatedDaysBn: '',
      };
    }

    // Dhaka Suburbs (Zone 2)
    if (distLower === 'gazipur' || distLower === 'narayanganj') {
      return {
        courierZoneId: 2,
        zoneName: 'Dhaka Suburbs & Neighboring Districts',
        zoneNameBn: '',
        baseFee: 100,
        estimatedDays: '24-48 Hours',
        estimatedDaysBn: '',
      };
    }

    // Outside Dhaka (Zone 3)
    return {
      courierZoneId: 3,
      zoneName: 'Outside Dhaka (Nationwide)',
      zoneNameBn: '',
      baseFee: 120,
      estimatedDays: '48-72 Hours',
      estimatedDaysBn: '',
    };
  }
}
