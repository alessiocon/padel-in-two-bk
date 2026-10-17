export enum BookingEventType {
  CREATED = "CREATED",
  INSERT = "INSERT",
  REMOVED = "REMOVED",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  STATUS_CHANGED = "STATUS_CHANGED",
  CANCELLED = "CANCELLED",
}

export type BookingLogProps = {
  readonly bookingId: string;
  readonly userId: string | null;
  readonly eventType: BookingEventType;
  readonly message: string;
  readonly createdAt: Date;
};

export class BookingLogs {
  private constructor(private readonly props: BookingLogProps) {
    BookingLogs.validate(props);
  }

  public static create(
    input: BookingLogProps
  ): BookingLogs {
    return new BookingLogs(input);
  }

  public static playerAdded(input: {
    bookingId: string;
    userId: string;
    actorUsername: string;
    targetName: string;
    isRegistered: boolean;
    createdAt: Date;
  }): BookingLogs {
    const action = input.isRegistered ? 'ha invitato' : 'ha aggiunto';
    const targetType = input.isRegistered ? 'UTENTE' : 'OSPITE';

    return this.create({
      bookingId: input.bookingId,
      userId: input.userId,
      eventType: BookingEventType.INSERT,
      message: `${input.actorUsername} ${action} ${input.targetName} (${targetType}).`,
      createdAt: input.createdAt,
    });
  }

  public static bookingCreated(input: {
    bookingId: string;
    userId: string;
    creatorUsername: string;
    courtName: string;
    createdAt: Date;
  }): BookingLogs {
    return this.create({
      bookingId: input.bookingId,
      userId: input.userId,
      eventType: BookingEventType.CREATED,
      message: `Prenotazione creata da ${input.creatorUsername} per il campo: ${input.courtName}`,
      createdAt: input.createdAt,
    });
  }

  public static playerRemoved(input: {
    bookingId: string;
    userId: string;
    actorUsername: string;
    targetName: string;
    isRegistered: boolean;
    createdAt: Date;
  }): BookingLogs {
    const targetType = input.isRegistered ? 'UTENTE' : 'OSPITE';

    return this.create({
      bookingId: input.bookingId,
      userId: input.userId,
      eventType: BookingEventType.REMOVED,
      message: `${input.actorUsername} ha rimosso ${input.targetName} (${targetType}).`,
      createdAt: input.createdAt,
    });
  }

  public static prenotationCancelled(input: {
    bookingId: string;
    userId: string;
    actorUsername: string;
    createdAt: Date;
  }): BookingLogs {
    return this.create({
      bookingId: input.bookingId,
      userId: input.userId,
      eventType: BookingEventType.CANCELLED,
      message: `${input.actorUsername} ha cancellato la prenotazione.`,
      createdAt: input.createdAt,
    });
  }

  public static restorePrenotation(input: {
    bookingId: string;
    userId: string;
    actorUsername: string;
    createdAt: Date;
  }): BookingLogs {
    return this.create({
      bookingId: input.bookingId,
      userId: input.userId,
      eventType: BookingEventType.STATUS_CHANGED,
      message: `${input.actorUsername} ha ripristinato la prenotazione.`,
      createdAt: input.createdAt,
    });
  }

    public static acceptedBooking(input: {
    bookingId: string;
    userId: string;
    actorUsername: string;
    createdAt: Date;
  }): BookingLogs {
    return this.create({
      bookingId: input.bookingId,
      userId: input.userId,
      eventType: BookingEventType.STATUS_CHANGED,
      message: "il club ha accettato la prenotazione.",
      createdAt: input.createdAt,
    });
  }



  public static reconstitute(props: BookingLogProps): BookingLogs {
    return new BookingLogs({
      ...props,
      createdAt: new Date(props.createdAt),
    });
  }

  public get bookingId(): string { return this.props.bookingId; }
  public get userId(): string | null { return this.props.userId; }
  public get eventType(): BookingEventType { return this.props.eventType; }
  public get message(): string { return this.props.message; }
  public get createdAt(): Date { return new Date(this.props.createdAt); }

  /**
   * Verifica l'uguaglianza strutturale (Value Object equality)
   */
  public equals(other: BookingLogs): boolean {
    if (!other) return false;
    return (
      this.bookingId === other.bookingId &&
      this.userId === other.userId &&
      this.eventType === other.eventType &&
      this.message === other.message &&
      this.createdAt.getTime() === other.createdAt.getTime()
    );
  }

  public toPrimitives(): BookingLogProps {
    return { ...this.props };
  }

  private static validate(props: BookingLogProps): void {
    if (!props.bookingId || props.bookingId.trim() === '') {
      throw new Error('BookingLogs must be associated with a valid bookingId.');
    }
    if (!props.eventType) {
      throw new Error('BookingLogs requires a valid eventType.');
    }
    if (!props.message || props.message.trim() === '') {
      throw new Error('BookingLogs requires a descriptive message.');
    }
    if (Number.isNaN(props.createdAt.getTime())) {
      throw new Error('BookingLogs creation date must be valid.');
    }
  }
}