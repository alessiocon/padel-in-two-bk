import { BadRequestException } from "@nestjs/common";
import { BookingPastDateError } from "./booking-errors.js";

export enum BookingStatus { RESERVED = "reserved" ,PENDING = "pending" ,CONFIRMED = "confirmed" ,CANCELLED = "cancelled" };
export enum BookingCancBy { USER = "user" ,CLUB = "club" };

export type BookingProps = {
  id: string;
  clubId: string;
  courtId: string;
  userId: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;

  cancBy: BookingCancBy | null;
  cancAt: Date | null;
  cancPostConfirm: boolean | null;
  cancReason: string | null;

  createdAt: Date;
  updatedAt: Date;
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
      userId: input.userId,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,

      cancBy: null,
      cancPostConfirm: null,
      cancReason: null,
      cancAt: null,

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

  get cancBy(): BookingCancBy|null { return this.props.cancBy; }
  get cancPostConfirm(): boolean|null { return this.props.cancPostConfirm; }
  get cancReason(): string|null { return this.props.cancReason; }
  get cancAt(): Date|null { return this.props.cancAt; }

  get endsAt(): Date { return new Date(this.props.endsAt); }
  get status(): BookingStatus { return this.props.status; }


  updateDetails(changes: UpdateBookingProps): void {

    const updatedProps: BookingProps = {
      ...this.props,
      description: changes.description || this.description,
      updatedAt: changes.updateDate,
    };

    // Riesegui le validazioni generali dell'entità
    Booking.validate(updatedProps);

    // Applica le modifiche allo stato interno
    this.props = updatedProps;
  }

  updateCancelDetails(input : Pick<BookingProps, 'cancAt' | 'cancBy' | 'cancPostConfirm' | 'cancReason' | 'cancAt' | 'status' | 'updatedAt'>){
    const updatedProps: BookingProps = {
      ...this.props,
      ...input,
    };

    this.props = updatedProps;
  }


  acceptBooking(time: Date){
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
