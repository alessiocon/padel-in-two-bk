import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { CalendarBookingResDto, SearchBookingQueryDto } from '../presentation/booking.dto.js';
import { toBookingSearchFilter } from './booking-search-filter.js';

@Injectable()
export class GetCalendarBookingsUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(search: SearchBookingQueryDto): Promise<CalendarBookingResDto[]> {
    const filter = toBookingSearchFilter(search);
    if (!filter.from || !filter.to) {
      throw new BadRequestException('Specificare un intervallo di date per il calendario.');
    }

    return this.bookingRepository.RO_GetCalendarBookings(filter);
  }
}