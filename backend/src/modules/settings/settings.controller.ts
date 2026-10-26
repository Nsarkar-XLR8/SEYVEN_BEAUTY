import { Body, Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Platform Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current platform settings (VAT, delivery fees, thresholds)' })
  getSettings() {
    return {
      success: true,
      data: this.settingsService.getSettings(),
    };
  }

  @Put()
  @ApiOperation({ summary: 'Update platform settings (Admin)' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    const updated = this.settingsService.updateSettings(dto);
    return {
      success: true,
      message: 'Platform settings updated successfully',
      data: updated,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update platform settings' })
  patchSettings(@Body() dto: UpdateSettingsDto) {
    const updated = this.settingsService.updateSettings(dto);
    return {
      success: true,
      message: 'Platform settings updated successfully',
      data: updated,
    };
  }

  @Post('vat/toggle')
  @ApiOperation({ summary: 'Turn VAT On or Off' })
  toggleVat(@Body('enabled') enabled?: boolean) {
    const updated = this.settingsService.toggleVat(enabled);
    return {
      success: true,
      message: `VAT has been turned ${updated.isVatEnabled ? 'ON' : 'OFF'}`,
      data: updated,
    };
  }

  @Post('campaign/toggle')
  @ApiOperation({ summary: 'Turn Seasonal Campaign On or Off' })
  toggleCampaign(@Body('enabled') enabled?: boolean) {
    const updated = this.settingsService.toggleCampaign(enabled);
    return {
      success: true,
      message: `Seasonal Campaign has been turned ${updated.isCampaignActive ? 'ACTIVE' : 'INACTIVE'}`,
      data: updated,
    };
  }
}
