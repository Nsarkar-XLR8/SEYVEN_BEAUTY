import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  GetCartQueryDto,
  MergeCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { CartResponse } from './interfaces/cart.interface';

@ApiTags('Cart & Checkout Staging')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve active shopping cart with live totals & Free Delivery progress',
    description:
      'Fetches cart items from Redis with sub-millisecond latency, performs Half-Up price rounding, and calculates free delivery progress toward the ৳2,000 threshold.',
  })
  @ApiQuery({ name: 'guestToken', required: false, description: 'Guest session token if unauthenticated' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(
    @Query() query: GetCartQueryDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.cartService.getCart(userId, query.guestToken);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add item to shopping cart',
    description: 'Appends SKU variant to cart or increments existing quantity with 7-day sliding TTL refresh.',
  })
  @ApiResponse({ status: 200, description: 'Item added and updated cart returned' })
  async addItem(
    @Body() dto: AddToCartDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.cartService.addItem(dto, userId);
  }

  @Patch('items/:id')
  @ApiOperation({
    summary: 'Update cart line item quantity',
    description: 'Modifies line quantity. Passing quantity=0 automatically purges the item from the cart session.',
  })
  @ApiParam({ name: 'id', description: 'Cart item ID or Variant ID' })
  @ApiResponse({ status: 200, description: 'Item quantity updated successfully' })
  async updateItemQuantity(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.cartService.updateItemQuantity(id, dto, userId);
  }

  @Delete('items/:id')
  @ApiOperation({
    summary: 'Remove specific line item from cart',
    description: 'Purges item matching given item ID or Variant ID from Redis cart.',
  })
  @ApiParam({ name: 'id', description: 'Cart item ID or Variant ID' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  async removeItem(
    @Param('id') id: string,
    @Query() query: GetCartQueryDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.cartService.removeItem(id, userId, query.guestToken);
  }

  @Delete()
  @ApiOperation({
    summary: 'Clear entire shopping cart',
    description: 'Empties all items from active cart session.',
  })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(
    @Query() query: GetCartQueryDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.cartService.clearCart(userId, query.guestToken);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Merge guest cart into authenticated user account',
    description:
      'Synchronizes temporary guest session cart with persistent user account cart upon login/registration, preventing duplicate cart creation.',
  })
  @ApiResponse({ status: 200, description: 'Guest cart merged into user cart successfully' })
  async mergeCart(
    @Body() dto: MergeCartDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    const userId = user?.userId || (req as any).body?.userId;
    return this.cartService.mergeCart(dto.guestToken, userId);
  }
}

