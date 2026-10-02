import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from './../domain/tournament-IRepository.js';
import { BracketGeneratorDomainService } from './../domain/services/bracket-generator.domain-service.js';
import { TournamentMatch } from './../domain/tournamentMatch.entity.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';

@Injectable()
export class GenerateTournamentBracketUseCase {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  public async execute(tournamentId: string): Promise<TournamentMatch[]> {
    const time = this.clock.now()
    // 1. Recupera il torneo per verificare che esista e prendere le squadre
    const tournament = await this.tournamentRepository.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundException('Torneo non trovato.');
    }

    const teamCount = tournament.teams.length;

    // 2. Chiama il Domain Service per generare la struttura vuota del tabellone
    const bracketMatches = BracketGeneratorDomainService.generateKnockoutBracket(
      tournamentId,
      teamCount,
      time
    );

    // 3. Salva la struttura tramite il repository dedicato
    const savedMatches = await this.tournamentRepository.saveBracket(
      tournamentId,
      bracketMatches,
    );

    return savedMatches;
  }
}