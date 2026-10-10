export enum BookingPlayerStatus { PENDING = "PENDING", ACCEPTED= "ACCEPTED", DECLINED= "DECLINED", REMOVED = "REMOVED"}


export type RegisteredPlayerIdentity = {
  readonly type: 'REGISTERED';
  readonly userId: string;
};

export type GuestPlayerIdentity = {
  readonly type: 'GUEST';
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
};

export type PlayerIdentity = RegisteredPlayerIdentity | GuestPlayerIdentity;

export type BookingPlayerProps = {
  readonly id: string;
  readonly teamId: string;
  readonly status: BookingPlayerStatus;
  readonly identity: PlayerIdentity;
};

export class BookingPlayer {
  private constructor(private props: BookingPlayerProps) {
    BookingPlayer.validate(props);
  }

  public static create(
    input: Omit<BookingPlayerProps, 'id'>,
    id = crypto.randomUUID(),
  ): BookingPlayer {
    return new BookingPlayer({
      id,
      teamId: input.teamId,
      status: input.status,
      identity: input.identity,
    });
  }

  public static reconstitute(props: BookingPlayerProps): BookingPlayer {
    return new BookingPlayer(props);
  }

  public get id(): string { return this.props.id; }
  public get teamId(): string { return this.props.teamId; }
  public get status(): BookingPlayerStatus {return this.props.status}
  public get identity(): PlayerIdentity { return this.props.identity; }

  public get userId(): string | null {
    return this.props.identity.type === 'REGISTERED' ? this.props.identity.userId : null;
  }

  public get guestDetails(): { firstName: string; lastName: string; phone?: string } | null {
    if (this.props.identity.type === 'GUEST') {
      return {
        firstName: this.props.identity.firstName,
        lastName: this.props.identity.lastName,
        phone: this.props.identity.phone,
      };
    }
    return null;
  }

  public toPrimitives() {
    return {
      id: this.props.id,
      teamId: this.props.teamId,
      userId: this.userId,
      status: this.status,
      firstName: this.props.identity.type === 'GUEST' ? this.props.identity.firstName : null,
      lastName: this.props.identity.type === 'GUEST' ? this.props.identity.lastName : null,
      phone: this.props.identity.type === 'GUEST' ? (this.props.identity.phone ?? null) : null,
    };
  }

  private static validate(props: BookingPlayerProps): void {
    if (!props.teamId) {
      throw new Error('BookingPlayer must belong to a team.');
    }
    if (props.identity.type === 'REGISTERED') {
      if (!props.identity.userId || props.identity.userId.trim() === '') {
        throw new Error('Registered player must have a valid userId.');
      }
    } else if (props.identity.type === 'GUEST') {
      if (!props.identity.firstName || props.identity.firstName.trim() === '') {
        throw new Error('Guest player must have a valid first name.');
      }
      if (!props.identity.lastName || props.identity.lastName.trim() === '') {
        throw new Error('Guest player must have a valid last name.');
      }
    } else {
      throw new Error('Invalid player identity type.');
    }
  }
}