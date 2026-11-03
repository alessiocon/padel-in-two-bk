import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingLogs } from '../domain/valueObject/booking.log.value.js';
import { BookingDetailResDto } from '../presentation/booking.dto.js';
import { BookingPlayerStatus } from '../domain/entity/booking.player.entity.js';
import { type IPlayerRepository, PLAYER_IREPOSITORY } from '../../player/infrastructure/player-IRepository.js';

export type InviteBookingInput = {
  bookingId: string;
  teamId: string;
  inviterId: string;
  inviterUsername: string;
  playerId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

@Injectable()
export class InviteBookingUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(PLAYER_IREPOSITORY) private readonly playerRespository: IPlayerRepository,
    
  ) {}

  async execute(input: InviteBookingInput): Promise<BookingDetailResDto> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundException('Prenotazione non trovata.');
    }

    let player = await this.playerRespository.findByUserId(input.inviterId);
    let initialPlayerStatus = BookingPlayerStatus.PENDING;
    if(player.id === input.playerId) initialPlayerStatus = BookingPlayerStatus.ACCEPTED;

    const now = this.clock.now();
    const playerInput = input.playerId
      ? { type: 'REGISTERED' as const, playerId: input.playerId, userId: input.inviterId }
      : {
          type: 'GUEST' as const,
          firstName: input.firstName ?? '',
          lastName: input.lastName ?? '',
          phone: input.phone,
        };

    const playerName = input.playerId
      ? input.username?.trim() || input.playerId
      : `${input.firstName!.trim()} ${input.lastName!.trim()}`;
    
    const inputLog = {
      userId: input.inviterId, 
      actorUsername: input.inviterUsername,
      targetUsername: playerName, 
      isRegistered: Boolean(input.playerId) 
    }

    const updatedBooking = booking.addPlayerToTeam(
      input.teamId, 
      playerInput, 
      now,
      initialPlayerStatus,
      inputLog
    );

    return await this.bookingRepository.update(updatedBooking);
  }
}