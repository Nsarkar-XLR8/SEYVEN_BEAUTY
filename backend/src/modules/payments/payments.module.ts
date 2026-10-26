import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BkashService } from './gateways/bkash/bkash.service';
import { SSLCommerzService } from './gateways/sslcommerz/sslcommerz.service';
import { SplitPaymentLedgerService } from './services/split-payment-ledger.service';
import { PaymentRecoveryService } from './services/payment-recovery.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    BkashService,
    SSLCommerzService,
    SplitPaymentLedgerService,
    PaymentRecoveryService,
  ],
  exports: [
    PaymentsService,
    BkashService,
    SSLCommerzService,
    SplitPaymentLedgerService,
    PaymentRecoveryService,
  ],
})
export class PaymentsModule {}
