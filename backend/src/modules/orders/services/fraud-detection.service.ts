import { Injectable, Logger } from '@nestjs/common';

export interface FraudAnalysisInput {
  customerPhone: string;
  customerName: string;
  shippingAddress: string;
  district?: string;
  zone?: string;
  totalAmount?: number;
  paymentMethod?: string;
  clientIp?: string;
  userAgent?: string;
}

export interface FraudAnalysisResult {
  riskScore: number;
  riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  reasons: string[];
  clientIp: string;
  ipCity?: string;
  ipRegion?: string;
  ipCountry?: string;
  ipIsp?: string;
  ipCoordinates?: [number, number];
  ipMapsUrl?: string;
  addressMapsUrl: string;
  isLocationMismatch: boolean;
  isSuspiciousPhone: boolean;
  isGibberishAddress: boolean;
  analyzedAt: string;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  /**
   * Evaluates order risk, IP geolocation, and address consistency.
   * Completely fail-safe: wraps all logic in try-catch and will never throw.
   */
  async analyzeOrder(input: FraudAnalysisInput): Promise<FraudAnalysisResult> {
    const reasons: string[] = [];
    let score = 0;
    let isSuspiciousPhone = false;
    let isGibberishAddress = false;
    let isLocationMismatch = false;

    const rawAddress = (input.shippingAddress || '').trim();
    const rawPhone = (input.customerPhone || '').trim();
    const rawName = (input.customerName || '').trim();
    const cleanIp = (input.clientIp || '').trim();

    // 1. Phone Number Analysis (Bangladesh 11-digit mobile standard)
    const normalizedPhone = rawPhone.replace(/\D/g, '').replace(/^88/, '');
    const isValidBdMobile = /^01[3-9]\d{8}$/.test(normalizedPhone);

    if (!isValidBdMobile) {
      score += 45;
      isSuspiciousPhone = true;
      reasons.push('Invalid Bangladeshi mobile operator pattern (must be 013-019, 11 digits)');
    } else {
      // Check for dummy/mock phone number sequences
      const dummyPatterns = [
        /^01[3-9]0000000$/, // e.g. 01700000000
        /^0123456789\d?$/,  // sequential
        /^0198765432\d?$/,  // reverse sequential
      ];

      const isDummy = dummyPatterns.some((pattern) => pattern.test(normalizedPhone));
      // Repeated identical digit check (e.g. 01711111111)
      const isRepeatedDigits = /^01[3-9](\d)\1{7}$/.test(normalizedPhone);

      if (isDummy || isRepeatedDigits) {
        score += 50;
        isSuspiciousPhone = true;
        reasons.push('Dummy, test, or repetitive phone number detected');
      }
    }

    // 2. Shipping Address Completeness & Gibberish Detection
    if (rawAddress.length < 10) {
      score += 35;
      isGibberishAddress = true;
      reasons.push(`Delivery address is too short (${rawAddress.length} chars) - lacking house/road/area detail`);
    } else {
      // Repeated character spam (e.g. "aaaaaaa", "asdfasdf")
      const hasRepeatedChars = /(.)\1{4,}/i.test(rawAddress);
      const isTestWord = /\b(test|fake|asdf|qwerty|xyz|none|null)\b/i.test(rawAddress);

      if (hasRepeatedChars || isTestWord) {
        score += 35;
        isGibberishAddress = true;
        reasons.push('Suspicious or repeated placeholder characters found in address');
      }
    }

    // 3. Customer Name Integrity
    if (rawName.length < 3) {
      score += 20;
      reasons.push('Customer name is unusually short');
    } else if (/\b(test|fake|admin|asdf|client|random)\b/i.test(rawName)) {
      score += 25;
      reasons.push('Customer name contains test or placeholder keyword');
    }

    // 4. High-Value COD (Cash on Delivery) Risk Threshold
    const totalAmount = Number(input.totalAmount || 0);
    const isCod = (input.paymentMethod || 'COD').toUpperCase() === 'COD';
    if (isCod && totalAmount >= 8000) {
      score += 15;
      reasons.push(`High-value COD parcel (৳${totalAmount.toLocaleString('en-BD')}) - phone confirmation advised`);
    }

    // 5. IP Geolocation & Network Resolution (100% Free via ip-api with timeout)
    let ipCity: string | undefined;
    let ipRegion: string | undefined;
    let ipCountry: string | undefined;
    let ipIsp: string | undefined;
    let ipCoordinates: [number, number] | undefined;
    let ipMapsUrl: string | undefined;

    // Build Clean Address Google Maps URL
    const cleanAddrForMap = rawAddress
      .replace(/[#&/\\;:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let resolvedDistrict = (input.district || '').trim();
    if (resolvedDistrict === 'Inside Dhaka' || rawAddress.toLowerCase().includes('dhaka')) {
      resolvedDistrict = 'Dhaka';
    } else if (resolvedDistrict === 'Outside Dhaka') {
      resolvedDistrict = '';
    }

    const mapQueryParts = [cleanAddrForMap, resolvedDistrict, 'Bangladesh'].filter(Boolean);
    const addressSearchQuery = encodeURIComponent(mapQueryParts.join(', '));
    const addressMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressSearchQuery}`;

    // Clean client IP (strip ports, proxies)
    let sanitizedIp = cleanIp.split(',')[0].trim();
    if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(sanitizedIp)) {
      sanitizedIp = sanitizedIp.split(':')[0];
    }

    // Skip private / loopback IPs (e.g. 127.0.0.1, ::1, 10.x, 192.168.x)
    const isPrivateIp =
      !sanitizedIp ||
      sanitizedIp === '::1' ||
      sanitizedIp.startsWith('127.') ||
      sanitizedIp.startsWith('10.') ||
      sanitizedIp.startsWith('192.168.') ||
      sanitizedIp.startsWith('172.16.') ||
      sanitizedIp.startsWith('fe80:');

    if (isPrivateIp) {
      ipCountry = 'Internal / Local Network';
      ipCity = 'Local Network';
    } else {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${sanitizedIp}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp`,
          { signal: AbortSignal.timeout(2500) },
        );

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.status === 'success') {
            ipCity = geoData.city;
            ipRegion = geoData.regionName;
            ipCountry = geoData.country;
            ipIsp = geoData.isp;

            if (typeof geoData.lat === 'number' && typeof geoData.lon === 'number') {
              ipCoordinates = [geoData.lat, geoData.lon];
              // Universal Free Google Maps Pinpoint Link
              ipMapsUrl = `https://www.google.com/maps?q=${geoData.lat},${geoData.lon}`;
            }

            // Flag Foreign IP / VPN
            if (geoData.countryCode && geoData.countryCode !== 'BD') {
              score += 35;
              reasons.push(`Order originated from Foreign IP / VPN (${geoData.country})`);
            }

            // Location Mismatch Detection: Delivery District vs IP City
            const normalizedDistrict = (resolvedDistrict || input.district || '').toLowerCase();
            const normalizedCity = (geoData.city || '').toLowerCase();
            const normalizedRegion = (geoData.regionName || '').toLowerCase();

            if (
              normalizedDistrict &&
              normalizedCity &&
              !normalizedDistrict.includes(normalizedCity) &&
              !normalizedCity.includes(normalizedDistrict) &&
              !normalizedRegion.includes(normalizedDistrict)
            ) {
              const majorDistricts = ['dhaka', 'chittagong', 'chattogram', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur', 'mymensingh', 'cumilla', 'comilla'];
              const isMajorDistrictDelivery = majorDistricts.some((d) => normalizedDistrict.includes(d));
              const isMajorDistrictIp = majorDistricts.some((d) => normalizedCity.includes(d));

              if (isMajorDistrictDelivery && isMajorDistrictIp && !normalizedCity.includes(normalizedDistrict)) {
                score += 25;
                isLocationMismatch = true;
                reasons.push(
                  `Location Mismatch: Delivery stated in "${resolvedDistrict || input.district}", but device network is in "${geoData.city}" (${geoData.isp || 'Broadband'})`,
                );
              }
            }
          }
        }
      } catch (geoErr: any) {
        this.logger.debug(`IP Geo lookup skipped or timed out: ${geoErr?.message || geoErr}`);
      }
    }

    // 6. Calculate Final Risk Level
    const finalScore = Math.min(100, Math.max(0, score));
    let riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' = 'LOW_RISK';

    if (finalScore >= 70) {
      riskLevel = 'HIGH_RISK';
    } else if (finalScore >= 30) {
      riskLevel = 'MEDIUM_RISK';
    }

    return {
      riskScore: finalScore,
      riskLevel,
      reasons,
      clientIp: cleanIp,
      ipCity,
      ipRegion,
      ipCountry,
      ipIsp,
      ipCoordinates,
      ipMapsUrl,
      addressMapsUrl,
      isLocationMismatch,
      isSuspiciousPhone,
      isGibberishAddress,
      analyzedAt: new Date().toISOString(),
    };
  }
}
