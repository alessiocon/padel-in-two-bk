import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PLAYER_IREPOSITORY, type IPlayerRepository } from '../../player/infrastructure/player-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';

@Injectable()
export class WithdrawPublicJoinRequestUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(PLAYER_IREPOSITORY) private readonly playerRepository: IPlayerRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(input: { bookingId: string; playerId?: string; userId: string; username: string }) {
    if (!input.playerId) throw new BadRequestException('È necessario un profilo giocatore per ritirare la richiesta.');
    const booking = await this.bookingRepository.findById(input.bookingId);
    const player = await this.playerRepository.findByUserId(input.userId);
    if (player.id !== input.playerId) throw new ForbiddenException('Profilo giocatore non autorizzato.');
    const outcome = booking.withdrawPublicJoinRequest({
      playerId: input.playerId,
      userId: input.userId,
      username: input.username,
      time: this.clock.now(),
    });
    await this.bookingRepository.update(outcome.booking, booking.updatedAt);
    return { bookingId: booking.id, teamId: outcome.teamId, playerId: outcome.playerId, status: outcome.status };
  }
}