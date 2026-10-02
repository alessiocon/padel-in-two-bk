import { MatchFormat, TournamentMatch } from './../tournamentMatch.entity.js';

export class BracketGeneratorDomainService {
  /**
   * Genera la struttura vuota dell'albero delle partite per un torneo a eliminazione diretta
   * in base al numero totale di squadre previste.
   * 
   * @param tournamentId ID del torneo
   * @param totalTeams Numero totale di squadre che parteciperanno al tabellone principale
   */
  public static generateKnockoutBracket(
    tournamentId: string,
    totalTeams: number,
    time: Date
  ): TournamentMatch[] {
    if (totalTeams < 2) {
      throw new Error('Impossibile generare il tabellone: servono almeno 2 squadre iscritte.');
    }

    // 1. Trova la potenza di 2 immediatamente successiva o uguale (es. 6 squadre -> bracket di 8)
    const bracketSize = BracketGeneratorDomainService.nextPowerOfTwo(totalTeams);
    const totalRounds = Math.log2(bracketSize);

    const matches: TournamentMatch[] = [];

    // 2. Costruiamo i match per ogni round (dalla finale = round 1, salendo verso i turni preliminari)
    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);

      for (let matchOrder = 0; matchOrder < matchesInRound; matchOrder++) {
        const match = TournamentMatch.create({
          tournamentId,
          courtId: null,
          team1Id: null,
          team2Id: null,
          round,
          format: MatchFormat.SINGLE_SET,
          matchOrder,
          scheduledAt: null,
          createdAt: time
        });

        matches.push(match);
      }
    }

    return matches;
  }

  private static nextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }
}