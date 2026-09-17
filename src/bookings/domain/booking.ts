import { BookingPastDateError } from "./booking-errors.js";

export enum BookingStatus { RESERVED = "reserved" ,PENDING = "pending" ,CONFIRMED = "confirmed" ,CANCELLED = "cancelled" };

export type BookingProps = {
  id: string;
  clubId: string;
  courtId: string;
  userId: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateBookingProps = {
  status?: BookingStatus,
  description?: string
};

export class Booking {
  private constructor(private props: BookingProps) {
    Booking.validate(props);
  }

  static create(
    input: Omit<BookingProps, 'id' | 'status' | 'updatedAt'>,

    id = crypto.randomUUID(),
  ): Booking {

    if (input.startsAt < input.createdAt) {
        throw new BookingPastDateError(); // Eccezione di dominio custom
    }

    return new Booking({
      id,
      clubId: input.clubId,
      courtId: input.courtId,
      userId: input.userId,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: BookingStatus.PENDING,
      createdAt: input.createdAt,
      updatedAt:  input.createdAt
    });
  }

  static reconstitute(props: BookingProps): Booking {
    return new Booking({ 
      ...props, 
      startsAt: new Date(props.startsAt), 
      endsAt: new Date(props.endsAt) });
  }

  get id(): string { return this.props.id; }
  get clubId(): string { return this.props.clubId; }
  get courtId(): string { return this.props.courtId; }
  get userId(): string {return this.props.userId}
  get description() : string|undefined {return this.props.description}
  get startsAt(): Date { return new Date(this.props.startsAt); }
  get endsAt(): Date { return new Date(this.props.endsAt); }
  get status(): BookingStatus { return this.props.status; }


  // isOccupying(): boolean { return this.status !== 'free'; }

  updateDetails(changes: UpdateBookingProps): void {
   
    const updatedProps: BookingProps = {
      ...this.props,
      status: changes.status || this.status,
      description: changes.description || this.description,
      updatedAt: new Date(),
    };

    // Riesegui le validazioni generali dell'entità
    Booking.validate(updatedProps);

    // Applica le modifiche allo stato interno
    this.props = updatedProps;
  }

  overlaps(other: Booking): boolean {
      return (
      this.courtId === other.courtId &&
      // this.isOccupying() &&
      // other.isOccupying() &&
      this.startsAt < other.endsAt &&
      this.endsAt > other.startsAt
    );
  }

  toPrimitives(): BookingProps {
  return {
    ...this.props,
    startsAt: this.startsAt,
    endsAt: this.endsAt,
    description: this.description,
    createdAt: new Date(this.props.createdAt),
    updatedAt: new Date(this.props.updatedAt),
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
