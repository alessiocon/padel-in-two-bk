import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingQuickResDto, SearchBookingQuery } from '../presentation/booking.dto.js';

@Injectable()
export class SearchBookingsUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(input: SearchBookingQuery): Promise<BookingQuickResDto[]> {
    const fromValue = input.from ?? input.to;
    const toValue = input.to ?? input.from;
    const from = this.parseDate(fromValue, false);
    const toDate = this.parseDate(toValue, false);
    const to = this.parseDate(toValue, true);

    if (from && toDate && from > toDate) {
      throw new BadRequestException('La data iniziale non può essere successiva alla data finale.');
    }

 
    return this.bookingRepository.RO_SearchBookings({
      clubId: input.clubId, 
      from: from, 
      to: to, 
      createdById: input.createdById,
      playerId: input.playerId, 
      status: input.status
    });
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