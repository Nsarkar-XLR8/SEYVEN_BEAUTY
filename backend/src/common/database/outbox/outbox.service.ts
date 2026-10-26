import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, OutboxStatus } from '@prisma/client';

export interface OutboxEventInput<T = unknown> {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: T;
}

@Injectable()
export class OutboxPublisher {
  private readonly logger = new Logger(OutboxPublisher.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically records a domain event in the transactional outbox table.
   * Can be executed inside an existing Prisma transaction client or standalone.
   */
  async publish<T>(
    event: OutboxEventInput<T>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    
    const createdEvent = await client.transactionalOutbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload as Prisma.InputJsonValue,
        status: OutboxStatus.PENDING,
      },
    });

    this.logger.debug(
      `[Outbox] Event created: ${event.eventType} for ${event.aggregateType} [${event.aggregateId}]`,
    );

    return createdEvent;
  }

  /**
   * Fetches pending outbox events for worker relay.
   */
  async fetchPending(batchSize = 50) {
    return this.prisma.transactionalOutbox.findMany({
      where: {
        status: OutboxStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: batchSize,
    });
  }

  /**
   * Marks an outbox event as successfully dispatched.
   */
  async markAsPublished(id: string) {
    return this.prisma.transactionalOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.PUBLISHED,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Marks an outbox event as failed with retry increment.
   */
  async markAsFailed(id: string, errorMessage: string) {
    return this.prisma.transactionalOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.FAILED,
        retryCount: { increment: 1 },
        lastError: errorMessage,
      },
    });
  }
}
