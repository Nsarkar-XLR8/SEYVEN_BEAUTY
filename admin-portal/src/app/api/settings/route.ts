import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || '';

function getSettingsFilePath(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), '../backend/platform-settings.json'),
    path.resolve(process.cwd(), 'platform-settings.json'),
    path.resolve(process.cwd(), '../../backend/platform-settings.json'),
    'd:/SEYVEN/backend/platform-settings.json',
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
    } catch {}
  }
  return null;
}

const DEFAULT_SETTINGS = {
  isVatEnabled: false,
  vatRatePercent: 5,
  isVatInclusive: true,
  standardDeliveryDhakaBdt: 70,
  standardDeliveryOutsideBdt: 130,
  freeDeliveryThresholdBdt: 3000,
  supportPhone: '+880 9612 000000',
  supportWhatsApp: '+880 1700 000000',
  supportMessenger: 'https://m.me/seyvenofficial',
  supportFacebook: 'https://www.facebook.com/seyvenofficial',
  supportInstagram: 'https://www.instagram.com/seyven_beauty/',
  primaryConciergeChannel: 'MESSENGER',
  isCampaignActive: false,
  campaignTitle: 'Festive Eid Sanctuary Privilege',
  campaignDiscountPercent: 7,
  campaignStartDate: null,
  campaignEndDate: null,
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  // 1. Try Backend if reachable
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${apiUrl}/settings`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  // 2. Fallback to local settings file on disk
  try {
    const filePath = getSettingsFilePath();
    if (filePath && fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return NextResponse.json({
        success: true,
        data: { ...DEFAULT_SETTINGS, ...parsed },
      });
    }
  } catch {}

  // 3. Fallback to default
  return NextResponse.json({
    success: true,
    data: DEFAULT_SETTINGS,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Sanitize messenger link if provided
    let messengerUrl = body.supportMessenger;
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

    const updated = {
      ...DEFAULT_SETTINGS,
      ...body,
      ...(messengerUrl ? { supportMessenger: messengerUrl } : {}),
      updatedAt: new Date().toISOString(),
    };

    // 1. Write to local file on disk
    try {
      const filePath = getSettingsFilePath() || path.resolve(process.cwd(), '../backend/platform-settings.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('Could not write to local settings file:', fsErr);
    }

    // 2. Also forward to backend if running
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(updated),
      });
      clearTimeout(timeout);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
