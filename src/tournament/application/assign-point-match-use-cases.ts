import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { SetScoreProps } from '../domain/valueObject/matchScore.value.js';
import { TournamentMatchResDto } from '../presentation/tournament.dto.js';
import { TournamentMapper } from '../infrastracture/prisma-tournament-mapper.js';


@Injectable()
export class AssignPointsMatchUseCase {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  public async execute(tournamentId: string, matchId: string, score: SetScoreProps[]): Promise<TournamentMatchResDto> {
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

    tournament.recordScore({ 
        matchId, 
        score,
        updatedAt: time
    })

    await this.tournamentRepository.updateSetsMatch(match);
    return TournamentMapper.tournamentMatchToDto(tournament, match.id)
  }
}