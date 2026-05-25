// apps/api/src/modules/notifications/notifications.controller.ts
import { Controller, Post, Body, Get, Headers, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /notifications/dispatch
   * Send a notification through a specified channel.
   */
  @Post('dispatch')
  async dispatch(
    @Body() body: { recipientId: string; channel: 'email' | 'push' | 'sms' | 'in_app'; subject: string; body: string },
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<Record<string, unknown>> {
    return this.notificationsService.dispatch({
      recipientId: body.recipientId,
      tenantId: tenantId || 'amdox-engineering',
      channel: body.channel,
      subject: body.subject,
      body: body.body,
    });
  }

  /**
   * GET /notifications/inbox
   * Retrieve in-app notifications for the current user.
   */
  @Get('inbox')
  async getInbox(
    @Headers('x-user-id') userId: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.notificationsService.getInAppNotifications(
      userId || 'root-system-admin',
      tenantId || 'amdox-engineering',
    );
  }
}
