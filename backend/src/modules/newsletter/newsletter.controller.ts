import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { NewsletterService } from './services/newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { BroadcastCampaignDto } from './dto/broadcast-campaign.dto';

@ApiTags('Newsletter & Client Dispatches (Queue with DLQ)')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * =========================================================================
   * PUBLIC ENDPOINTS (Storefront Footer & Unsubscribe Links)
   * =========================================================================
   */

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to SEYVEN private client newsletters' })
  @ApiResponse({ status: 200, description: 'Client subscribed successfully' })
  async subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'One-click unsubscribe via token' })
  async unsubscribe(@Query('token') token: string, @Res() res: Response) {
    const result = await this.newsletterService.unsubscribe(token);

    // Return a luxury styled HTML confirmation page for browser clicks
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEYVEN - Unsubscribe Confirmation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F9F6F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1C1917;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      max-width: 480px;
      margin: 20px;
      background: #FFFFFF;
      border: 1px solid #E6DFD5;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(28,25,23,0.06);
      text-align: center;
      overflow: hidden;
    }
    .top-gold {
      height: 4px;
      background: #C7A97B;
    }
    .content {
      padding: 40px 32px;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 22px;
      letter-spacing: 0.2em;
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      line-height: 1.6;
      color: #6E6B65;
    }
    a {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 28px;
      background: #1C1917;
      color: #FFFFFF;
      text-decoration: none;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="top-gold"></div>
    <div class="content">
      <h1>SEYVEN</h1>
      <p style="text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-size: 10px; font-weight: 600; margin-bottom: 24px;">SANCTUARY PREFERENCES</p>
      <p>${result.message}</p>
      <p style="margin-top: 12px; font-size: 12px; color: #8E8B85;">
        You can always rejoin our sanctuary anytime from the footer of our boutique.
      </p>
      <a href="http://localhost:3000">Return to SEYVEN Boutique</a>
    </div>
  </div>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  /**
   * =========================================================================
   * ADMIN PORTAL ENDPOINTS (Campaign Broadcasts, Subscribers, DLQ)
   * =========================================================================
   */

  @Post('campaigns/broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Broadcast a rich-text campaign to subscribers via DLQ Queue' })
  @ApiResponse({ status: 200, description: 'Campaign broadcast dispatched to queue' })
  async broadcastCampaign(@Body() dto: BroadcastCampaignDto) {
    return this.newsletterService.broadcastCampaign(dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get all newsletter campaigns' })
  async getCampaigns() {
    return this.newsletterService.getCampaigns();
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'Get all newsletter subscribers with metrics' })
  async getSubscribers() {
    return this.newsletterService.getSubscribers();
  }

  @Get('dlq')
  @ApiOperation({ summary: 'Inspect Dead Letter Queue (DLQ) items and metrics' })
  async getDeadLetterQueue() {
    return this.newsletterService.getDeadLetterQueueItems();
  }

  @Post('dlq/:id/retry')
  @ApiOperation({ summary: 'Re-drive a specific failed job from Dead Letter Queue' })
  async retryDlqItem(@Param('id') id: string) {
    return this.newsletterService.reDriveDlqItem(id);
  }

  @Post('dlq/redrive-all')
  @ApiOperation({ summary: 'Re-drive all failed jobs from Dead Letter Queue' })
  async reDriveAllDlq() {
    return this.newsletterService.reDriveAllDlq();
  }

  @Delete('dlq')
  @ApiOperation({ summary: 'Clear all items from Dead Letter Queue' })
  async clearDlq() {
    return this.newsletterService.clearDlq();
  }
}
