import { Inject, Injectable } from '@nestjs/common';
import { Tournament } from '../domain/tournament.aggregate.js';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';

export interface CreateTournamentDto {
  title: string;
  description?: string | null;
  position: string;
  municipality: string;
  province: string;
  award: string;
  startsAt: string;
  endsAt: string;
  isVisible: boolean,
  showTeams: boolean,
  timezone: string;
  maxTeams: number;
}

@Injectable()
export class CreateTournamentUseCase {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(input: CreateTournamentDto): Promise<Tournament> {
    let time = this.clock.now()
    let [startsAtZone, endsAtZone] = Tournament.convertInTimeZone([input.startsAt, input.endsAt], input.timezone)

    const tournament = Tournament.create({
      title: input.title,
      description: input.description ?? null,
      position: input.position,
      municipality: input.municipality,
      province: input.province,
      award: input.award,
      startsAt: startsAtZone,
      endsAt: endsAtZone,
      timezone: input.timezone,
      isVisible: input.isVisible,
      showTeams: input.showTeams,
      maxTeams: input.maxTeams,
      createdAt: time,
      updatedAt: time
    });

    await this.tournamentRepository.create(tournament);
    return tournament;
  }
}