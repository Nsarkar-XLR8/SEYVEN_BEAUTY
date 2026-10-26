import { Test, TestingModule } from '@nestjs/testing';
import { OutboxRelayProcessor } from './outbox-relay.processor';
import { OutboxPublisher } from '../common/database/outbox/outbox.service';
import { OutboxStatus } from '@prisma/client';

describe('OutboxRelayProcessor', () => {
  let processor: OutboxRelayProcessor;
  let outboxPublisher: OutboxPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxRelayProcessor,
        {
          provide: OutboxPublisher,
          useValue: {
            fetchPending: jest.fn().mockResolvedValue([
              {
                id: 'evt-100',
                aggregateType: 'PAYMENT',
                aggregateId: 'pay-555',
                eventType: 'PaymentAuthorizedEvent',
                payload: { amount: 150 },
                status: OutboxStatus.PENDING,
              },
            ]),
            markAsPublished: jest.fn().mockResolvedValue({ id: 'evt-100', status: OutboxStatus.PUBLISHED }),
            markAsFailed: jest.fn().mockResolvedValue({ id: 'evt-100', status: OutboxStatus.FAILED }),
          },
        },
      ],
    }).compile();

    processor = module.get<OutboxRelayProcessor>(OutboxRelayProcessor);
    outboxPublisher = module.get<OutboxPublisher>(OutboxPublisher);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process pending outbox events and mark them published', async () => {
    await processor.processOutboxBatch();

    expect(outboxPublisher.fetchPending).toHaveBeenCalledWith(50);
    expect(outboxPublisher.markAsPublished).toHaveBeenCalledWith('evt-100');
  });
});
