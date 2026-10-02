import { MatchFormat } from "../tournamentMatch.entity.js";

export interface SetScoreProps {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  tieBreak?: boolean;
}

export class MatchScore {
  private constructor(
    private readonly sets: SetScoreProps[],
    private readonly format: MatchFormat
  ) {
    MatchScore.validate(sets, format);
  }

  public static create(sets: SetScoreProps[], format: MatchFormat): MatchScore {
    return new MatchScore(sets, format);
  }

  private static validate(sets: SetScoreProps[], format: MatchFormat): void {
    if (!sets || sets.length === 0) {
      throw new Error('A match score must contain at least one set.');
    }

    if (format === MatchFormat.SINGLE_SET && sets.length > 1) {
      throw new Error('A single set format cannot have more than 1 set.');
    }

    if (format === MatchFormat.BEST_OF_3 && sets.length > 3) {
      throw new Error('A best-of-3 format cannot have more than 3 sets.');
    }

    sets.forEach((set, index) => {
      if (set.setNumber !== index + 1) {
        throw new Error(`Invalid set sequence: expected set number ${index + 1}, got ${set.setNumber}`);
      }

      if (set.team1Games < 0 || set.team2Games < 0) {
        throw new Error('Game counts cannot be negative.');
      }

      if (set.team1Games === set.team2Games) {
        throw new Error('A set cannot end in a draw.');
      }
    });
  }

  // Calcola il vincitore in base al formato stabilito
  public calculateWinner(team1Id: string, team2Id: string): string | null {
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
      if (team1SetsWon === 1) return team1Id;
      if (team2SetsWon === 1) return team2Id;
    }

    if (this.format === MatchFormat.BEST_OF_3) {
      if (team1SetsWon === 2) return team1Id;
      if (team2SetsWon === 2) return team2Id;
    }

    return null;
  }

  public get value(): SetScoreProps[] {
    return [...this.sets];
  }

  public get matchFormat(): MatchFormat {
    return this.format;
  }
}