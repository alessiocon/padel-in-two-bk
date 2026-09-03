export const BOOKING_DURATION_MINUTES = 60;

export type BookingStatus = 'free' | 'reserved' | 'searching' | 'blocked';

export type BookingProps = {
  id: string;
  clubId: string;
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class Booking {
  private constructor(private props: BookingProps) {
    Booking.validate(props);
  }

  static create(
    input: Pick<BookingProps, 'clubId' | 'courtId' | 'startsAt'> & { status?: BookingStatus },
    id = crypto.randomUUID(),
  ): Booking {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(startsAt.getTime() + BOOKING_DURATION_MINUTES * 60_000);
    const now = new Date();

    return new Booking({
      id,
      clubId: input.clubId,
      courtId: input.courtId,
      startsAt,
      endsAt,
      status: input.status ?? 'reserved',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BookingProps): Booking {
    return new Booking({ ...props, startsAt: new Date(props.startsAt), endsAt: new Date(props.endsAt) });
  }

  get id(): string { return this.props.id; }
  get clubId(): string { return this.props.clubId; }
  get courtId(): string { return this.props.courtId; }
  get startsAt(): Date { return new Date(this.props.startsAt); }
  get endsAt(): Date { return new Date(this.props.endsAt); }
  get status(): BookingStatus { return this.props.status; }

  isOccupying(): boolean { return this.status !== 'free'; }

  overlaps(other: Booking): boolean {
    return this.isOccupying() && other.isOccupying()
      && this.startsAt < other.endsAt
      && this.endsAt > other.startsAt;
  }

  toPrimitives(): BookingProps {
    return { ...this.props, startsAt: this.startsAt, endsAt: this.endsAt };
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
    if (props.endsAt.getTime() - props.startsAt.getTime() !== BOOKING_DURATION_MINUTES * 60_000) {
      throw new Error(`Booking duration must be exactly ${BOOKING_DURATION_MINUTES} minutes`);
    }
  }
}
