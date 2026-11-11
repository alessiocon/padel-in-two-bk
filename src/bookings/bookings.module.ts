import { Module } from '@nestjs/common';
import { BOOKING_USE_CASES } from './application/booking-use-cases.js';
import { BOOKING_IREPOSITORY } from './infrastructure/booking-IRepository.js';
import { PrismaBookingRepository } from './infrastructure/prisma-booking-repository.js';
import { BookingsController } from './presentation/bookings.controller.js';
import { CLUB_IREPOSITORY } from '../clubs/infrastructure/club-IRepository.js';
import { PrismaClubRepository } from '../clubs/infrastructure/prisma-club-repository.js';
import { ClubsModule } from '../clubs/clubs.module.js';
import { PLAYER_IREPOSITORY } from '../player/infrastructure/player-IRepository.js';
import { PrismaPlayerRepository } from '../player/infrastructure/prisma.player.repository.js';
import { PlayersModule } from '../player/players.module.js';
import { ClubPricingModule } from '../club-pricing/club-pricing.module.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { SaveBookingMatchService } from './application/save-booking-match.service.js';
import { BOOKING_MATCH_UNIT_OF_WORK } from './application/booking-match.unit-of-work.js';
import { PrismaBookingMatchUnitOfWork } from './infrastructure/prisma-booking-match.unit-of-work.js';

@Module({
  imports: [ClubsModule, PlayersModule, ClubPricingModule, PromotionsModule],
  controllers: [BookingsController],
  providers: [
    SaveBookingMatchService,
    { provide: BOOKING_MATCH_UNIT_OF_WORK, useClass: PrismaBookingMatchUnitOfWork },
    PrismaBookingRepository,
    { provide: BOOKING_IREPOSITORY, useExisting: PrismaBookingRepository },
    { provide: CLUB_IREPOSITORY, useExisting: PrismaClubRepository },
    { provide: PLAYER_IREPOSITORY, useExisting: PrismaPlayerRepository },
    ...BOOKING_USE_CASES
  ],
  exports: [...BOOKING_USE_CASES],
})
export class BookingsModule {}
