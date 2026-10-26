import { Injectable, Logger } from '@nestjs/common';
import { OutboxPublisher } from '../common/database/outbox/outbox.service';

@Injectable()
export class OutboxRelayProcessor {
  private readonly logger = new Logger(OutboxRelayProcessor.name);
  private isProcessing = false;

  constructor(private readonly outboxPublisher: OutboxPublisher) {}

  /**
   * Reads pending events from PostgreSQL transactional outbox and dispatches them.
   */
  async processOutboxBatch() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const pendingEvents = await this.outboxPublisher.fetchPending(50);
      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`[Outbox Relay] Processing ${pendingEvents.length} pending events`);

      for (const event of pendingEvents) {
        try {
          // Domain event dispatching logic
          this.logger.debug(
            `[Outbox Relay] Relayed event ${event.eventType} (${event.id}) for ${event.aggregateType}`,
          );
          await this.outboxPublisher.markAsPublished(event.id);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `❌ [Outbox Relay] Failed to dispatch event ${event.id}: ${errorMessage}`,
          );
          await this.outboxPublisher.markAsFailed(event.id, errorMessage);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
