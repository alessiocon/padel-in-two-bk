import { Inject, Injectable } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { TournamentResDto } from '../presentation/tournament.dto.js';

@Injectable()
export class GetTournamentUseCases {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(tournamentId: string): Promise<TournamentResDto> {
    return await this.tournamentRepository.RO_tournament_findById(tournamentId);
  }
}