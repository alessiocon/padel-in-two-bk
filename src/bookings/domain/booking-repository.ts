import type { Booking } from './booking.js';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface IBookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string, clubId: string): Promise<Booking | null>;
  findAllByClubId(clubId: string): Promise<Booking[]>;
}
