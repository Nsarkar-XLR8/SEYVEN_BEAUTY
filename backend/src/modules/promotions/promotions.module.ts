import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { CartModule } from '../cart/cart.module';
import { AntiStackingValidator } from './guards/anti-stacking.validator';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [DatabaseModule, RedisModule, CartModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, AntiStackingValidator],
  exports: [PromotionsService, AntiStackingValidator],
})
export class PromotionsModule {}
