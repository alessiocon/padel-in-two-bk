import { Inject, Injectable } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { TournamentsResDto } from '../presentation/tournament.dto.js';

@Injectable()
export class GetTournamentsUseCases {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository
  ) {}

  async execute(): Promise<TournamentsResDto[]> {
    return await this.tournamentRepository.RO_tournament_findAll();
  }
}