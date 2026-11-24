import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BookingPublicJoinRespondedEvent } from '../domain/booking-events.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';

@Injectable()
export class ReviewPublicJoinRequestUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: { bookingId: string; playerRequestId: string; creatorId: string; username: string; accepted: boolean }) {
    const booking = await this.bookingRepository.findById(input.bookingId);

    let isPlayerFree = await this.bookingRepository.isUsersFreeForBooking([input.playerRequestId], booking.startsAt, booking.endsAt);
    if(!isPlayerFree){
        throw new BadRequestException("il giocatore ha già una prenotazione per questo intervallo di tempo.");
    }

    const outcome = booking.reviewPublicJoinRequest({ ...input, time: this.clock.now() });
    await this.bookingRepository.update(outcome.booking, booking.updatedAt);
    this.eventEmitter.emit('booking.public-join.responded', new BookingPublicJoinRespondedEvent(
      booking.id, input.creatorId, input.username, outcome.playerId, input.accepted,
    ));
    return { bookingId: booking.id, teamId: outcome.teamId, playerId: outcome.playerId, status: outcome.status };
  }
}