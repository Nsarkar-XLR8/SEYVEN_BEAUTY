import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { MetaCapiModule } from '../meta-capi/meta-capi.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './services/orders.service';
import { DispatchDocsService } from './services/dispatch-docs.service';
import { RtoReturnsService } from './services/rto-returns.service';
import { OrderStateMachine } from './state-machine/order-state-machine';

@Module({
  imports: [
    DatabaseModule,
    CheckoutModule,
    NotificationsModule,
    SettingsModule,
    AuthModule,
    MetaCapiModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    DispatchDocsService,
    RtoReturnsService,
    OrderStateMachine,
  ],
  exports: [
    OrdersService,
    DispatchDocsService,
    RtoReturnsService,
    OrderStateMachine,
  ],
})
export class OrdersModule {}
