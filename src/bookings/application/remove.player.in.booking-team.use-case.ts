import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingDetailResDto } from '../presentation/booking.dto.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingPlayerRemovedEvent } from '../domain/booking-events.js';

export type RemovePlayerInBookingTeamInput = {
  bookingId: string;
  teamId: string;
  playerId: string;
  playerUsername: string;
  requesterId: string;
  requesterUsername: string;
};

@Injectable()
export class RemovePlayerInBookingTeamUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: RemovePlayerInBookingTeamInput): Promise<BookingDetailResDto> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (booking.createdById !== input.requesterId) {
      throw new ForbiddenException('Solo il creatore della prenotazione può rimuovere i partecipanti.');
    }

    const updatedBooking = booking.removePlayerFromTeam(
      input.teamId,
      input.playerId,
      input.playerUsername,
      input.requesterId,
      input.requesterUsername,
      this.clock.now(),
    );

    const savedBooking = await this.bookingRepository.update(updatedBooking);
    this.eventEmitter.emit('booking.player.removed', new BookingPlayerRemovedEvent(
      input.bookingId, input.requesterId, input.requesterUsername, input.playerId,
    ));
    return savedBooking;
  }
}