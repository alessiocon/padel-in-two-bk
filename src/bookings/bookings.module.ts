import { Module } from '@nestjs/common';
import { BOOKING_USE_CASES } from './application/booking-use-cases.js';
import { BOOKING_IREPOSITORY } from './infrastructure/booking-IRepository.js';
import { PrismaBookingRepository } from './infrastructure/prisma-booking-repository.js';
import { BookingsController } from './presentation/bookings.controller.js';
import { CLUB_REPOSITORY } from '../clubs/domain/club-IRepository.js';
import { PrismaClubRepository } from '../clubs/infrastructure/prisma-club-repository.js';
import { ClubsModule } from '../clubs/clubs.module.js';

@Module({
  imports: [ClubsModule],
  controllers: [BookingsController],
  providers: [
    PrismaBookingRepository,
    { provide: BOOKING_IREPOSITORY, useExisting: PrismaBookingRepository },
    { provide: CLUB_REPOSITORY, useExisting: PrismaClubRepository },
    ...BOOKING_USE_CASES
  ],
  exports: [...BOOKING_USE_CASES],
})
export class BookingsModule {}
