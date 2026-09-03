import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateBookingUseCase, GetBookingUseCase } from './application/booking-use-cases.js';
import { BOOKING_REPOSITORY } from './domain/booking-repository.js';
import { PrismaBookingRepository } from './infrastructure/prisma-booking-repository.js';
import { BookingsController } from './presentation/bookings.controller.js';

@Module({
  controllers: [BookingsController],
  providers: [
    PrismaService,
    PrismaBookingRepository,
    { provide: BOOKING_REPOSITORY, useExisting: PrismaBookingRepository },
    CreateBookingUseCase,
    GetBookingUseCase,
  ],
  exports: [CreateBookingUseCase, GetBookingUseCase],
})
export class BookingsModule {}
