import { Inject, Injectable } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { TournamentMatchResDto } from '../presentation/tournament.dto.js';
import { TournamentMatch } from '../domain/tournamentMatch.entity.js';

@Injectable()
export class GetAllMatchUseCases {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
  ) {}

  async execute(tournamentId: string): Promise<TournamentMatchResDto[]> {
    
    return await this.tournamentRepository.RO_match_findAll(tournamentId);
  }
}