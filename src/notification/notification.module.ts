import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EMAIL_SERVICE } from './domain/ports/email.service.port.js';
import { NodemailerAdapter } from './infrastructure/adapters/nodemailer.adapter.js';
import { UserRegisteredListener } from './application/listners/user.listener.js'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: NodemailerAdapter,
    },
    UserRegisteredListener,
  ],
  exports: [EMAIL_SERVICE],
})
export class NotificationModule {}