import { Module } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY } from './domain/tournament-IRepository.js';
import { PrismaTournamentRepository } from './infrastracture/prisma-tournament-repository.js';
import { TOURNAMENT_USE_CASES } from './application/tournament-use-cases.js';
import { TournamentController } from './presentation/tournament.controller.js';

@Module({
  imports: [],
  controllers: [TournamentController],
  providers: [
    PrismaTournamentRepository,
    { provide: TOURNAMENT_IREPOSITORY, useExisting: PrismaTournamentRepository },
    ...TOURNAMENT_USE_CASES
  ],
  exports: [...TOURNAMENT_USE_CASES],
})
export class TournamentModule {}
