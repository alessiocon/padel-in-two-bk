import { BookingResDto, BookingUserResDto } from './../presentation/booking.dto.js';
import type { Booking, BookingStatus } from './booking.js';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface IBookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findAllByClubId(clubId: string, query: string): Promise<Booking[]>;
  hasOverlappingBooking(courtId: string, startsAt: Date, endsAt: Date): Promise<boolean>;
  update(booking: Booking): Promise<Booking>
  delete(bookingId: string): Promise<boolean>

  countUserBookingsInWeek(clubId:string, userId: string, from: Date, to: Date): Promise<number>

  RO_FindAllByClubId(clubId: string, query: string): Promise<BookingResDto[]>
  RO_FindAllByUserId(userId: string): Promise<BookingUserResDto[]>
}
