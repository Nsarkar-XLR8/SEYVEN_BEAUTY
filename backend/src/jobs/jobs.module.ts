import { Module } from '@nestjs/common';
import { OutboxRelayProcessor } from './outbox-relay.processor';

@Module({
  providers: [OutboxRelayProcessor],
  exports: [OutboxRelayProcessor],
})
export class JobsModule {}
