import { Inject, Injectable } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingRes } from "../presentation/booking.dto.js";
import { BookingLogs, BookingEventType } from "../domain/valueObject/booking.log.value.js";
import { BookingMapper } from "../infrastructure/prisma-booking-mapper.js";

export type IsAcceptedBookingByUserInput = {
  bookingId: string;
  userId: string;
  username: string;
  isAccepted: boolean;
};


@Injectable()
export class IsAcceptedBookingByUserUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ){}
  
  async execute(input: IsAcceptedBookingByUserInput): Promise<BookingRes> {
   
    
    const now = this.clock.now();
    let  booking = await this.bookingRepository.findById(input.bookingId);

    booking = booking.isAcceptedBookingByUser(input.userId, input.isAccepted, now);

    const auditLog = BookingLogs.create({
      bookingId: booking.id,
      userId: input.userId,
      eventType: BookingEventType.PLAYER_LEFT,
      message: `${input.username} ha ${input.isAccepted ? 'accettato' : 'rifiutato'} la prenotazione.`,
      createdAt:now,
    });

    booking = booking.addLogs([auditLog], now);

    const updateBooking = await this.bookingRepository.update(booking);
    return BookingMapper.domainBookingToDto(updateBooking);
  }
}