import { Injectable, Logger, Optional } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service';
import { PathaoApiClient } from './pathao-api.client';
import { SettingsService } from '../../settings/settings.service';
import {
  detectDistrictFromAddress,
  getGlobalDeliveryFeeConfig,
  updateGlobalDeliveryFeeConfig,
  ZoneType,
} from '../../../common/utils/district-resolver.util';

export interface DistrictGeoData {
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  zoneType: ZoneType;
  deliveryFee: number;
  pathaoCityId: number;
}

export const BD_OFFICIAL_DISTRICTS_GEO: Array<{
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  zoneType: ZoneType;
  pathaoCityId: number;
}> = [
  // Dhaka Division
  { id: 'dhaka-city', nameEn: 'Dhaka City (Metro)', nameBn: 'ঢাকা সিটি', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'DHAKA_CITY', pathaoCityId: 1 },
  { id: 'dhaka-suburbs', nameEn: 'Dhaka Suburbs (Savar/Keraniganj/Ashulia)', nameBn: 'ঢাকা উপশহর (সাভার/কেরানীগঞ্জ/আশুলিয়া)', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'DHAKA_SUBURBS', pathaoCityId: 1 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 17 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 48 },
  { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 49 },
  { id: 'tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 64 },
  { id: 'manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 50 },
  { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 44 },
  { id: 'faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 14 },
  { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 19 },
  { id: 'madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 41 },
  { id: 'rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 57 },
  { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 60 },
  { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 35 },

  // Chattogram Division
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 2 },
  { id: 'coxs-bazar', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 9 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 11 },
  { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 16 },
  { id: 'noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 51 },
  { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 6 },
  { id: 'chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 8 },
  { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 40 },
  { id: 'bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 3 },
  { id: 'rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 59 },
  { id: 'khagrachhari', nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 33 },

  // Sylhet Division
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', division: 'Sylhet', divisionBn: 'সিলেট', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 61 },
  { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', division: 'Sylhet', divisionBn: 'সিলেট', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 45 },
  { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', division: 'Sylhet', divisionBn: 'সিলেট', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 21 },
  { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', division: 'Sylhet', divisionBn: 'সিলেট', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 62 },

  // Rajshahi Division
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 58 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 5 },
  { id: 'pabna', nameEn: 'Pabna', nameBn: 'পাবনা', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 52 },
  { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 63 },
  { id: 'naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 47 },
  { id: 'natore', nameEn: 'Natore', nameBn: 'নাটোর', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 46 },
  { id: 'chapainawabganj', nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 7 },
  { id: 'joypurhat', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', division: 'Rajshahi', divisionBn: 'রাজশাহী', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 30 },

  // Khulna Division
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 34 },
  { id: 'jashore', nameEn: 'Jashore', nameBn: 'যশোর', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 28 },
  { id: 'kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 39 },
  { id: 'satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 56 },
  { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 4 },
  { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 29 },
  { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 10 },
  { id: 'magura', nameEn: 'Magura', nameBn: 'মাগুরা', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 42 },
  { id: 'meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 43 },
  { id: 'narail', nameEn: 'Narail', nameBn: 'নড়াইল', division: 'Khulna', divisionBn: 'খুলনা', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 53 },

  // Barishal Division
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', division: 'Barishal', divisionBn: 'বরিশাল', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 54 },
  { id: 'bhola', nameEn: 'Bhola', nameBn: 'ভোলা', division: 'Barishal', divisionBn: 'বরিশাল', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 15 },
  { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', division: 'Barishal', divisionBn: 'বরিশাল', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 55 },
  { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', division: 'Barishal', divisionBn: 'বরিশাল', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 56 },
  { id: 'barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', division: 'Barishal', divisionBn: 'বরিশাল', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 13 },
  { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', division: 'Barishal', divisionBn: 'বরিশাল', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 27 },

  // Rangpur Division
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 65 },
  { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 12 },
  { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 18 },
  { id: 'kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 38 },
  { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 37 },
  { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 50 },
  { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 53 },
  { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', division: 'Rangpur', divisionBn: 'রংপুর', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 66 },

  // Mymensingh Division
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 46 },
  { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 26 },
  { id: 'netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 49 },
  { id: 'sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', zoneType: 'OUTSIDE_DHAKA', pathaoCityId: 61 },
];

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly pathaoApiClient: PathaoApiClient,
    @Optional() private readonly settingsService?: SettingsService,
  ) {}

  /**
   * Return dynamic delivery fees based on active Platform Settings
   */
  getLiveDeliveryFees(): { insideDhakaFee: number; outsideDhakaFee: number; suburbsFee: number } {
    const settings = this.settingsService?.getSettings();
    const globalConfig = getGlobalDeliveryFeeConfig();

    return {
      insideDhakaFee: Number(settings?.standardDeliveryDhakaBdt) || globalConfig.insideDhakaFee || 70,
      outsideDhakaFee: Number(settings?.standardDeliveryOutsideBdt) || globalConfig.outsideDhakaFee || 130,
      suburbsFee: globalConfig.suburbsFee || 100,
    };
  }

  /**
   * Return all 64 official Bangladesh districts with their live dynamic delivery fee
   */
  async getAllDistricts(): Promise<DistrictGeoData[]> {
    const { insideDhakaFee, outsideDhakaFee, suburbsFee } = this.getLiveDeliveryFees();

    return BD_OFFICIAL_DISTRICTS_GEO.map((d) => {
      let fee = outsideDhakaFee;
      if (d.zoneType === 'DHAKA_CITY') fee = insideDhakaFee;
      else if (d.zoneType === 'DHAKA_SUBURBS') fee = suburbsFee;

      return {
        id: d.id,
        nameEn: d.nameEn,
        nameBn: d.nameBn,
        division: d.division,
        divisionBn: d.divisionBn,
        zoneType: d.zoneType,
        deliveryFee: fee,
        pathaoCityId: d.pathaoCityId,
      };
    });
  }

  /**
   * Return zones/upazilas for a district or city ID (cached in Redis from Pathao)
   */
  async getZonesForDistrict(districtIdentifier: string | number): Promise<any[]> {
    let cityId: number | null = null;

    if (typeof districtIdentifier === 'number') {
      cityId = districtIdentifier;
    } else {
      const match = BD_OFFICIAL_DISTRICTS_GEO.find(
        (d) =>
          d.id === districtIdentifier ||
          d.nameEn.toLowerCase() === districtIdentifier.toLowerCase() ||
          d.nameBn === districtIdentifier,
      );
      if (match) cityId = match.pathaoCityId;
    }

    if (!cityId) {
      cityId = 1; // Default to Dhaka city zones if unspecified
    }

    const cacheKey = `cache:logistics:zones:${cityId}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    try {
      const response = await this.pathaoApiClient.getZones(cityId);
      const zones = response?.data?.data || response?.data || [];
      if (Array.isArray(zones) && zones.length > 0) {
        try {
          await this.redisService.set(cacheKey, JSON.stringify(zones), 7 * 24 * 3600);
        } catch {}
        return zones;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch live zones for city ${cityId}: ${err.message}`);
    }

    // Default fallback zone
    return [{ zone_id: 1, zone_name: 'Central Sadar' }];
  }

  /**
   * Dynamic contextual address resolver with false-positive landmark elimination
   */
  resolveAddress(rawAddress: string) {
    const fees = this.getLiveDeliveryFees();
    const resolved = detectDistrictFromAddress(rawAddress, fees);

    if (!resolved) {
      return {
        district: 'Dhaka City',
        zone: 'Dhaka City',
        deliveryFee: fees.insideDhakaFee,
        isDhakaCity: true,
        isSuburbs: false,
        pathaoCityId: 1,
        pathaoZoneId: null,
      };
    }

    const matchedGeo = BD_OFFICIAL_DISTRICTS_GEO.find(
      (d) =>
        d.nameEn.toLowerCase() === resolved.district.toLowerCase() ||
        d.id === resolved.district.toLowerCase() ||
        resolved.district.toLowerCase().includes(d.id),
    );

    return {
      district: resolved.district,
      zone: resolved.zone,
      deliveryFee: resolved.deliveryFee,
      matchedKeyword: resolved.matchedKeyword,
      isDhakaCity: resolved.isDhakaCity,
      isSuburbs: resolved.isSuburbs,
      pathaoCityId: matchedGeo?.pathaoCityId || (resolved.isDhakaCity ? 1 : 1),
      pathaoZoneId: null,
    };
  }
}
