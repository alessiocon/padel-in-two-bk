import { BadRequestException } from '@nestjs/common';
import { TournamentMatch } from './../tournamentMatch.entity.js';

export class BracketManagerDomainService {


  /**
   * Calcola il prossimo match di destinazione e lo slot (team1Id o team2Id)
   * per la squadra che ha vinto un match.
   */
  public static getNextMatchSlot(
    completedMatch: TournamentMatch,
    allMatches: TournamentMatch[]
  ): { targetMatch: TournamentMatch | null; slot: 'team1' | 'team2' } {
    // Trova qual è il round massimo (la finale) presente in tutto il tabellone
    const maxRound = Math.max(...allMatches.map((m) => m.round));

    if (completedMatch.round >= maxRound) {
        return {targetMatch: null, slot: "team1"}
    }

    // Il round successivo ha un numero incrementato (es. da 1 a 2, o da 2 a 3)
    const nextRound = completedMatch.round + 1;
    const nextMatchOrder = Math.floor(completedMatch.matchOrder / 2);

    const targetMatch = allMatches.find(
      (m) => m.round === nextRound && m.matchOrder === nextMatchOrder
    );


    const slot = completedMatch.matchOrder % 2 === 0 ? 'team1' : 'team2';

    return { targetMatch: targetMatch ?? null, slot };
  }
}