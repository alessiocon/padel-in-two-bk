import { BadRequestException } from "@nestjs/common";
import { BookingLogs, BookingEventType } from "../valueObject/booking.log.value.js";
import { BookingPlayer } from "./booking.player.entity.js";

export type BookingTeamPlayerInput =
  | { type: 'REGISTERED'; userId: string }
  | { type: 'GUEST'; firstName: string; lastName: string; phone?: string };

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

  public hasPlayer(userId: string): boolean {
    return this.props.players.some((player) => player.userId === userId);
  }

  public isAcceptedByUser(userId: string, isAccepted: boolean): BookingTeam {
    const player = this.props.players.find((candidate) => candidate.userId === userId);
    if (!player) {
      throw new BadRequestException("L'utente non fa parte della squadra.");
    }

    let updatedPlayers: BookingPlayer[] = [];
    if(!isAccepted ){
      updatedPlayers = this.props.players.filter((candidate) => candidate.id !== player.id);
    }else{
      updatedPlayers = this.props.players.map((candidate) =>
        candidate.id === player.id ? player.respondToInvitation(isAccepted) : candidate,
      );
    }

    return new BookingTeam({
      ...this.props,
      players: updatedPlayers,
    });
  }



  public addPlayer(input: BookingTeamPlayerInput, bookingCreatorId: string): BookingTeam {
    if (this.props.players.length >= 2) {
      throw new BadRequestException("La squadra ha già raggiunto il numero massimo di giocatori.");
    }

    if (input.type === 'REGISTERED' && this.hasPlayer(input.userId)) {
      throw new BadRequestException("L'utente fa già parte della squadra.");
    }

    const player = input.type === 'REGISTERED'
      ? BookingPlayer.createRegisteredInvitation({
          teamId: this.id,
          userId: input.userId,
          bookingCreatorId,
        })
      : BookingPlayer.createGuest({
          teamId: this.id,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        });

    return new BookingTeam({
      ...this.props,
      players: [...this.props.players, player],
    });
  }

  public removePlayer(playerId: string): { team: BookingTeam; player: BookingPlayer } {
    const player = this.props.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new BadRequestException("Il giocatore indicato non fa parte della squadra.");
    }

    return {
      team: new BookingTeam({
        ...this.props,
        players: this.props.players.filter((candidate) => candidate.id !== playerId),
      }),
      player,
    };
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