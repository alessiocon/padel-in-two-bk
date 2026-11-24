import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingPlayerStatus } from '../domain/entity/booking.player.entity.js';
import { BookingMatch } from '../domain/entity/booking.match.entity.js';
import { BookingQuickResDto, BookingDetailResDto, SearchBookingQuery, BookingMatchResDto, CalendarBookingResDto, PublicBookingResDto } from '../presentation/booking.dto.js';

export const BOOKING_IREPOSITORY = Symbol('BOOKING_REPOSITORY');

export type BookingSearchFilter = Omit<SearchBookingQuery, 'from' | 'to'> & {
  from?: Date;
  to?: Date;
};

export type PublicBookingJoinResult = {
  bookingId: string;
  teamId: string;
  playerId: string;
  status: BookingPlayerStatus;
};

export interface IBookingRepository {
  create(booking: Booking): Promise<BookingQuickResDto>;
  findById(id: string): Promise<Booking>;
  // findAllByClubId(clubId: string, query: string): Promise<Booking[]>;
  hasOverlappingBooking(courtId: string, startsAt: Date, endsAt: Date, excludeBookingId?: string): Promise<void>;
  isUsersFreeForBooking( playerId: string[], startsAt: Date,  endsAt: Date,  excludeBookingId?: string): Promise<boolean>;
  update(booking: Booking, expectedUpdatedAt?: Date): Promise<BookingDetailResDto>
  
  delete(bookingId: string): Promise<boolean>

  saveMatch(booking: Booking, expectedUpdatedAt: Date): Promise<BookingMatchResDto>
  deleteMatch(booking: Booking): Promise<void>

  countUserBookingsInWeek(clubId:string, userId: string, from: Date, to: Date): Promise<number>

  RO_FindAllByClubId(clubId: string, from?: Date, to?: Date): Promise<BookingQuickResDto[]>
  RO_SearchBookings(query: BookingSearchFilter): Promise<BookingQuickResDto[]>
  RO_SearchPublicBookings(query: BookingSearchFilter): Promise<PublicBookingResDto[]>;
  RO_GetCalendarBookings(query: BookingSearchFilter): Promise<CalendarBookingResDto[]>
  RO_FindDetailsById(id: string, userId: string, playerId: string): Promise<BookingDetailResDto>
  RO_FindMatchByBookingId(id: string, userId: string, playerId: string): Promise<BookingMatchResDto | null>
}
