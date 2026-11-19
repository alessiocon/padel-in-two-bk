export abstract class BookingEvent {
  constructor(
    public readonly bookingId: string,
    public readonly actorId: string,
    public readonly actorUsername: string,
  ) {}
}

export class BookingCreatedEvent extends BookingEvent {}

export class BookingPlayerInvitedEvent extends BookingEvent {
  constructor(bookingId: string, actorId: string, actorUsername: string, public readonly playerId: string) {
    super(bookingId, actorId, actorUsername);
  }
}

export class BookingStaffRespondedEvent extends BookingEvent {
  constructor(
    bookingId: string,
    actorId: string,
    actorUsername: string,
    public readonly isAccepted: boolean,
    public readonly reason?: string | null,
  ) {
    super(bookingId, actorId, actorUsername);
  }
}

export class BookingPlayerRespondedEvent extends BookingEvent {
  constructor(bookingId: string, actorId: string, actorUsername: string, public readonly isAccepted: boolean) {
    super(bookingId, actorId, actorUsername);
  }
}

export class BookingMatchProposedEvent extends BookingEvent {}

export class BookingMatchRespondedEvent extends BookingEvent {
  constructor(bookingId: string, actorId: string, actorUsername: string, public readonly isAccepted: boolean) {
    super(bookingId, actorId, actorUsername);
  }
}

export class BookingPlayerRemovedEvent extends BookingEvent {
  constructor(bookingId: string, actorId: string, actorUsername: string, public readonly playerId: string) {
    super(bookingId, actorId, actorUsername);
  }
}