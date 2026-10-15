import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingResDto, BookingUserResDto } from '../presentation/booking.dto.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';

export type SearchBookingsInput = {
  clubId: string;
  from?: string;
  to?: string;
};

@Injectable()
export class SearchBookingsUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(input: SearchBookingsInput): Promise<BookingUserResDto[]> {
    const now = this.clock.now();
    const fromValue = input.from
    const toValue = input.to;
    const defaultDate = !fromValue && !toValue
      ? now.toISOString().slice(0, 10)
      : undefined;
      
    const from = this.parseDate(fromValue ?? defaultDate, false);
    const to = this.parseDate(toValue ?? defaultDate, true);

    if (from && to && from > to) {
      throw new BadRequestException('La data iniziale non può essere successiva alla data finale.');
    }

    return this.bookingRepository.RO_FindAllByClubId(input.clubId, from, to);
  }

  private parseDate(value: string | undefined, endOfDay: boolean): Date | undefined {
    if (!value) return undefined;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('Le date devono essere nel formato YYYY-MM-DD.');
    }

    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('La data specificata non è valida.');
    }

    return date;
  }
}