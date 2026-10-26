import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { GeoZoneService } from './services/geo-zone.service';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    CartModule,
    PromotionsModule,
    InventoryModule,
    NotificationsModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, GeoZoneService],
  exports: [CheckoutService, GeoZoneService],
})
export class CheckoutModule {}
