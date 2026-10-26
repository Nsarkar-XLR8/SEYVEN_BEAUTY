import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { NavigationController } from './navigation.controller';
import { PdpController } from './pdp.controller';
import { ShippingController } from './shipping.controller';
import { CatalogService } from './catalog.service';
import { PreviewTokenService } from './services/preview-token.service';
import { NavigationService } from './services/navigation.service';
import { FacetService } from './services/facet.service';
import { PdpService } from './services/pdp.service';
import { SchemaOrgService } from './services/schema-org.service';
import { ShippingEstimatorService } from './services/shipping-estimator.service';
import { WaitlistService } from './services/waitlist.service';
import { CloudinaryService } from './services/cloudinary.service';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [
    CatalogController,
    NavigationController,
    PdpController,
    ShippingController,
  ],
  providers: [
    CatalogService,
    CloudinaryService,
    PreviewTokenService,
    NavigationService,
    FacetService,
    PdpService,
    SchemaOrgService,
    ShippingEstimatorService,
    WaitlistService,
  ],
  exports: [
    CatalogService,
    CloudinaryService,
    PreviewTokenService,
    NavigationService,
    FacetService,
    PdpService,
    SchemaOrgService,
    ShippingEstimatorService,
    WaitlistService,
  ],
})
export class CatalogModule {}
