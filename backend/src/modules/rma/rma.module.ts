import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { RmaController } from './rma.controller';
import { RmaService } from './rma.service';
import { HygienePolicyManager } from './services/hygiene-policy.manager';
import { RegulatoryDeadlineManager } from './services/regulatory-deadline.manager';
import { RefundDisbursementService } from './services/refund-disbursement.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RmaController],
  providers: [
    RmaService,
    HygienePolicyManager,
    RegulatoryDeadlineManager,
    RefundDisbursementService,
  ],
  exports: [
    RmaService,
    HygienePolicyManager,
    RegulatoryDeadlineManager,
    RefundDisbursementService,
  ],
})
export class RmaModule {}
