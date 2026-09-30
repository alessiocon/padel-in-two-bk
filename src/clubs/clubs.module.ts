import { Module } from '@nestjs/common';
import {
  CLUB_USE_CASES,
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubByManagerUseCase,
  GetClubUseCase,
  ListClubsUseCase,
} from './application/club-use-cases.js';
import { CLUB_REPOSITORY } from './domain/club-IRepository.js';
import { PrismaClubRepository } from './infrastructure/prisma-club-repository.js';
import { ClubsController } from './presentation/clubs.controller.js';
import { BOOKING_IREPOSITORY } from '../bookings/domain/booking-IRepository.js';
import { PrismaBookingRepository } from '../bookings/infrastructure/prisma-booking-repository.js';
import { UserModule } from '../user/user.module.js';

@Module({
  controllers: [ClubsController],
  providers: [
    PrismaClubRepository,
    PrismaBookingRepository,
    { provide: CLUB_REPOSITORY, useExisting: PrismaClubRepository },
    { provide: BOOKING_IREPOSITORY, useExisting: PrismaBookingRepository },
    ...CLUB_USE_CASES
  ],
  imports: [UserModule],
  exports: [...CLUB_USE_CASES, PrismaClubRepository],
})
export class ClubsModule {}