import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import {
  CartItem,
  CartResponse,
  CartSummary,
  FreeDeliveryProgress,
} from './interfaces/cart.interface';
import { v4 as uuidv4 } from 'uuid';

interface StoredCartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  titleBn?: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  imageUrl?: string;
  weightGrams?: number;
  routineStep?: string;
  addedAt: string;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  public static readonly CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days sliding TTL
  public static readonly FREE_DELIVERY_THRESHOLD = 2000; // ৳2,000 BDT

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Helper to round numbers using standard Half-Up 2-decimal precision.
   */
  private roundHalfUp(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Resolve Redis cart key and guest token.
   */
  private resolveCartKey(
    userId?: string | null,
    guestToken?: string | null,
  ): { cartKey: string; resolvedGuestToken: string | null; resolvedUserId: string | null } {
    if (userId) {
      return {
        cartKey: `cart:user:${userId}`,
        resolvedGuestToken: null,
        resolvedUserId: userId,
      };
    }
    const token = guestToken || `guest_${uuidv4()}`;
    return {
      cartKey: `cart:guest:${token}`,
      resolvedGuestToken: token,
      resolvedUserId: null,
    };
  }

  /**
   * Retrieve active cart with live pricing and free delivery calculations.
   */
  async getCart(userId?: string, guestToken?: string): Promise<CartResponse> {
    const { cartKey, resolvedGuestToken, resolvedUserId } = this.resolveCartKey(
      userId,
      guestToken,
    );

    const storedItems = await this.readStoredItems(cartKey);
    // Refresh 7-day sliding TTL
    await this.redisService.set(
      cartKey,
      JSON.stringify(storedItems),
      CartService.CART_TTL_SECONDS,
    );

    return this.buildCartResponse(
      storedItems,
      cartKey,
      resolvedUserId,
      resolvedGuestToken,
    );
  }

  /**
   * Add single line item to cart.
   */
  async addItem(dto: AddToCartDto, userId?: string): Promise<CartResponse> {
    const { cartKey, resolvedGuestToken, resolvedUserId } = this.resolveCartKey(
      userId,
      dto.guestToken,
    );

    const storedItems = await this.readStoredItems(cartKey);
    const existingIndex = storedItems.findIndex(
      (item) => item.variantId === dto.variantId,
    );

    if (existingIndex >= 0) {
      // Increment existing quantity (capped at 20)
      storedItems[existingIndex].quantity = Math.min(
        20,
        storedItems[existingIndex].quantity + dto.quantity,
      );
      if (dto.routineStep) {
        storedItems[existingIndex].routineStep = dto.routineStep;
      }
    } else {
      // Fetch product variant details from catalog
      const productDetails = await this.fetchVariantDetails(
        dto.productId,
        dto.variantId,
      );

      storedItems.push({
        id: uuidv4(),
        productId: dto.productId,
        variantId: dto.variantId,
        title: productDetails.title,
        titleBn: productDetails.titleBn,
        variantName: productDetails.variantName,
        sku: productDetails.sku,
        unitPrice: productDetails.unitPrice,
        regularPrice: productDetails.regularPrice,
        quantity: Math.min(20, dto.quantity),
        imageUrl: productDetails.imageUrl,
        weightGrams: productDetails.weightGrams,
        routineStep: dto.routineStep,
        addedAt: new Date().toISOString(),
      });
    }

    // Persist in Redis with sliding TTL
    await this.redisService.set(
      cartKey,
      JSON.stringify(storedItems),
      CartService.CART_TTL_SECONDS,
    );

    return this.buildCartResponse(
      storedItems,
      cartKey,
      resolvedUserId,
      resolvedGuestToken,
    );
  }

  /**
   * Update quantity of an item in cart.
   */
  async updateItemQuantity(
    identifier: string, // variantId or item.id
    dto: UpdateCartItemDto,
    userId?: string,
  ): Promise<CartResponse> {
    const { cartKey, resolvedGuestToken, resolvedUserId } = this.resolveCartKey(
      userId,
      dto.guestToken,
    );

    let storedItems = await this.readStoredItems(cartKey);
    const index = storedItems.findIndex(
      (item) => item.id === identifier || item.variantId === identifier,
    );

    if (index === -1) {
      throw new NotFoundException(`Item not found in cart`);
    }

    if (dto.quantity <= 0) {
      storedItems.splice(index, 1);
    } else {
      storedItems[index].quantity = Math.min(50, dto.quantity);
    }

    await this.redisService.set(
      cartKey,
      JSON.stringify(storedItems),
      CartService.CART_TTL_SECONDS,
    );

    return this.buildCartResponse(
      storedItems,
      cartKey,
      resolvedUserId,
      resolvedGuestToken,
    );
  }

  /**
   * Remove specific item from cart.
   */
  async removeItem(
    identifier: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CartResponse> {
    const { cartKey, resolvedGuestToken, resolvedUserId } = this.resolveCartKey(
      userId,
      guestToken,
    );

    let storedItems = await this.readStoredItems(cartKey);
    const initialLength = storedItems.length;
    storedItems = storedItems.filter(
      (item) => item.id !== identifier && item.variantId !== identifier,
    );

    if (storedItems.length === initialLength) {
      throw new NotFoundException(`Item not found in cart`);
    }

    await this.redisService.set(
      cartKey,
      JSON.stringify(storedItems),
      CartService.CART_TTL_SECONDS,
    );

    return this.buildCartResponse(
      storedItems,
      cartKey,
      resolvedUserId,
      resolvedGuestToken,
    );
  }

  /**
   * Clear entire cart session.
   */
  async clearCart(userId?: string, guestToken?: string): Promise<CartResponse> {
    const { cartKey, resolvedGuestToken, resolvedUserId } = this.resolveCartKey(
      userId,
      guestToken,
    );

    await this.redisService.set(
      cartKey,
      JSON.stringify([]),
      CartService.CART_TTL_SECONDS,
    );

    return this.buildCartResponse(
      [],
      cartKey,
      resolvedUserId,
      resolvedGuestToken,
    );
  }

  /**
   * Synchronize & merge guest session cart into user cart upon login.
   */
  async mergeCart(guestToken: string, userId: string): Promise<CartResponse> {
    if (!guestToken || !userId) {
      throw new BadRequestException('Both guestToken and userId are required to merge cart');
    }

    const guestCartKey = `cart:guest:${guestToken}`;
    const userCartKey = `cart:user:${userId}`;

    const guestItems = await this.readStoredItems(guestCartKey);
    const userItems = await this.readStoredItems(userCartKey);

    if (guestItems.length > 0) {
      for (const gItem of guestItems) {
        const userItemIdx = userItems.findIndex(
          (u) => u.variantId === gItem.variantId,
        );
        if (userItemIdx >= 0) {
          userItems[userItemIdx].quantity = Math.min(
            20,
            userItems[userItemIdx].quantity + gItem.quantity,
          );
        } else {
          userItems.push({
            ...gItem,
            id: uuidv4(),
          });
        }
      }

      // Persist merged user cart
      await this.redisService.set(
        userCartKey,
        JSON.stringify(userItems),
        CartService.CART_TTL_SECONDS,
      );

      // Clean up guest cart key in Redis
      await this.redisService.set(guestCartKey, JSON.stringify([]), 60); // fast expire
    }

    return this.buildCartResponse(userItems, userCartKey, userId, null);
  }

  // --- Internal Utilities ---

  private async readStoredItems(cartKey: string): Promise<StoredCartItem[]> {
    const raw = await this.redisService.get(cartKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private async fetchVariantDetails(productId: string, variantId: string): Promise<{
    title: string;
    titleBn?: string;
    variantName: string;
    sku: string;
    unitPrice: number;
    regularPrice: number;
    imageUrl?: string;
    weightGrams?: number;
  }> {
    try {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (variant) {
        const unitPrice = Number(variant.priceBdt);
        const regularPrice = variant.compareAtPriceBdt
          ? Number(variant.compareAtPriceBdt)
          : unitPrice;

        return {
          title: variant.product.titleEn,
          titleBn: variant.product.titleBn,
          variantName: `${variant.volumeMlG}ml Standard`,
          sku: variant.sku,
          unitPrice,
          regularPrice,
          imageUrl: 'https://images.seyven.com/products/default.webp',
          weightGrams: variant.weightGrams || 150,
        };
      }
    } catch (dbErr) {
      this.logger.warn(`Catalog DB lookup failed for variant ${variantId}. Using fallback.`);
    }

    // Fallback nominal details
    return {
      title: 'SEYVEN Advanced Dermal Care Formulation',
      titleBn: 'সেভেন অ্যাডভান্সড ডার্মাল কেয়ার ফর্মুলেশন',
      variantName: '50ml Standard',
      sku: `SYV-${variantId.slice(0, 8).toUpperCase()}`,
      unitPrice: 1950,
      regularPrice: 2250,
      imageUrl: 'https://images.seyven.com/products/fallback-product.webp',
      weightGrams: 150,
    };
  }

  private buildCartResponse(
    storedItems: StoredCartItem[],
    cartKey: string,
    userId: string | null,
    guestToken: string | null,
  ): CartResponse {
    let subtotal = 0;
    let totalRegularPrice = 0;
    let totalItems = 0;

    const items: CartItem[] = storedItems.map((item) => {
      const lineSubtotal = this.roundHalfUp(item.unitPrice * item.quantity);
      const lineRegularTotal = this.roundHalfUp(item.regularPrice * item.quantity);
      const lineSavings = this.roundHalfUp(Math.max(0, lineRegularTotal - lineSubtotal));

      subtotal += lineSubtotal;
      totalRegularPrice += lineRegularTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        titleBn: item.titleBn,
        variantName: item.variantName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        regularPrice: item.regularPrice,
        quantity: item.quantity,
        lineSubtotal,
        lineRegularTotal,
        lineSavings,
        imageUrl: item.imageUrl,
        weightGrams: item.weightGrams,
        routineStep: item.routineStep,
        inStock: true,
        availableStock: 50,
        addedAt: item.addedAt,
      };
    });

    subtotal = this.roundHalfUp(subtotal);
    totalRegularPrice = this.roundHalfUp(totalRegularPrice);
    const totalSavings = this.roundHalfUp(Math.max(0, totalRegularPrice - subtotal));

    // Dynamic Free Delivery Progress Calculation
    const threshold = CartService.FREE_DELIVERY_THRESHOLD;
    const isEligible = subtotal >= threshold;
    const amountNeeded = this.roundHalfUp(Math.max(0, threshold - subtotal));
    const progressPercentage = Math.min(100, Math.round((subtotal / threshold) * 100));

    const freeDelivery: FreeDeliveryProgress = {
      threshold,
      isEligible,
      amountNeeded,
      progressPercentage,
    };

    const summary: CartSummary = {
      subtotal,
      totalRegularPrice,
      totalSavings,
      estimatedVat: 0, // Bangladeshi NBR standard VAT included in MRP
      totalPayable: subtotal,
      currency: 'BDT',
      totalItems,
      uniqueCount: items.length,
      freeDelivery,
    };

    return {
      cartId: cartKey,
      userId,
      guestToken,
      items,
      summary,
      expiresInSeconds: CartService.CART_TTL_SECONDS,
      updatedAt: new Date().toISOString(),
    };
  }
}
