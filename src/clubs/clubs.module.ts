import { Module } from '@nestjs/common';
import {
  CLUB_USE_CASES,
} from './application/club-use-cases.js';
import { CLUB_IREPOSITORY } from './infrastructure/club-IRepository.js';
import { PrismaClubRepository } from './infrastructure/prisma-club-repository.js';
import { ClubsController } from './presentation/clubs.controller.js';
import { BOOKING_IREPOSITORY } from '../bookings/infrastructure/booking-IRepository.js';
import { PrismaBookingRepository } from '../bookings/infrastructure/prisma-booking-repository.js';
import { UserModule } from '../user/user.module.js';
import { PromotionsPersistenceModule } from '../promotions/infrastructure/promotions-persistence.module.js';

@Module({
  controllers: [ClubsController],
  providers: [
    PrismaClubRepository,
    PrismaBookingRepository,
    { provide: CLUB_IREPOSITORY, useExisting: PrismaClubRepository },
    { provide: BOOKING_IREPOSITORY, useExisting: PrismaBookingRepository },
    ...CLUB_USE_CASES
  ],
  imports: [UserModule, PromotionsPersistenceModule],
  exports: [...CLUB_USE_CASES, PrismaClubRepository, CLUB_IREPOSITORY],
})
export class ClubsModule {}