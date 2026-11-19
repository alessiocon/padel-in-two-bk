import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { GetClubStaffUseCase } from "../../clubs/application/club-use-cases.js";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStaffRespondedEvent } from '../domain/booking-events.js';

  @Injectable()
  export class AcceptBookingUseCase {
    constructor(
      @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
      @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
      private readonly getClubStaffUseCase : GetClubStaffUseCase,
      private readonly eventEmitter: EventEmitter2,
    ) {}

    async execute(bookingId: string, userId: string, username: string): Promise<boolean> {
      const time = this.clock.now();
      const booking = await this.bookingRepository.findById(bookingId);

      if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}

      const members = await this.getClubStaffUseCase.execute(booking.clubId);
      if (!members.find(member => member.userId === userId )) { throw new ForbiddenException("Autorizzazione non concessa") }

      let bookingAccepted = booking.acceptPrenotation(userId, username, time);

      await this.bookingRepository.hasOverlappingBooking(bookingAccepted.courtId, bookingAccepted.startsAt, bookingAccepted.endsAt, bookingAccepted.id);
      await this.bookingRepository.update(bookingAccepted);
      this.eventEmitter.emit('booking.staff.responded', new BookingStaffRespondedEvent(
        bookingId, userId, username, true,
      ));

      return true;
    }
  }
