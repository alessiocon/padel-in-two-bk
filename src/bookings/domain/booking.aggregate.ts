import { BadRequestException } from "@nestjs/common";
import { BookingPastDateError } from "./booking-errors.js";
import { BookingTeam, type BookingTeamPlayerInput } from "./entity/booking.team.entity.js";
import { BookingLogs as BookingLog } from "./valueObject/booking.log.value.js";

export enum BookingStatus { RESERVED = "RESERVED" ,PENDING = "PENDING" ,CONFIRMED = "CONFIRMED" ,CANCELLED = "CANCELLED" };
export enum BookingCancBy { USER = "USER" ,CLUB = "CLUB" };

export type BookingProps = {
  readonly id: string;
  readonly clubId: string;
  readonly courtId: string;
  readonly createdById: string;
  readonly description?: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: BookingStatus;

  readonly teams: ReadonlyArray<BookingTeam>;
  readonly logs: ReadonlyArray<BookingLog>;

  readonly cancBy: BookingCancBy | null;
  readonly cancAt: Date | null;
  readonly cancPostConfirm: boolean | null;
  readonly cancReason: string | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type UpdateBookingProps = {
  description?: string,
  updateDate: Date
};

export class Booking {
  private constructor(private props: BookingProps) {
    Booking.validate(props);
  }

  static create(
    input: Omit<BookingProps, 'id' | 'updatedAt' | 'cancBy' | 'cancAt' | 'cancPostConfirm' | 'cancReason'>,
    id = crypto.randomUUID(),
  ): Booking {
    if (input.startsAt < input.createdAt) {
        throw new BookingPastDateError(); // Eccezione di dominio custom
    }

    return new Booking({
      id,
      clubId: input.clubId,
      courtId: input.courtId,
      createdById: input.createdById,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
      teams: input.teams ?? [],
      logs: input.logs ?? [],

      cancBy: null,
      cancPostConfirm: null,
      cancReason: null,
      cancAt: null,

      createdAt: input.createdAt,
      updatedAt:  input.createdAt
    });
  }

  static reconstitute(props: BookingProps): Booking {
    return new Booking(props);
  }

  get id(): string { return this.props.id; }
  get clubId(): string { return this.props.clubId; }
  get courtId(): string { return this.props.courtId; }
  get createdById(): string {return this.props.createdById}
  get description() : string|undefined {return this.props.description}
  get startsAt(): Date { return new Date(this.props.startsAt); }
  public get teams(): ReadonlyArray<BookingTeam> { return this.props.teams; }
  public get logs(): ReadonlyArray<BookingLog> { return this.props.logs; }

  get cancBy(): BookingCancBy|null { return this.props.cancBy; }
  get cancPostConfirm(): boolean|null { return this.props.cancPostConfirm; }
  get cancReason(): string|null { return this.props.cancReason; }
  get cancAt(): Date|null { return this.props.cancAt; }

  get endsAt(): Date { return new Date(this.props.endsAt); }
  get status(): BookingStatus { return this.props.status; }

  public addTeam(team: BookingTeam, updateAt: Date): Booking {


    return new Booking({
      ...this.props,
      teams: [...this.props.teams, team],
      updatedAt: updateAt,
    });
  }

  public addPlayerToTeam(
    teamId: string,
    playerInput: BookingTeamPlayerInput,
    updatedAt: Date,
  ): Booking {
    const teamIndex = this.props.teams.findIndex((team) => team.id === teamId);
    if (teamIndex === -1) {
      throw new BadRequestException("La squadra indicata non fa parte della prenotazione.");
    }
    if (
      playerInput.type === 'REGISTERED' &&
      this.props.teams.some((team) => team.hasPlayer(playerInput.userId))
    ) {
      throw new BadRequestException("L'utente fa già parte della prenotazione.");
    }

    const teams = [...this.props.teams];
    teams[teamIndex] = teams[teamIndex].addPlayer(playerInput, this.props.createdById);

    return new Booking({
      ...this.props,
      teams,
      updatedAt,
    });
  }

  public removePlayerFromTeam(
    teamId: string,
    playerId: string,
    playerUsername: string,
    creatorId: string,
    creatorUsername: string,
    updatedAt: Date,
  ): Booking {
    if (creatorId !== this.props.createdById) {
      throw new BadRequestException("Solo il creatore della prenotazione può rimuovere i partecipanti.");
    }

    const teamIndex = this.props.teams.findIndex((team) => team.id === teamId);
    if (teamIndex === -1) {
      throw new BadRequestException("La squadra indicata non fa parte della prenotazione.");
    }

    const { team, player } = this.props.teams[teamIndex].removePlayer(playerId);
    const guest = player.guestDetails;

    const auditLog = BookingLog.playerRemoved({
      bookingId: this.id,
      userId: creatorId,
      actorUsername: creatorUsername,
      targetName: playerUsername,
      isRegistered: player.userId !== null,
      createdAt: updatedAt,
    });
    const teams = [...this.props.teams];
    teams[teamIndex] = team;

    return new Booking({
      ...this.props,
      teams,
      logs: [...this.props.logs, auditLog],
      updatedAt,
    });
  }

  public addLogs(log: BookingLog[], updateAt: Date): Booking {
    return new Booking({
      ...this.props,
      logs: [...this.props.logs, ...log],
      updatedAt: updateAt,
    });
  }

  public isAcceptedBookingByUser(userId: string, isAccepted: boolean, updatedAt: Date): Booking {
    if (userId === this.props.createdById) {
      throw new BadRequestException("Il creatore della prenotazione non può accettare o rifiutare la propria prenotazione.");
    }

    const teamIndex = this.props.teams.findIndex((team) => team.hasPlayer(userId));
    if (teamIndex === -1) {
      throw new BadRequestException("L'utente non fa parte della prenotazione.");
    }

    const teams = [...this.props.teams];
    teams[teamIndex] = teams[teamIndex].isAcceptedByUser(userId, isAccepted);

    return new Booking({
      ...this.props,
      teams,
      updatedAt,
    });
  }


  updateDetails(changes: UpdateBookingProps): void {

    const updatedProps: BookingProps = {
      ...this.props,
      description: changes.description ?? this.description,
      updatedAt: changes.updateDate,
    };

    // Riesegui le validazioni generali dell'entità
    Booking.validate(updatedProps);

    // Applica le modifiche allo stato interno
    this.props = updatedProps;
  }

  CancelPrenotation(input : 
    Pick<BookingProps, 'cancAt' | 'cancBy' | 'cancPostConfirm' | 'cancReason' | 'cancAt' | 'status' | 'updatedAt'>, 
    username: string, 
    userId: string)
  : Booking {
      
    const auditLog = BookingLog.prenotationCancelled({
      bookingId: this.id,
      userId: userId,
      actorUsername: username,
      createdAt: input.updatedAt,
    });
    
    return new Booking({
      ...this.props,
      ...input,
      logs: [...this.props.logs, auditLog],
    });
  }
  

  RestorePrenotation(input : 
    Pick<BookingProps, 'cancAt' | 'cancBy' | 'cancPostConfirm' | 'cancReason' | 'cancAt' | 'status' | 'updatedAt'>, 
    username: string, 
    userId: string)
  : Booking {
      
    const auditLog = BookingLog.restorePrenotation({
      bookingId: this.id,
      userId: userId,
      actorUsername: username,
      createdAt: input.updatedAt,
    });
    
    return new Booking({
      ...this.props,
      ...input,
      logs: [...this.props.logs, auditLog],
    });
  }


  acceptPrenotation(time: Date){
      if (this.status !== BookingStatus.PENDING) {throw new BadRequestException("La prenotazione non è in attesa")}
      if(this.cancAt !== null) {throw new BadRequestException("La prenotazione non è più disponibile")}
      
      const updatedProps: BookingProps = {
      ...this.props,
      status: BookingStatus.CONFIRMED,
      updatedAt: time
    };

    this.props = updatedProps;
  }

  overlaps(other: Booking): boolean {
      return (
      this.courtId === other.courtId &&
      this.startsAt < other.endsAt &&
      this.endsAt > other.startsAt
    );
  }

  public toPrimitives() { 
    return { 
      ...this.props,
      teams: this.props.teams.map(t => t.toPrimitives()),
      logs: this.props.logs.map(l => l.toPrimitives()),
    }; 
  }

  private static validate(props: BookingProps): void {
    if (!props.clubId || !props.courtId) {
      throw new Error('Booking requires a club and court');
    }
    if (Number.isNaN(props.startsAt.getTime()) || Number.isNaN(props.endsAt.getTime())) {
      throw new Error('Booking dates must be valid');
    }
    if (props.endsAt <= props.startsAt) {
      throw new Error('Booking end must be after start');
    }
    // if (props.endsAt.getTime() - props.startsAt.getTime() !== BOOKING_DURATION_MINUTES * 60_000) {
    //   throw new Error(`Booking duration must be exactly ${BOOKING_DURATION_MINUTES} minutes`);
    // }
  }
}
