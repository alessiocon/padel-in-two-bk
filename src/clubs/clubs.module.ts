import { Module } from '@nestjs/common';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubByManagerUseCase,
  GetClubUseCase,
  ListClubsUseCase,
} from './application/club-use-cases.js';
import { CLUB_REPOSITORY } from './domain/club-IRepository.js';
import { PrismaClubRepository } from './infrastructure/prisma-club-repository.js';
import { ClubsController } from './presentation/clubs.controller.js';
import { BOOKING_REPOSITORY } from '../bookings/domain/booking-repository.js';
import { PrismaBookingRepository } from '../bookings/infrastructure/prisma-booking-repository.js';
import { UserModule } from '../user/user.module.js';

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
    DeleteClubUseCase,
    GetClubByManagerUseCase
  ],
  imports: [UserModule],
  exports: [CreateClubUseCase, ListClubsUseCase, GetClubUseCase, DeleteClubUseCase, PrismaClubRepository],
})
export class ClubsModule {}