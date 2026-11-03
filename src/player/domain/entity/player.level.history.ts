export type PlayerLevelHistoryProps = {
  readonly id: string;
  readonly playerId: string;
  readonly bookingMatchId?: string | null;
  readonly tournamentMatchId?: string | null;
  readonly levelBefore: number;
  readonly levelAfter: number;
  readonly createdAt: Date;
};

export class PlayerLevelHistory {
  private constructor(private props: PlayerLevelHistoryProps) {
    PlayerLevelHistory.validate(props);
  }

  static create(
    input: Omit<PlayerLevelHistoryProps, 'id' | 'createdAt'>,
    id = crypto.randomUUID(),
    createdAt = new Date(),
  ): PlayerLevelHistory {
    return new PlayerLevelHistory({
      ...input,
      id,
      createdAt,
    });
  }

  static reconstitute(props: PlayerLevelHistoryProps): PlayerLevelHistory {
    return new PlayerLevelHistory(props);
  }

  get id(): string { return this.props.id; }
  get playerId(): string { return this.props.playerId; }
  get bookingMatchId(): string | null | undefined { return this.props.bookingMatchId; }
  get tournamentMatchId(): string | null | undefined { return this.props.tournamentMatchId; }
  get levelBefore(): number { return this.props.levelBefore; }
  get levelAfter(): number { return this.props.levelAfter; }
  get createdAt(): Date { return new Date(this.props.createdAt); }

  public toPrimitives() {
    return { ...this.props };
  }

  private static validate(props: PlayerLevelHistoryProps): void {
    if (!props.id || !props.playerId) {
      throw new Error('PlayerLevelHistory requires an id and a playerId');
    }
    if (props.levelBefore < 1.00 || props.levelAfter < 1.00) {
      throw new Error('Player levels cannot be less than 1.00');
    }
    if (!props.bookingMatchId && !props.tournamentMatchId) {
      throw new Error('PlayerLevelHistory must be linked to either a booking match or a tournament match');
    }
  }
}