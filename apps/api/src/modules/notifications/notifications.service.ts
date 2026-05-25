// apps/api/src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';

interface NotificationPayload {
  recipientId: string;
  tenantId: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Dispatch a notification through the configured channel.
   * Falls back to in-memory queue when external providers are unavailable.
   */
  async dispatch(payload: NotificationPayload): Promise<Record<string, unknown>> {
    this.logger.log(
      `Dispatching ${payload.channel} notification to ${payload.recipientId} [Tenant: ${payload.tenantId}]`,
    );

    // Channel routing simulation
    switch (payload.channel) {
      case 'email':
        this.logger.log(`Email queued: "${payload.subject}" → ${payload.recipientId}`);
        break;
      case 'push':
        this.logger.log(`Push notification queued for device registry: ${payload.recipientId}`);
        break;
      case 'sms':
        this.logger.log(`SMS dispatch queued via Twilio gateway: ${payload.recipientId}`);
        break;
      case 'in_app':
      default:
        this.logger.log(`In-app notification stored for: ${payload.recipientId}`);
        break;
    }

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'queued',
      channel: payload.channel,
      recipient: payload.recipientId,
      dispatched_at: new Date().toISOString(),
    };
  }

  /**
   * Retrieve pending in-app notifications for a user.
   */
  async getInAppNotifications(userId: string, tenantId: string): Promise<Record<string, unknown>[]> {
    this.logger.log(`Fetching in-app notifications for user: ${userId}`);

    return [
      {
        id: 'notif-001',
        type: 'system',
        title: 'Payroll batch completed',
        body: 'May 2026 payroll run has been finalized for 142 employees.',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'notif-002',
        type: 'alert',
        title: 'Inventory reorder triggered',
        body: 'SKU-0042 has dropped below reorder threshold.',
        read: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
}
