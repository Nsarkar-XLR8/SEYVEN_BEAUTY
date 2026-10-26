import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  [key: string]: any;

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.$connect()
      .then(() => {
        this.logger.log(' Connected to PostgreSQL database via Prisma');
      })
      .catch((err: unknown) => {
        this.logger.warn(
          '⚠️ PostgreSQL unavailable. SEYVEN is operating in resilient persistent storage mode.',
        );
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log(' Disconnected from PostgreSQL database');
  }
}
