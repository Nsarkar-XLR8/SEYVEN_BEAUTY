import { ShippingEstimatorService } from './shipping-estimator.service';

describe('ShippingEstimatorService', () => {
  let service: ShippingEstimatorService;

  beforeEach(() => {
    service = new ShippingEstimatorService();
  });

  it('should estimate express 24-48h delivery inside Dhaka with standard 60 BDT fee', () => {
    const estimate = service.estimateDelivery({
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Gulshan',
    });

    expect(estimate.zone).toBe('INSIDE_DHAKA');
    expect(estimate.estimatedDeliveryDaysMin).toBe(1);
    expect(estimate.estimatedDeliveryDaysMax).toBe(2);
    expect(estimate.shippingFeeBdt).toBe(60.0);
    expect(estimate.isFreeShippingEligible).toBe(false);
  });

  it('should apply free delivery when order amount meets 2000 BDT threshold', () => {
    const estimate = service.estimateDelivery({
      division: 'Dhaka',
      district: 'Dhaka',
      orderAmountBdt: 2500,
    });

    expect(estimate.shippingFeeBdt).toBe(0);
    expect(estimate.isFreeShippingEligible).toBe(true);
  });

  it('should calculate 48-72h delivery for Dhaka suburbs with 100 BDT fee', () => {
    const estimate = service.estimateDelivery({
      division: 'Dhaka',
      district: 'Gazipur',
      thana: 'Tongi',
    });

    expect(estimate.zone).toBe('DHAKA_SUBURB');
    expect(estimate.estimatedDeliveryDaysMin).toBe(2);
    expect(estimate.estimatedDeliveryDaysMax).toBe(3);
    expect(estimate.shippingFeeBdt).toBe(100.0);
  });

  it('should calculate nationwide 3-5 days delivery outside Dhaka with 120 BDT fee', () => {
    const estimate = service.estimateDelivery({
      division: 'Chittagong',
      district: 'Coxs Bazar',
    });

    expect(estimate.zone).toBe('OUTSIDE_DHAKA');
    expect(estimate.estimatedDeliveryDaysMin).toBe(3);
    expect(estimate.estimatedDeliveryDaysMax).toBe(5);
    expect(estimate.shippingFeeBdt).toBe(120.0);
  });
});
