import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryReservationService } from './services/inventory-reservation.service';
import { CreateInventoryLotDto } from './dto/lot.dto';
import { StockAdjustmentDto } from './dto/adjustment.dto';
import { BatchRecallDto } from './dto/recall.dto';
import { ConfirmStockDto, ReleaseStockDto, ReserveStockDto } from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly reservationService: InventoryReservationService,
  ) {}

  @Post('lots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiOperation({ summary: 'Register a new manufacturing/expiry inventory lot batch' })
  @ApiResponse({ status: 201, description: 'Lot batch created successfully' })
  @ApiResponse({ status: 400, description: 'Batch number conflict or invalid dates' })
  createLot(@Body() dto: CreateInventoryLotDto) {
    return this.inventoryService.createLot(dto);
  }

  @Get('lots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'List inventory lots with optional variant filter and shelf life calculations' })
  @ApiQuery({ name: 'variantId', required: false, description: 'Filter lots by product variant ID' })
  @ApiResponse({ status: 200, description: 'List of inventory lots' })
  listLots(@Query('variantId') variantId?: string) {
    return this.inventoryService.listLots(variantId);
  }

  @Post('lots/adjust')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiOperation({ summary: 'Manually adjust lot stock with mandatory audit reason logging' })
  @ApiResponse({ status: 201, description: 'Stock adjusted and audit record logged' })
  @ApiResponse({ status: 404, description: 'Lot not found' })
  adjustLotQuantity(
    @Body() dto: StockAdjustmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventoryService.adjustLotQuantity(dto, user?.userId);
  }

  @Post('recalls')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Initiate batch quarantine or safety recall with customer blast traceability' })
  @ApiResponse({ status: 201, description: 'Batch quarantined and affected orders identified' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  initiateBatchRecall(
    @Body() dto: BatchRecallDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventoryService.initiateBatchRecall(dto, user?.userId);
  }

  // ---------------- 3-Stage Reservation Pipeline ----------------

  @Post('reservations/reserve')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiOperation({ summary: 'Stage 1: Lock temporary stock allocation with 15-minute TTL and Redlock concurrency guard' })
  @ApiResponse({ status: 201, description: 'Stock reserved successfully in Redis with FEFO allocation' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid bundle components' })
  reserveStock(
    @Body() dto: ReserveStockDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!dto.userId && user?.userId) {
      dto.userId = user.userId;
    }
    return this.reservationService.reserve(dto);
  }

  @Post('reservations/confirm')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiOperation({ summary: 'Stage 2: Commit stock deduction permanently post-payment authorization' })
  @ApiResponse({ status: 200, description: 'Stock permanently deducted from database lots with audit trail' })
  @ApiResponse({ status: 404, description: 'Reservation not found or expired' })
  confirmStock(@Body() dto: ConfirmStockDto) {
    return this.reservationService.confirm(dto);
  }

  @Post('reservations/release')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiOperation({ summary: 'Stage 3: Explicitly release held stock allocation back to available pool' })
  @ApiResponse({ status: 200, description: 'Stock reservation released successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  releaseStock(@Body() dto: ReleaseStockDto) {
    return this.reservationService.release(dto);
  }

  @Get('reservations/:id')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiOperation({ summary: 'Retrieve details and lot allocations of an active stock reservation' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation details' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  getReservation(@Param('id') id: string) {
    return this.reservationService.getReservation(id);
  }
}


