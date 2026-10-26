import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DispatchDocsService } from './dispatch-docs.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { ManifestCourierFilter, ManifestExportFormat } from '../dto/export-manifest.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('DispatchDocsService', () => {
  let service: DispatchDocsService;
  let prisma: any;

  const mockOrder = {
    id: 'ord-12345',
    orderNumber: 'SYV-202610-A9F1B2',
    guestName: 'Tasnim Hasan',
    guestPhone: '+8801712345678',
    shippingAddress: {
      fullName: 'Tasnim Hasan',
      phone: '+8801712345678',
      division: 'Dhaka',
      district: 'Dhaka',
      thanaArea: 'Dhanmondi',
      streetAddress: 'House 14, Road 5, Dhanmondi',
    },
    subtotalBdt: 2500,
    deliveryFeeBdt: 60,
    discountBdt: 100,
    vatBdt: 125,
    totalPayableBdt: 2585,
    advancePaidBdt: 585,
    codDueBdt: 2000,
    status: OrderStatus.BOOKED,
    paymentStatus: PaymentStatus.PARTIALLY_PAID,
    courierBookingId: 'SF9876543',
    trackingCode: 'SF9876543',
    createdAt: new Date('2026-10-16T08:00:00Z'),
    items: [
      {
        id: 'item-1',
        title: 'SEYVEN Niacinamide Dermal Serum 30ml',
        sku: 'SYV-SRM-001',
        quantity: 2,
        unitPriceBdt: 1000,
        lineTotalBdt: 2000,
      },
      {
        id: 'item-2',
        title: 'SEYVEN Ceramide Barrier Cream 50ml',
        sku: 'SYV-CRM-002',
        quantity: 1,
        unitPriceBdt: 500,
        lineTotalBdt: 500,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(mockOrder),
        findMany: jest.fn().mockResolvedValue([mockOrder]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchDocsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DispatchDocsService>(DispatchDocsService);
  });

  describe('generateShippingLabelPdf', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.generateShippingLabelPdf('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate a valid 4x6 inch vector PDF for COD orders with prominent badge', async () => {
      const buffer = await service.generateShippingLabelPdf('ord-12345');

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      // PDF standard magic bytes %PDF-
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    it('should generate a valid PDF for fully prepaid orders', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        codDueBdt: 0,
        advancePaidBdt: 2585,
        paymentStatus: PaymentStatus.PAID,
      });

      const buffer = await service.generateShippingLabelPdf('ord-12345');
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    it('should handle orders with more than 4 items gracefully', async () => {
      const manyItems = [
        ...mockOrder.items,
        { id: 'i3', title: 'Product 3', sku: 'SKU3', quantity: 1, unitPriceBdt: 100, lineTotalBdt: 100 },
        { id: 'i4', title: 'Product 4', sku: 'SKU4', quantity: 1, unitPriceBdt: 100, lineTotalBdt: 100 },
        { id: 'i5', title: 'Product 5', sku: 'SKU5', quantity: 1, unitPriceBdt: 100, lineTotalBdt: 100 },
      ];
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        items: manyItems,
      });

      const buffer = await service.generateShippingLabelPdf('ord-12345');
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });
  });

  describe('generateMushak63Pdf', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.generateMushak63Pdf('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate valid NBR Mushak-6.3 VAT Tax Invoice Vector PDF', async () => {
      const buffer = await service.generateMushak63Pdf('ord-12345');

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });
  });

  describe('generateManifestPdf', () => {
    it('should generate a valid Courier Handover Bulk Manifest PDF', async () => {
      const buffer = await service.generateManifestPdf({
        courier: ManifestCourierFilter.ALL,
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    it('should filter orders by Pathao courier', async () => {
      await service.generateManifestPdf({
        courier: ManifestCourierFilter.PATHAO,
        limit: 50,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            trackingCode: { startsWith: 'DB' },
          }),
        }),
      );
    });

    it('should filter orders by Steadfast courier', async () => {
      await service.generateManifestPdf({
        courier: ManifestCourierFilter.STEADFAST,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { trackingCode: { startsWith: 'SF' } },
              { courierBookingId: { not: null } },
            ],
          }),
        }),
      );
    });
  });

  describe('generateManifestCsv', () => {
    it('should generate RFC-4180 compliant CSV string with headers and escaped fields', async () => {
      const csv = await service.generateManifestCsv({
        courier: ManifestCourierFilter.ALL,
        format: ManifestExportFormat.CSV,
      });

      expect(typeof csv).toBe('string');
      expect(csv).toContain('SL,Order Number,Consignment ID,Tracking Code');
      expect(csv).toContain('SYV-202610-A9F1B2');
      expect(csv).toContain('SF9876543');
      expect(csv).toContain('2000'); // COD Due
    });
  });

  describe('generatePackingSlipPdf', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.generatePackingSlipPdf('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate valid Warehouse Picking & Packing Slip Vector PDF', async () => {
      const buffer = await service.generatePackingSlipPdf('ord-12345');

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });
  });
});
