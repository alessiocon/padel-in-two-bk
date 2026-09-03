import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubUseCase,
  ListClubsUseCase,
  UpdateClubUseCase,
} from './application/club-use-cases.js';
import { CLUB_REPOSITORY } from './domain/club-repository.js';
import { PrismaClubRepository } from './infrastructure/prisma-club-repository.js';
import { CalendarAvailabilityService } from './application/calendar-availability.service.js';
import { CalendarController } from './presentation/calendar.controller.js';
import { ClubsController } from './presentation/clubs.controller.js';

@Module({
  controllers: [ClubsController, CalendarController],
  providers: [
    PrismaService,
    PrismaClubRepository,
    CalendarAvailabilityService,
    { provide: CLUB_REPOSITORY, useExisting: PrismaClubRepository },
    CreateClubUseCase,
    ListClubsUseCase,
    GetClubUseCase,
    UpdateClubUseCase,
    DeleteClubUseCase,
  ],
  exports: [CreateClubUseCase, ListClubsUseCase, GetClubUseCase, UpdateClubUseCase, DeleteClubUseCase],
})
export class ClubsModule {}