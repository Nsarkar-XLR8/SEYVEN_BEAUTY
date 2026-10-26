import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShippingEstimatorService } from './services/shipping-estimator.service';
import { EstimateDeliveryDto } from './dto/shipping-estimate.dto';

@ApiTags('Shipping & Delivery')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingEstimatorService: ShippingEstimatorService) {}

  @Get('estimate-delivery')
  @ApiOperation({
    summary: 'Dynamic delivery time estimator & shipping fee calculator by destination district/division',
  })
  @ApiResponse({ status: 200, description: 'Estimated delivery timeline, zone, and shipping fee calculation' })
  estimateDelivery(@Query() dto: EstimateDeliveryDto) {
    return this.shippingEstimatorService.estimateDelivery(dto);
  }
}
