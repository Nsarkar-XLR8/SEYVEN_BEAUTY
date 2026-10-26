import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
