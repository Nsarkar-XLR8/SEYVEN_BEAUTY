import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/database/prisma.service';
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
  supportMessenger: string;
  supportFacebook: string;
  supportInstagram: string;
  primaryConciergeChannel: 'MESSENGER' | 'WHATSAPP';
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
  freeDeliveryThresholdBdt: 3000,
  supportPhone: '',
  supportWhatsApp: '',
  supportMessenger: 'https://m.me/seyvenofficial',
  supportFacebook: 'https://www.facebook.com/seyvenofficial',
  supportInstagram: 'https://www.instagram.com/seyven_beauty/',
  primaryConciergeChannel: 'MESSENGER',
  isCampaignActive: true,
  campaignTitle: 'Festive Eid Sanctuary Privilege',
  campaignDiscountPercent: 7,
  campaignStartDate: new Date().toISOString(),
  campaignEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private settings: PlatformSettings = { ...DEFAULT_SETTINGS };
  private readonly storageFilePath = path.resolve(process.cwd(), 'platform-settings.json');

  constructor(private readonly prisma: PrismaService) {
    this.loadFromStorage();
  }

  async onModuleInit() {
    await this.syncWithDatabase();
  }

  private async syncWithDatabase() {
    try {
      const dbRow = await this.prisma.platformSetting.findUnique({
        where: { id: 'default' },
      });

      if (dbRow) {
        this.settings = this.mapDbRowToSettings(dbRow);
        this.saveToStorage();
        this.logger.log('✨ [SettingsService] Platform settings successfully synced from PostgreSQL database.');
      } else {
        // Seed default row into database
        await this.prisma.platformSetting.create({
          data: {
            id: 'default',
            isVatEnabled: this.settings.isVatEnabled,
            vatRatePercent: this.settings.vatRatePercent,
            isVatInclusive: this.settings.isVatInclusive,
            standardDeliveryDhakaBdt: this.settings.standardDeliveryDhakaBdt,
            standardDeliveryOutsideBdt: this.settings.standardDeliveryOutsideBdt,
            freeDeliveryThresholdBdt: this.settings.freeDeliveryThresholdBdt,
            supportPhone: this.settings.supportPhone,
            supportWhatsApp: this.settings.supportWhatsApp,
            supportMessenger: this.settings.supportMessenger,
            supportFacebook: this.settings.supportFacebook,
            supportInstagram: this.settings.supportInstagram,
            primaryConciergeChannel: this.settings.primaryConciergeChannel,
            isCampaignActive: this.settings.isCampaignActive,
            campaignTitle: this.settings.campaignTitle,
            campaignDiscountPercent: this.settings.campaignDiscountPercent,
            campaignStartDate: this.settings.campaignStartDate ? new Date(this.settings.campaignStartDate) : null,
            campaignEndDate: this.settings.campaignEndDate ? new Date(this.settings.campaignEndDate) : null,
          },
        });
        this.logger.log('✨ [SettingsService] Default platform settings row initialized in PostgreSQL database.');
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ [SettingsService] Could not sync with database: ${err.message}. Using cached/file settings.`);
    }
  }

  private mapDbRowToSettings(row: any): PlatformSettings {
    return {
      isVatEnabled: row.isVatEnabled,
      vatRatePercent: Number(row.vatRatePercent),
      isVatInclusive: row.isVatInclusive,
      standardDeliveryDhakaBdt: Number(row.standardDeliveryDhakaBdt),
      standardDeliveryOutsideBdt: Number(row.standardDeliveryOutsideBdt),
      freeDeliveryThresholdBdt: Number(row.freeDeliveryThresholdBdt),
      supportPhone: row.supportPhone,
      supportWhatsApp: row.supportWhatsApp,
      supportMessenger: row.supportMessenger,
      supportFacebook: row.supportFacebook,
      supportInstagram: row.supportInstagram,
      primaryConciergeChannel: (row.primaryConciergeChannel as 'MESSENGER' | 'WHATSAPP') || 'MESSENGER',
      isCampaignActive: row.isCampaignActive,
      campaignTitle: row.campaignTitle,
      campaignDiscountPercent: Number(row.campaignDiscountPercent),
      campaignStartDate: row.campaignStartDate ? new Date(row.campaignStartDate).toISOString() : null,
      campaignEndDate: row.campaignEndDate ? new Date(row.campaignEndDate).toISOString() : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
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

  async updateSettings(dto: UpdateSettingsDto): Promise<PlatformSettings> {
    let messengerUrl = dto.supportMessenger;
    if (messengerUrl) {
      messengerUrl = messengerUrl.trim();
      if (messengerUrl.includes('facebook.com/')) {
        const handle = messengerUrl.split('facebook.com/')[1]?.split('/')[0]?.split('?')[0];
        if (handle) messengerUrl = `https://m.me/${handle}`;
      } else if (!messengerUrl.startsWith('http')) {
        const clean = messengerUrl.replace(/^@/, '').replace(/^\/+/, '');
        messengerUrl = `https://m.me/${clean}`;
      }
    }

    this.settings = {
      ...this.settings,
      ...dto,
      ...(messengerUrl ? { supportMessenger: messengerUrl } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();

    // Persist to PostgreSQL Database
    try {
      const dbRow = await this.prisma.platformSetting.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          isVatEnabled: this.settings.isVatEnabled,
          vatRatePercent: this.settings.vatRatePercent,
          isVatInclusive: this.settings.isVatInclusive,
          standardDeliveryDhakaBdt: this.settings.standardDeliveryDhakaBdt,
          standardDeliveryOutsideBdt: this.settings.standardDeliveryOutsideBdt,
          freeDeliveryThresholdBdt: this.settings.freeDeliveryThresholdBdt,
          supportPhone: this.settings.supportPhone,
          supportWhatsApp: this.settings.supportWhatsApp,
          supportMessenger: this.settings.supportMessenger,
          supportFacebook: this.settings.supportFacebook,
          supportInstagram: this.settings.supportInstagram,
          primaryConciergeChannel: this.settings.primaryConciergeChannel,
          isCampaignActive: this.settings.isCampaignActive,
          campaignTitle: this.settings.campaignTitle,
          campaignDiscountPercent: this.settings.campaignDiscountPercent,
          campaignStartDate: this.settings.campaignStartDate ? new Date(this.settings.campaignStartDate) : null,
          campaignEndDate: this.settings.campaignEndDate ? new Date(this.settings.campaignEndDate) : null,
        },
        update: {
          isVatEnabled: this.settings.isVatEnabled,
          vatRatePercent: this.settings.vatRatePercent,
          isVatInclusive: this.settings.isVatInclusive,
          standardDeliveryDhakaBdt: this.settings.standardDeliveryDhakaBdt,
          standardDeliveryOutsideBdt: this.settings.standardDeliveryOutsideBdt,
          freeDeliveryThresholdBdt: this.settings.freeDeliveryThresholdBdt,
          supportPhone: this.settings.supportPhone,
          supportWhatsApp: this.settings.supportWhatsApp,
          supportMessenger: this.settings.supportMessenger,
          supportFacebook: this.settings.supportFacebook,
          supportInstagram: this.settings.supportInstagram,
          primaryConciergeChannel: this.settings.primaryConciergeChannel,
          isCampaignActive: this.settings.isCampaignActive,
          campaignTitle: this.settings.campaignTitle,
          campaignDiscountPercent: this.settings.campaignDiscountPercent,
          campaignStartDate: this.settings.campaignStartDate ? new Date(this.settings.campaignStartDate) : null,
          campaignEndDate: this.settings.campaignEndDate ? new Date(this.settings.campaignEndDate) : null,
        },
      });
      this.settings = this.mapDbRowToSettings(dbRow);
      this.logger.log(`✅ [SettingsService] Settings saved and persisted to PostgreSQL database successfully.`);
    } catch (err: any) {
      this.logger.error(`❌ [SettingsService] Failed to persist settings to database: ${err.message}`);
    }

    return { ...this.settings };
  }

  async toggleVat(enabled?: boolean): Promise<PlatformSettings> {
    const nextState = typeof enabled === 'boolean' ? enabled : !this.settings.isVatEnabled;
    this.settings.isVatEnabled = nextState;
    this.settings.updatedAt = new Date().toISOString();
    this.saveToStorage();

    try {
      await this.prisma.platformSetting.update({
        where: { id: 'default' },
        data: { isVatEnabled: nextState },
      });
    } catch (err: any) {
      this.logger.warn(`Could not update VAT toggle in DB: ${err.message}`);
    }

    return { ...this.settings };
  }

  async toggleCampaign(enabled?: boolean): Promise<PlatformSettings> {
    const nextState = typeof enabled === 'boolean' ? enabled : !this.settings.isCampaignActive;
    this.settings.isCampaignActive = nextState;
    this.settings.updatedAt = new Date().toISOString();
    this.saveToStorage();

    try {
      await this.prisma.platformSetting.update({
        where: { id: 'default' },
        data: { isCampaignActive: nextState },
      });
    } catch (err: any) {
      this.logger.warn(`Could not update Campaign toggle in DB: ${err.message}`);
    }

    return { ...this.settings };
  }
}
