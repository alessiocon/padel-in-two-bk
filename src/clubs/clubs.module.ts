import { Module } from '@nestjs/common';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubUseCase,
  ListClubsUseCase,
  UpdateClubUseCase,
} from './application/club-use-cases.js';
import { CLUB_REPOSITORY } from './domain/club-repository.js';
import { PrismaClubRepository } from './infrastructure/prisma-club-repository.js';
import { ClubsController } from './presentation/clubs.controller.js';
import { BOOKING_REPOSITORY } from '../bookings/domain/booking-repository.js';
import { PrismaBookingRepository } from '../bookings/infrastructure/prisma-booking-repository.js';

@Module({
  controllers: [ClubsController],
  providers: [
    PrismaClubRepository,
    PrismaBookingRepository,
    { provide: CLUB_REPOSITORY, useExisting: PrismaClubRepository },
    { provide: BOOKING_REPOSITORY, useExisting: PrismaBookingRepository },
    CreateClubUseCase,
    ListClubsUseCase,
    GetClubUseCase,
    UpdateClubUseCase,
    DeleteClubUseCase,
  ],
  exports: [CreateClubUseCase, ListClubsUseCase, GetClubUseCase, UpdateClubUseCase, DeleteClubUseCase],
})
export class ClubsModule {}