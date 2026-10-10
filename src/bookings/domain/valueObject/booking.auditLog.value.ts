export enum BookingEventType {
  CREATED = "CREATED",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  STATUS_CHANGED = "STATUS_CHANGED",
  CANCELLED = "CANCELLED",
}

export type BookingAuditLogProps = {
  readonly bookingId: string;
  readonly userId: string | null;
  readonly eventType: BookingEventType;
  readonly message: string;
  readonly createdAt: Date;
};

export class BookingAuditLog {
  private constructor(private readonly props: BookingAuditLogProps) {
    BookingAuditLog.validate(props);
  }

  public static create(
    input: BookingAuditLogProps
  ): BookingAuditLog {
    return new BookingAuditLog(input);
  }

  public static reconstitute(props: BookingAuditLogProps): BookingAuditLog {
    return new BookingAuditLog({
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
  public equals(other: BookingAuditLog): boolean {
    if (!other) return false;
    return (
      this.bookingId === other.bookingId &&
      this.userId === other.userId &&
      this.eventType === other.eventType &&
      this.message === other.message &&
      this.createdAt.getTime() === other.createdAt.getTime()
    );
  }

  public toPrimitives(): BookingAuditLogProps {
    return { ...this.props };
  }

  private static validate(props: BookingAuditLogProps): void {
    if (!props.bookingId || props.bookingId.trim() === '') {
      throw new Error('BookingAuditLog must be associated with a valid bookingId.');
    }
    if (!props.eventType) {
      throw new Error('BookingAuditLog requires a valid eventType.');
    }
    if (!props.message || props.message.trim() === '') {
      throw new Error('BookingAuditLog requires a descriptive message.');
    }
    if (Number.isNaN(props.createdAt.getTime())) {
      throw new Error('BookingAuditLog creation date must be valid.');
    }
  }
}