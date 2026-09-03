import { Inject, Injectable } from '@nestjs/common';
import { Booking, type BookingStatus } from '../domain/booking.js';
import { BookingNotFoundError } from '../domain/booking-errors.js';
import { BOOKING_REPOSITORY, type IBookingRepository } from '../domain/booking-repository.js';

export type CreateBookingInput = {
  clubId: string;
  courtId: string;
  startsAt: Date;
  status?: BookingStatus;
};

@Injectable()
export class CreateBookingUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  execute(input: CreateBookingInput): Promise<Booking> {
    return this.repository.create(Booking.create(input));
  }
}

@Injectable()
export class GetBookingUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(id: string, clubId: string): Promise<Booking> {
    const booking = await this.repository.findById(id, clubId);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    return booking;
  }
}
