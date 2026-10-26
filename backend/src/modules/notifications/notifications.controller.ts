import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { NotificationsService } from './services/notifications.service';
import { SendDirectSmsDto } from './dto/send-direct-sms.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { WhatsAppChallengeQueryDto } from './dto/whatsapp-webhook.dto';
import { WhatsAppWebhookPayload } from './interfaces/whatsapp.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Notifications & Webhooks')
@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('admin/notifications/sms/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.FULFILLMENT_OPERATOR)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Direct Masked SMS Broadcast / Test Dispatch',
    description:
      'Dispatches an SMS to a Bangladeshi recipient using official BTRC brand mask (SEYVEN). Enforces quiet hours (10 PM - 8 AM BST) unless isUrgent is true.',
  })
  @ApiResponse({ status: 200, description: 'SMS dispatched or queued with audit log ID' })
  @ApiResponse({ status: 400, description: 'Invalid phone number or payload' })
  async sendDirectSms(@Body() dto: SendDirectSmsDto) {
    return this.notificationsService.sendDirectSms(dto);
  }

  @Get('webhooks/whatsapp')
  @ApiOperation({
    summary: 'Meta WhatsApp Cloud Webhook Verification Challenge',
    description:
      'Validates hub.mode and hub.verify_token against configured WHATSAPP_WEBHOOK_VERIFY_TOKEN and echoes hub.challenge.',
  })
  @ApiResponse({ status: 200, description: 'Verification successful, challenge echoed' })
  @ApiResponse({ status: 403, description: 'Invalid verification token' })
  verifyWhatsAppWebhook(
    @Query() query: WhatsAppChallengeQueryDto,
    @Res() res: Response,
  ) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const configuredToken =
      this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ||
      'seyven_wa_webhook_verify_token_2026';

    if (mode === 'subscribe' && token === configuredToken) {
      return res.status(HttpStatus.OK).send(challenge);
    }

    throw new ForbiddenException('Invalid WhatsApp webhook verification token');
  }

  @Post('webhooks/whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Meta WhatsApp Cloud Inbound Delivery Receipts & Statuses',
    description:
      'Ingests message status updates (sent, delivered, read, failed) and updates corresponding NotificationLog entries.',
  })
  @ApiResponse({ status: 200, description: 'Webhook events processed' })
  async handleWhatsAppWebhook(@Body() payload: WhatsAppWebhookPayload) {
    return this.notificationsService.handleWhatsAppWebhook(payload);
  }

  @Get('admin/notifications/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.FINANCE_OFFICER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Query notification dispatch audit trail',
    description:
      'Retrieves paginated delivery logs across SMS and WhatsApp channels, filtering by status, recipient, and template.',
  })
  @ApiResponse({ status: 200, description: 'Paginated notification log entries' })
  async listLogs(@Query() query: NotificationQueryDto) {
    return this.notificationsService.listLogs(query);
  }
}
