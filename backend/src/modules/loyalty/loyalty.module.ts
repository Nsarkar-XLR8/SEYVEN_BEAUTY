import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { ReplenishmentEngineService } from './services/replenishment-engine.service';
import { TierCalculatorService } from './services/tier-calculator.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    TierCalculatorService,
    ReplenishmentEngineService,
  ],
  exports: [
    LoyaltyService,
    TierCalculatorService,
    ReplenishmentEngineService,
  ],
})
export class LoyaltyModule {}
