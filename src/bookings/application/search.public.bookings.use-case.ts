import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { SearchBookingQuery, PublicBookingResDto } from '../presentation/booking.dto.js';
import { toBookingSearchFilter } from './booking-search-filter.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';

@Injectable()
export class SearchPublicBookingsUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(input: SearchBookingQuery): Promise<PublicBookingResDto[]> {
    const filter = toBookingSearchFilter(input);

    return this.bookingRepository.RO_SearchPublicBookings({ 
        clubId: filter.clubId,
        from: this.clock.now()});
  }
} 
