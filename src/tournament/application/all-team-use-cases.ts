import { Inject, Injectable } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { TournamentTeamResDto } from '../presentation/tournament.dto.js';

@Injectable()
export class GetAllTeamUseCases {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
  ) {}

  async execute(tournamentId: string): Promise<TournamentTeamResDto[]> {
    
    return await this.tournamentRepository.RO_team_findAll(tournamentId);
  }
}