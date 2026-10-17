import { Inject, Injectable } from "@nestjs/common";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { Booking } from "../domain/booking.aggregate.js";
import { BookingNotFoundError } from "../domain/booking-errors.js";
import { BookingUserResDto } from "../presentation/booking.dto.js";

@Injectable()
export class GetBookingByIdUseCase {
  constructor(@Inject(BOOKING_IREPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(id: string, userId: string): Promise<BookingUserResDto> {
    const booking = await this.repository.RO_FindDetailsById(id, userId);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    return booking;
  }
}