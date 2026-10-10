import { BookingPlayer } from "./booking.player.entity.js";

export type BookingTeamProps = {
  readonly id: string;
  readonly bookingId: string;
  readonly teamNumber: number;
  readonly teamName: string;  
  readonly players: ReadonlyArray<BookingPlayer>;
};

export class BookingTeam {
  private constructor(private props: BookingTeamProps) {
    BookingTeam.validate(props);
  }

  public static create(
    input: Omit<BookingTeamProps, 'id' | 'players'> & { players?: ReadonlyArray<BookingPlayer> },
    id = crypto.randomUUID(),
  ): BookingTeam {
    return new BookingTeam({
      id,
      bookingId: input.bookingId,
      teamNumber: input.teamNumber,
      teamName: input.teamName,
      players: input.players ?? [],
    });
  }

  public static reconstitute(props: BookingTeamProps): BookingTeam {
    return new BookingTeam(props);
  }

  public get id(): string { return this.props.id; }
  public get bookingId(): string { return this.props.bookingId; }
  public get teamNumber(): number { return this.props.teamNumber; }
  public get teamName(): string { return this.props.teamName; }
  public get players(): ReadonlyArray<BookingPlayer> { return this.props.players; }

  public addPlayer(player: BookingPlayer): BookingTeam {
    return new BookingTeam({
      ...this.props,
      players: [...this.props.players, player],
    });
  }

  public toPrimitives() {
    return {
      id: this.props.id,
      bookingId: this.props.bookingId,
      teamNumber: this.props.teamNumber,
      teamName: this.props.teamName,
      players: this.props.players.map(p => p.toPrimitives()),
    };
  }

  private static validate(props: BookingTeamProps): void {
    if (!props.bookingId) {
      throw new Error('BookingTeam must belong to a booking.');
    }
    if (typeof props.teamNumber !== 'number' || props.teamNumber < 1) {
      throw new Error('Team number must be a valid positive integer.');
    }
    if (!props.teamName || props.teamName.trim() === '') {
      throw new Error('BookingTeam requires a valid team name.');
    }
  }
}