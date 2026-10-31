import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetaCapiService } from './meta-capi.service';

@Module({
  imports: [ConfigModule],
  providers: [MetaCapiService],
  exports: [MetaCapiService],
})
export class MetaCapiModule {}

