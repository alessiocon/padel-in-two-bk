import { Module } from '@nestjs/common';
import { CreateBookingUseCase, GetAllBookingsClubUseCase, GetBookingUseCase } from './application/booking-use-cases.js';
import { BOOKING_REPOSITORY } from './domain/booking-repository.js';
import { PrismaBookingRepository } from './infrastructure/prisma-booking-repository.js';
import { BookingsController } from './presentation/bookings.controller.js';

@Module({
  controllers: [BookingsController],
  providers: [
    PrismaBookingRepository,
    { provide: BOOKING_REPOSITORY, useExisting: PrismaBookingRepository },
    CreateBookingUseCase,
    GetBookingUseCase,
    GetAllBookingsClubUseCase,
  ],
  exports: [CreateBookingUseCase, GetBookingUseCase, GetAllBookingsClubUseCase],
})
export class BookingsModule {}
