import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingNotFoundError } from "../domain/booking-errors.js";
import { BookingMatchResDto } from "../presentation/booking.dto.js";

@Injectable()
export class GetMatchByBookingId {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly repository: IBookingRepository,
  ) {}

  async execute(bookingId: string, userId: string, playerId: string): Promise<BookingMatchResDto | null> {

    const match = await this.repository.RO_FindMatchByBookingId(bookingId, userId, playerId);
    if (!match) {
      throw new NotFoundException("Match non trovato");
    }
    return match;
  }
}