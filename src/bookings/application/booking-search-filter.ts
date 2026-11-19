import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../domain/booking.aggregate.js';
import type { BookingSearchFilter } from '../infrastructure/booking-IRepository.js';
import type { SearchBookingQuery } from '../presentation/booking.dto.js';

export function toBookingSearchFilter(input: SearchBookingQuery): BookingSearchFilter {
  if (input.status !== undefined && (
    !Array.isArray(input.status) ||
    input.status.some(status => !Object.values(BookingStatus).includes(status))
  )) {
    throw new BadRequestException('Gli stati della prenotazione non sono validi.');
  }

  const fromValue = input.from ?? input.to;
  const toValue = input.to ?? input.from;
  const from = parseDate(fromValue, false);
  const toDate = parseDate(toValue, false);
  const to = parseDate(toValue, true);

  if (from && toDate && from > toDate) {
    throw new BadRequestException('La data iniziale non pu\u00f2 essere successiva alla data finale.');
  }

  return {
    clubId: input.clubId,
    from,
    to,
    createdById: input.createdById,
    playerId: input.playerId,
    member: input.member,
    status: input.status,
  };
}

function parseDate(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value) return undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Le date devono essere nel formato YYYY-MM-DD.');
  }

  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('La data specificata non \u00e8 valida.');
  }

  return date;
}