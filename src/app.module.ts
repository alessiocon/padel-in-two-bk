import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClubsModule } from './clubs/clubs.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { UserModule } from './user/user.module.js';
import { CoreModule } from './core.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NotificationModule } from './notification/notification.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Abilita gli eventi in memoria
    EventEmitterModule.forRoot(),
    CoreModule,
    ClubsModule,
    BookingsModule,
    UserModule,
    AuthModule,
    NotificationModule
  ],
})
export class AppModule {}