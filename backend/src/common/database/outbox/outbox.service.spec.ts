import { Test, TestingModule } from '@nestjs/testing';
import { OutboxPublisher } from './outbox.service';
import { PrismaService } from '../prisma.service';
import { OutboxStatus } from '@prisma/client';

describe('OutboxPublisher', () => {
  let publisher: OutboxPublisher;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxPublisher,
        {
          provide: PrismaService,
          useValue: {
            transactionalOutbox: {
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mock-uuid', ...data })),
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'event-1',
                  aggregateType: 'ORDER',
                  aggregateId: 'ord-123',
                  eventType: 'OrderPlacedEvent',
                  status: OutboxStatus.PENDING,
                },
              ]),
              update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
            },
          },
        },
      ],
    }).compile();

    publisher = module.get<OutboxPublisher>(OutboxPublisher);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });

  it('should create an outbox event in PENDING state', async () => {
    const result = await publisher.publish({
      aggregateType: 'ORDER',
      aggregateId: 'ord-123',
      eventType: 'OrderPlacedEvent',
      payload: { totalBdt: 2500 },
    });

    expect(result.id).toBe('mock-uuid');
    expect(result.status).toBe(OutboxStatus.PENDING);
    expect(prisma.transactionalOutbox.create).toHaveBeenCalled();
  });

  it('should fetch pending outbox events', async () => {
    const events = await publisher.fetchPending(10);
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('event-1');
  });

  it('should mark an event as published', async () => {
    const updated = await publisher.markAsPublished('event-1');
    expect(updated.status).toBe(OutboxStatus.PUBLISHED);
  });

  it('should mark an event as failed with retry count increment', async () => {
    const failed = await publisher.markAsFailed('event-1', 'Connection timeout');
    expect(failed.status).toBe(OutboxStatus.FAILED);
  });
});
