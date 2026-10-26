import { Injectable } from '@nestjs/common';
import { EstimateDeliveryDto } from '../dto/shipping-estimate.dto';
import {
  FREE_SHIPPING_THRESHOLD_BDT,
  STANDARD_INSIDE_DHAKA_SHIPPING_BDT,
  STANDARD_OUTSIDE_DHAKA_SHIPPING_BDT,
} from '../../../common/constants';

export interface DeliveryEstimateResult {
  zone: 'INSIDE_DHAKA' | 'DHAKA_SUBURB' | 'OUTSIDE_DHAKA';
  zoneNameBn: string;
  zoneNameEn: string;
  destination: {
    division: string;
    district?: string;
    thana?: string;
  };
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  estimatedDeliveryDateMin: string;
  estimatedDeliveryDateMax: string;
  estimatedDeliverySummaryEn: string;
  estimatedDeliverySummaryBn: string;
  shippingFeeBdt: number;
  isFreeShippingEligible: boolean;
  freeShippingThresholdBdt: number;
  cutoffHourBst: number;
}

@Injectable()
export class ShippingEstimatorService {
  private readonly DHAKA_SUBURB_DISTRICTS = ['gazipur', 'narayanganj', 'munshiganj', 'manikganj', 'narsingdi'];
  private readonly DHAKA_SUBURB_THANAS = ['savar', 'keraniganj', 'dhamrai', 'ashulia', 'tongui', 'tongi'];

  /**
   * Calculates dynamic delivery timeline and shipping fees by destination zone in Bangladesh.
   */
  estimateDelivery(dto: EstimateDeliveryDto): DeliveryEstimateResult {
    const div = dto.division.toLowerCase().trim();
    const dist = (dto.district || '').toLowerCase().trim();
    const thana = (dto.thana || '').toLowerCase().trim();
    const orderAmount = dto.orderAmountBdt || 0;

    let zone: 'INSIDE_DHAKA' | 'DHAKA_SUBURB' | 'OUTSIDE_DHAKA' = 'OUTSIDE_DHAKA';
    let zoneNameEn = 'Outside Dhaka Division (Nationwide)';
    let zoneNameBn = 'ঢাকার বাইরে (সারা দেশ)';
    let baseShippingFee = STANDARD_OUTSIDE_DHAKA_SHIPPING_BDT; // ৳120
    let minDays = 3;
    let maxDays = 5;

    if (div === 'dhaka') {
      if (
        this.DHAKA_SUBURB_DISTRICTS.includes(dist) ||
        this.DHAKA_SUBURB_THANAS.includes(thana)
      ) {
        zone = 'DHAKA_SUBURB';
        zoneNameEn = 'Dhaka Suburbs / Adjacent Areas';
        zoneNameBn = 'ঢাকা উপশহর ও পার্শ্ববর্তী এলাকা';
        baseShippingFee = 100.0;
        minDays = 2;
        maxDays = 3;
      } else if (dist === 'dhaka' || !dist) {
        zone = 'INSIDE_DHAKA';
        zoneNameEn = 'Inside Dhaka Metro';
        zoneNameBn = 'ঢাকা মেট্রো এলাকা';
        baseShippingFee = STANDARD_INSIDE_DHAKA_SHIPPING_BDT; // ৳60
        minDays = 1;
        maxDays = 2;
      } else {
        zone = 'DHAKA_SUBURB';
        zoneNameEn = 'Dhaka Division (District Headquarters)';
        zoneNameBn = 'ঢাকা বিভাগ (জেলা সদর)';
        baseShippingFee = 100.0;
        minDays = 2;
        maxDays = 3;
      }
    }

    const isFreeShippingEligible = orderAmount >= FREE_SHIPPING_THRESHOLD_BDT;
    const finalShippingFee = isFreeShippingEligible ? 0 : baseShippingFee;

    const now = new Date();
    // BST timezone offset (UTC+6)
    const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

    const summaryEn = minDays === 1
      ? `Express Delivery: 24-48 Hours (${minDays} to ${maxDays} business days)`
      : `Standard Nationwide Courier: ${minDays} to ${maxDays} business days`;

    const summaryBn = minDays === 1
      ? `এক্সপ্রেস ডেলিভারি: ২৪-৪৮ ঘণ্টা (${minDays}-${maxDays} কর্মদিবস)`
      : `কুরিয়ার ডেলিভারি: ${minDays}-${maxDays} কর্মদিবসের মধ্যে`;

    return {
      zone,
      zoneNameEn,
      zoneNameBn,
      destination: {
        division: dto.division,
        district: dto.district,
        thana: dto.thana,
      },
      estimatedDeliveryDaysMin: minDays,
      estimatedDeliveryDaysMax: maxDays,
      estimatedDeliveryDateMin: minDate.toISOString(),
      estimatedDeliveryDateMax: maxDate.toISOString(),
      estimatedDeliverySummaryEn: summaryEn,
      estimatedDeliverySummaryBn: summaryBn,
      shippingFeeBdt: finalShippingFee,
      isFreeShippingEligible,
      freeShippingThresholdBdt: FREE_SHIPPING_THRESHOLD_BDT,
      cutoffHourBst: 14, // 2:00 PM BST cutoff
    };
  }
}
