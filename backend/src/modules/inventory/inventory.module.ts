import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { FefoPickerService } from './services/fefo-picker.service';
import { InventoryReservationService } from './services/inventory-reservation.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, FefoPickerService, InventoryReservationService],
  exports: [InventoryService, FefoPickerService, InventoryReservationService],
})
export class InventoryModule {}
