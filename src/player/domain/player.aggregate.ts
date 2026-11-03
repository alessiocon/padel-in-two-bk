import { BadRequestException } from "@nestjs/common";
import { PlayerLevelHistory } from "./entity/player.level.history.js";

export type PlayerProps = {
  readonly id: string;
  readonly userId: string;
  readonly level: number;
  readonly matchesPlayed: number;
  readonly wins: number;
  readonly losses: number;
  readonly reliabilityScore: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly levelHistory: PlayerLevelHistory[];
};

export class Player {
  private constructor(private props: PlayerProps) {
    Player.validate(props);
  }

  static create(
    userId: string,
    time: Date,
    id = crypto.randomUUID(),
  ): Player {
    return new Player({
      id,
      userId,
      level: 1,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      reliabilityScore: 100.00,
      createdAt: time,
      updatedAt: time,
      levelHistory: []
    });
  }

  static reconstitute(props: PlayerProps): Player {
    return new Player(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get level(): number { return this.props.level; }
  get matchesPlayed(): number { return this.props.matchesPlayed; }
  get wins(): number { return this.props.wins; }
  get losses(): number { return this.props.losses; }
  get reliabilityScore(): number { return this.props.reliabilityScore; }
  get levelHistory(): PlayerLevelHistory[] { return this.props.levelHistory; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }

  public recordMatchResult(won: boolean, newLevel: number, updatedAt: Date): Player {
    return new Player({
      ...this.props,
      matchesPlayed: this.props.matchesPlayed + 1,
      wins: won ? this.props.wins + 1 : this.props.wins,
      losses: !won ? this.props.losses + 1 : this.props.losses,
      level: newLevel,
      updatedAt,
    });
  }

  public updateReliability(newScore: number, updatedAt: Date): Player {
    if (newScore < 0 || newScore > 100) {
      throw new BadRequestException("Il punteggio di affidabilità deve essere compreso tra 0 e 100.");
    }

    return new Player({
      ...this.props,
      reliabilityScore: newScore,
      updatedAt,
    });
  }

  public toPrimitives() {
    return { ...this.props };
  }

  private static validate(props: PlayerProps): void {
    if (!props.id || !props.userId) {
      throw new Error('Player requires an id and a associated userId');
    }
    if (props.level < 1.00) {
      throw new Error('Player level cannot be less than 1.00');
    }
  }
}