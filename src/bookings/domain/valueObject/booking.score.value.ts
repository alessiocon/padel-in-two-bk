import { BadRequestException } from "@nestjs/common";
import { MatchFormat } from "../../../tournament/domain/tournamentMatch.entity.js";

export type BookingSetScoreProps = {
  readonly setNumber: number;
  readonly team1Games: number;
  readonly team2Games: number;
  readonly tieBreak: boolean;
};

export class BookingMatchScore {
  private constructor(
    private readonly sets: ReadonlyArray<BookingSetScoreProps>,
    private readonly format: MatchFormat
  ) {
    BookingMatchScore.validate(sets, format);
  }

  public static create(sets: BookingSetScoreProps[], format: MatchFormat): BookingMatchScore {
    

    return new BookingMatchScore(sets, format);
  }

  private static validate(sets: ReadonlyArray<BookingSetScoreProps>, format: MatchFormat): void {
    if (!sets || sets.length === 0) {
      throw new BadRequestException('A booking match score must contain at least one set.');
    }

    if (format === MatchFormat.SINGLE_SET && sets.length > 1) {
      throw new BadRequestException('Il formato del match scielto può avere un solo set');
    }

    if (format === MatchFormat.BEST_OF_3 && sets.length !== 3) {
      throw new BadRequestException('Il formato del match deve avere 3 set');
    }

    sets.forEach((set, index) => {
      // 1. Sequenza set
      if (set.setNumber !== index + 1) {
        throw new BadRequestException(
          `Sequenza set non valida: atteso set numero ${index + 1}, ricevuto ${set.setNumber}`
        );
      }

      const { team1Games, team2Games, tieBreak } = set;

      // 2. Valori negativi o superiori a 7
      if (team1Games < 0 || team2Games < 0) {
        throw new BadRequestException('Il numero di game non può essere negativo');
      }

      if (team1Games > 7 || team2Games > 7) {
        throw new BadRequestException('Il numero di game non può superare 7');
      }
      // 3. Pareggio
      if (team1Games === team2Games) {
        throw new BadRequestException('Un set non può finire in pareggio');
      }

      // 4. Punteggio minimo per chi vince
      const maxGames = Math.max(team1Games, team2Games);
      const minGames = Math.min(team1Games, team2Games);

      if (maxGames < 6) {
        throw new BadRequestException('La squadra vincente deve arrivare ad almeno 6 game');
      }

      if (maxGames === 6 && minGames === 5) {
        throw new BadRequestException('Un set non può terminare sul 6 - 5: occorre giocare fino a 7-5 o al tie-break 7-6');
      }

      // 6. Validazione dei set finiti a 7 game (ammessi solo 7-5 o 7-6)
      if (maxGames === 7 && minGames < 5) {
        throw new BadRequestException('Un set a 7 game si disputare solo sul 7 - 5 o 7 - 6 (dopo un 5-5 o 6-6)');
      }

      // 7. Coerenza del Flag Tie-break
      if (maxGames === 7 && minGames === 6) {
        if (!tieBreak) {
          throw new BadRequestException('Un set terminato 7 - 6 richiede il flag tieBreak impostato a true');
        }
      } else if (tieBreak) {
        throw new BadRequestException('Il flag tieBreak può essere attivo solo per un punteggio di 7 - 6 o 6 - 7');
      }
    });
  }

  /**
   * Calcola il numero del team vincente (1 o 2) in base ai set e al formato.
   */
  public calculateWinnerTeamNumber(): number {
    let team1SetsWon = 0;
    let team2SetsWon = 0;

    for (const set of this.sets) {
      if (set.team1Games > set.team2Games) {
        team1SetsWon++;
      } else if (set.team2Games > set.team1Games) {
        team2SetsWon++;
      }
    }

    if (this.format === MatchFormat.SINGLE_SET) {
      if (team1SetsWon === 1) return 1;
      if (team2SetsWon === 1) return 2;
    }

    if (this.format === MatchFormat.BEST_OF_3) {
      if (team1SetsWon === 2) return 1;
      if (team2SetsWon === 2) return 2;
    }

    throw new BadRequestException("il punteggio del match ha delle incongruenze")
  }

  public get value(): ReadonlyArray<BookingSetScoreProps> {
    return [...this.sets];
  }

  public get matchFormat(): MatchFormat {
    return this.format;
  }
}