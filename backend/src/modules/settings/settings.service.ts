import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface PlatformSettings {
  isVatEnabled: boolean;
  vatRatePercent: number;
  isVatInclusive: boolean;
  standardDeliveryDhakaBdt: number;
  standardDeliveryOutsideBdt: number;
  freeDeliveryThresholdBdt: number;
  supportPhone: string;
  supportWhatsApp: string;
  isCampaignActive: boolean;
  campaignTitle: string;
  campaignDiscountPercent: number;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  updatedAt: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  isVatEnabled: false,
  vatRatePercent: 5,
  isVatInclusive: true,
  standardDeliveryDhakaBdt: 70,
  standardDeliveryOutsideBdt: 130,
  freeDeliveryThresholdBdt: 2000,
  supportPhone: '+880 9612 000000',
  supportWhatsApp: '+880 1700 000000',
  isCampaignActive: true,
  campaignTitle: 'Festive Eid Sanctuary Privilege',
  campaignDiscountPercent: 7,
  campaignStartDate: new Date().toISOString(),
  campaignEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private settings: PlatformSettings = { ...DEFAULT_SETTINGS };
  private readonly storageFilePath = path.resolve(process.cwd(), 'platform-settings.json');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
        this.logger.log(`Loaded platform settings from ${this.storageFilePath}`);
      } else {
        this.saveToStorage();
      }
    } catch (err: any) {
      this.logger.warn(`Failed to read platform settings file: ${err.message}, using defaults.`);
    }
  }

  private saveToStorage() {
    try {
      fs.writeFileSync(this.storageFilePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to save platform settings to file: ${err.message}`);
    }
  }

  getSettings(): PlatformSettings {
    return { ...this.settings };
  }

  updateSettings(dto: UpdateSettingsDto): PlatformSettings {
    this.settings = {
      ...this.settings,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    this.logger.log(`Platform settings updated: VAT Enabled=${this.settings.isVatEnabled}, VAT%=${this.settings.vatRatePercent}`);
    return { ...this.settings };
  }

  toggleVat(enabled?: boolean): PlatformSettings {
    const nextState = typeof enabled === 'boolean' ? enabled : !this.settings.isVatEnabled;
    this.settings.isVatEnabled = nextState;
    this.settings.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.logger.log(`Platform VAT toggled to: ${this.settings.isVatEnabled ? 'ON' : 'OFF'}`);
    return { ...this.settings };
  }

  toggleCampaign(enabled?: boolean): PlatformSettings {
    const nextState = typeof enabled === 'boolean' ? enabled : !this.settings.isCampaignActive;
    this.settings.isCampaignActive = nextState;
    this.settings.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.logger.log(`Seasonal Campaign toggled to: ${this.settings.isCampaignActive ? 'ACTIVE' : 'INACTIVE'}`);
    return { ...this.settings };
  }
}
