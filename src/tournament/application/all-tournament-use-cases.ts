import { Inject, Injectable } from '@nestjs/common';
import { Tournament } from '../domain/tournament.aggregate.js';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { TournamentsResDto } from '../presentation/tournament.dto.js';

@Injectable()
export class GetTournamentsUseCases {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(): Promise<TournamentsResDto[]> {
    return await this.tournamentRepository.RO_findAll();
  }
}