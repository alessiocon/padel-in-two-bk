import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingQuickResDto, BookingDetailResDto } from '../presentation/booking.dto.js';

export const BOOKING_IREPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface IBookingRepository {
  create(booking: Booking): Promise<BookingQuickResDto>;
  findById(id: string): Promise<Booking>;
  findAllByClubId(clubId: string, query: string): Promise<Booking[]>;
  hasOverlappingBooking(courtId: string, startsAt: Date, endsAt: Date, excludeBookingId?: string): Promise<void>;
  update(booking: Booking): Promise<BookingDetailResDto>
  delete(bookingId: string): Promise<boolean>

  countUserBookingsInWeek(clubId:string, userId: string, from: Date, to: Date): Promise<number>

  RO_FindAllByClubId(clubId: string, from?: Date, to?: Date): Promise<BookingQuickResDto[]>
  RO_SearchBookings(clubId?: string, from?: Date, to?: Date, userId?: string, status?: BookingStatus): Promise<BookingQuickResDto[]>
  RO_FindDetailsById(id: string, userId: string): Promise<BookingDetailResDto>
}
