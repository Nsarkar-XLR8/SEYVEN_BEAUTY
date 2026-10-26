import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

describe('CartController', () => {
  let controller: CartController;
  let cartService: CartService;

  const mockCartResponse = {
    cartId: 'cart:user:u1',
    items: [],
    summary: {
      subtotal: 0,
      totalRegularPrice: 0,
      totalSavings: 0,
      estimatedVat: 0,
      totalPayable: 0,
      currency: 'BDT',
      totalItems: 0,
      uniqueCount: 0,
      freeDelivery: {
        threshold: 2000,
        isEligible: false,
        amountNeeded: 2000,
        progressPercentage: 0,
      },
    },
    expiresInSeconds: 604800,
    updatedAt: new Date().toISOString(),
  };

  const mockCartService = {
    getCart: jest.fn().mockResolvedValue(mockCartResponse),
    addItem: jest.fn().mockResolvedValue(mockCartResponse),
    updateItemQuantity: jest.fn().mockResolvedValue(mockCartResponse),
    removeItem: jest.fn().mockResolvedValue(mockCartResponse),
    clearCart: jest.fn().mockResolvedValue(mockCartResponse),
    mergeCart: jest.fn().mockResolvedValue(mockCartResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    cartService = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get active cart via GET /cart', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.getCart({}, req);
    expect(res).toBeDefined();
    expect(cartService.getCart).toHaveBeenCalledWith('u1', undefined);
  });

  it('should add item via POST /cart/items', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = { productId: 'p1', variantId: 'v1', quantity: 2 };
    const res = await controller.addItem(dto, req);
    expect(res).toBeDefined();
    expect(cartService.addItem).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should update quantity via PATCH /cart/items/:id', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = { quantity: 3 };
    const res = await controller.updateItemQuantity('v1', dto, req);
    expect(res).toBeDefined();
    expect(cartService.updateItemQuantity).toHaveBeenCalledWith('v1', dto, 'u1');
  });

  it('should remove item via DELETE /cart/items/:id', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.removeItem('v1', {}, req);
    expect(res).toBeDefined();
    expect(cartService.removeItem).toHaveBeenCalledWith('v1', 'u1', undefined);
  });

  it('should clear cart via DELETE /cart', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.clearCart({}, req);
    expect(res).toBeDefined();
    expect(cartService.clearCart).toHaveBeenCalledWith('u1', undefined);
  });

  it('should merge cart via POST /cart/merge', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = { guestToken: 'guest_123' };
    const res = await controller.mergeCart(dto, req);
    expect(res).toBeDefined();
    expect(cartService.mergeCart).toHaveBeenCalledWith('guest_123', 'u1');
  });
});
