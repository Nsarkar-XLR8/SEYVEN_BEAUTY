import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { GeoZoneService } from './services/geo-zone.service';
import { PaymentGatewayOption } from './dto/checkout.dto';

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let checkoutService: CheckoutService;
  let geoZoneService: GeoZoneService;

  const mockCalcResult = {
    subtotal: 2450,
    regularTotal: 2800,
    savings: 350,
    deliveryFee: 0,
    isFreeDelivery: true,
    freeDeliveryThreshold: 2000,
    couponDiscount: 0,
    totalVat: 0,
    totalPayable: 2450,
    advancePaymentRequired: 0,
    codDue: 2450,
    estimatedDeliveryWindow: '12-24 Hours',
    estimatedDeliveryWindowBn: '১২-২৪ ঘণ্টা',
    totalWeightGrams: 200,
    currency: 'BDT',
  };

  const mockCommitResult = {
    orderId: 'ord-123',
    orderNumber: 'SYV-202610-A1B2C3',
    status: 'PLACED',
    paymentStatus: 'PENDING',
    paymentGateway: 'COD',
    subtotal: 2450,
    deliveryFee: 0,
    discount: 0,
    totalPayable: 2450,
    advancePaid: 0,
    codDue: 2450,
    shippingAddress: {},
    itemsCount: 1,
    createdAt: new Date().toISOString(),
  };

  const mockCheckoutService = {
    calculateCheckout: jest.fn().mockResolvedValue(mockCalcResult),
    commitCheckout: jest.fn().mockResolvedValue(mockCommitResult),
  };

  const mockGeoZoneService = {
    getAllDivisions: jest.fn().mockReturnValue([{ nameEn: 'Dhaka', districts: ['Dhaka'] }]),
    getThanasForDistrict: jest.fn().mockReturnValue([{ nameEn: 'Dhanmondi', courierZoneId: 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        { provide: CheckoutService, useValue: mockCheckoutService },
        { provide: GeoZoneService, useValue: mockGeoZoneService },
      ],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
    checkoutService = module.get<CheckoutService>(CheckoutService);
    geoZoneService = module.get<GeoZoneService>(GeoZoneService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all divisions via GET /geo/zones', () => {
    const res = controller.getGeoZones();
    expect(res).toBeDefined();
    expect(geoZoneService.getAllDivisions).toHaveBeenCalled();
  });

  it('should return thanas for district via GET /geo/zones?district=Dhaka', () => {
    const res = controller.getGeoZones('Dhaka');
    expect(res).toBeDefined();
    expect(geoZoneService.getThanasForDistrict).toHaveBeenCalledWith('Dhaka');
  });

  it('should calculate checkout via POST /checkout/calculate', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = {
      shippingAddress: {
        fullName: 'Ayesha',
        phone: '01712345678',
        division: 'Dhaka',
        district: 'Dhaka',
        thanaArea: 'Dhanmondi',
        streetAddress: 'Road 1',
      },
      paymentGateway: PaymentGatewayOption.COD,
    };

    const res = await controller.calculateCheckout(dto, req);
    expect(res).toBeDefined();
    expect(checkoutService.calculateCheckout).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should commit checkout via POST /checkout/commit', async () => {
    const req = {
      user: { userId: 'u1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'JestTest' },
      socket: {},
    } as any;

    const dto = {
      shippingAddress: {
        fullName: 'Ayesha',
        phone: '01712345678',
        division: 'Dhaka',
        district: 'Dhaka',
        thanaArea: 'Dhanmondi',
        streetAddress: 'Road 1',
      },
      paymentGateway: PaymentGatewayOption.COD,
      termsAccepted: true,
      privacyConsentAccepted: true,
    };

    const res = await controller.commitCheckout(dto, 'idemp-123', req);
    expect(res).toBeDefined();
    expect(checkoutService.commitCheckout).toHaveBeenCalledWith(
      dto,
      'idemp-123',
      '127.0.0.1',
      'JestTest',
      'u1',
    );
  });
});
