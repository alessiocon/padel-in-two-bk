import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { TournamentMatchResDto } from '../presentation/tournament.dto.js';
import { TournamentMapper } from '../infrastracture/prisma-tournament-mapper.js';


@Injectable()
export class NextMatchUseCase {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  public async execute(tournamentId: string, matchId: string): Promise<TournamentMatchResDto> {
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

    let nextMatch = tournament.nextMatch({ matchId, updatedAt: time })

    await this.tournamentRepository.updateMatches([nextMatch]);
    return TournamentMapper.tournamentMatchToDto(tournament, nextMatch.id)
  }
}