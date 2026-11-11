import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingMatch } from '../domain/entity/booking.match.entity.js';
import { BookingQuickResDto, BookingDetailResDto, SearchBookingQuery, BookingMatchResDto } from '../presentation/booking.dto.js';

export const BOOKING_IREPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface IBookingRepository {
  create(booking: Booking): Promise<BookingQuickResDto>;
  findById(id: string): Promise<Booking>;
  // findAllByClubId(clubId: string, query: string): Promise<Booking[]>;
  hasOverlappingBooking(courtId: string, startsAt: Date, endsAt: Date, excludeBookingId?: string): Promise<void>;
  update(booking: Booking): Promise<BookingDetailResDto>
  
  delete(bookingId: string): Promise<boolean>

  saveMatch(booking: Booking, expectedUpdatedAt: Date): Promise<BookingMatchResDto>
  deleteMatch(booking: Booking): Promise<void>

  countUserBookingsInWeek(clubId:string, userId: string, from: Date, to: Date): Promise<number>

  RO_FindAllByClubId(clubId: string, from?: Date, to?: Date): Promise<BookingQuickResDto[]>
  RO_SearchBookings(query: SearchBookingQuery | {from?: Date, to?: Date}): Promise<BookingQuickResDto[]>
  RO_FindDetailsById(id: string, userId: string, playerId: string): Promise<BookingDetailResDto>
  RO_FindMatchByBookingId(id: string, userId: string, playerId: string): Promise<BookingMatchResDto | null>
}
