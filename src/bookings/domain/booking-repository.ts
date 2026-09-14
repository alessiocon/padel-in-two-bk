import type { Booking } from './booking.js';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface IBookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string, clubId: string): Promise<Booking | null>;
  findAllByClubId(clubId: string, query: string): Promise<Booking[]>;
  hasOverlappingBooking(courtId: string, startsAt: Date, endsAt: Date): Promise<boolean>;
  update(booking: Booking): Promise<Booking>
}
