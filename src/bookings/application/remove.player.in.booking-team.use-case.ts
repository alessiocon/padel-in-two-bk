import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingDetailResDto } from '../presentation/booking.dto.js';

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

    return await this.bookingRepository.update(updatedBooking);
  }
}