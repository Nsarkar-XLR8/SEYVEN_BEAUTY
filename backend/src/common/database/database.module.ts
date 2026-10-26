import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OutboxPublisher } from './outbox/outbox.service';

@Global()
@Module({
  providers: [PrismaService, OutboxPublisher],
  exports: [PrismaService, OutboxPublisher],
})
export class DatabaseModule {}
