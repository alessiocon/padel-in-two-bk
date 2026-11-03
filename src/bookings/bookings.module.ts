import { Module } from '@nestjs/common';
import { BOOKING_USE_CASES } from './application/booking-use-cases.js';
import { BOOKING_IREPOSITORY } from './infrastructure/booking-IRepository.js';
import { PrismaBookingRepository } from './infrastructure/prisma-booking-repository.js';
import { BookingsController } from './presentation/bookings.controller.js';
import { CLUB_IREPOSITORY } from '../clubs/domain/club-IRepository.js';
import { PrismaClubRepository } from '../clubs/infrastructure/prisma-club-repository.js';
import { ClubsModule } from '../clubs/clubs.module.js';
import { PLAYER_IREPOSITORY } from '../player/infrastructure/player-IRepository.js';
import { PrismaPlayerRepository } from '../player/infrastructure/prisma.player.repository.js';
import { PlayersModule } from '../player/players.module.js';

@Module({
  imports: [ClubsModule, PlayersModule],
  controllers: [BookingsController],
  providers: [
    PrismaBookingRepository,
    { provide: BOOKING_IREPOSITORY, useExisting: PrismaBookingRepository },
    { provide: CLUB_IREPOSITORY, useExisting: PrismaClubRepository },
    { provide: PLAYER_IREPOSITORY, useExisting: PrismaPlayerRepository },
    ...BOOKING_USE_CASES
  ],
  exports: [...BOOKING_USE_CASES],
})
export class BookingsModule {}
