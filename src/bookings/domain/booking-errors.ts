export class BookingCourtNotFoundError extends Error {
  constructor(courtId: string) {
    super(`Court not found: ${courtId}`);
    this.name = 'BookingCourtNotFoundError';
  }
}

export class BookingNotFoundError extends Error {
  constructor(id: string) {
    super(`Booking not found: ${id}`);
    this.name = 'BookingNotFoundError';
  }
}

export class BookingConflictError extends Error {
  constructor() {
    super('Court is already booked for the requested interval');
    this.name = 'BookingConflictError';
  }
}
