import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingQuickResDto, SearchBookingQuery } from '../presentation/booking.dto.js';
import { toBookingSearchFilter } from './booking-search-filter.js';

@Injectable()
export class SearchBookingsUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(input: SearchBookingQuery): Promise<BookingQuickResDto[]> {
    const filter = toBookingSearchFilter(input);
    return this.bookingRepository.RO_SearchBookings({ ...filter, member: undefined });
  } 

  private addCalendarMonth(date: Date): Date {
    const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    const lastDayOfNextMonth = new Date(
      Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0),
    ).getUTCDate();

    return new Date(Date.UTC(
      nextMonth.getUTCFullYear(),
      nextMonth.getUTCMonth(),
      Math.min(date.getUTCDate(), lastDayOfNextMonth),
    ));
  }
}