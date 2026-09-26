import { Module } from '@nestjs/common';
import { ChangeBooking, CreateBookingUseCase, DeleteBookingUseCase, GetAllBookingsClubUseCase, GetAllBookingsUserUseCase, GetBookingUseCase } from './application/booking-use-cases.js';
import { BOOKING_REPOSITORY } from './domain/booking-repository.js';
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
    { provide: BOOKING_REPOSITORY, useExisting: PrismaBookingRepository },
    { provide: CLUB_REPOSITORY, useExisting: PrismaClubRepository },
    CreateBookingUseCase,
    GetBookingUseCase,
    GetAllBookingsClubUseCase,
    GetAllBookingsUserUseCase,
    ChangeBooking,
    DeleteBookingUseCase
  ],
  exports: [CreateBookingUseCase, GetBookingUseCase, GetAllBookingsClubUseCase],
})
export class BookingsModule {}
