import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from './../domain/tournament-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { MatchFormat, MatchStatus } from '../domain/tournamentMatch.entity.js';
import { TournamentMapper } from '../infrastracture/prisma-tournament-mapper.js';
import { TournamentMatchResDto } from '../presentation/tournament.dto.js';

type input  = {
    courtId?: string | null;
    format?: MatchFormat;
    status?: MatchStatus;
    scheduledAt?: Date;
    team1Id?: string | null;
    team2Id?: string | null;
}


@Injectable()
export class UpdateMatchUseCase {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  public async execute(tournamentId: string, matchId: string, input: input): Promise<TournamentMatchResDto> {
    const time = this.clock.now()
    // 1. Recupera il torneo per verificare che esista e prendere le squadre
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw new NotFoundException('Torneo non trovato.');
    }

    let match = tournament.matches.find(m => m.id === matchId);
    if (!match) {
      throw new NotFoundException('Match non trovato.');
    }


    tournament.updateMatch({
        courtId: input.courtId,
        format: input.format,
        id: matchId,
        status: input.status,
        scheduledAt: input.scheduledAt,
        team1Id: input.team1Id,
        team2Id: input.team2Id,
        updatedAt: time
    })

    await this.tournamentRepository.updateMatch(match);
    return TournamentMapper.tournamentMatchToDto(tournament, match.id)
  }
}