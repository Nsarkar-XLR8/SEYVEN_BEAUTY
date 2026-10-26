import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer360Service } from './services/customer-360.service';
import { GdprService } from './services/gdpr.service';
import { QuickTrackingService } from './services/quick-tracking.service';

@Module({
  imports: [DatabaseModule, CheckoutModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    QuickTrackingService,
    Customer360Service,
    GdprService,
  ],
  exports: [
    CustomerService,
    QuickTrackingService,
    Customer360Service,
    GdprService,
  ],
})
export class CustomerModule {}
