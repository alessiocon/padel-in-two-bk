import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingPublicJoinRequestedEvent } from "../domain/booking-events.js";
import { BookingPlayerStatus } from "../domain/entity/booking.player.entity.js";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PLAYER_IREPOSITORY, type IPlayerRepository } from "../../player/infrastructure/player-IRepository.js";



@Injectable()
export class JoinPublicBookingUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(PLAYER_IREPOSITORY) private readonly playerRepository: IPlayerRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: { bookingId: string; teamId: string; playerId?: string; userId: string; username: string }) {

    if (!input.playerId) throw new BadRequestException('È necessario un profilo giocatore per partecipare.');

    const booking = await this.bookingRepository.findById(input.bookingId);
   
    const player = await this.playerRepository.findByUserId(input.userId);
    if (player.id !== input.playerId) throw new ForbiddenException('Profilo giocatore non autorizzato.');

    let isPlayerFree = await this.bookingRepository.isUsersFreeForBooking([input.playerId], booking.startsAt, booking.endsAt);
    if(!isPlayerFree){
        throw new BadRequestException("hai già una prenotazione per questo intervallo di tempo.");
    }

    const updatedBooking = booking.joinPublicBooking({
      teamId: input.teamId,
      playerId: input.playerId,
      userId: input.userId,
      username: input.username,
      time: this.clock.now(),
    });

    await this.bookingRepository.update(updatedBooking, booking.updatedAt);

    const status = updatedBooking.teams.find(team => team.id === input.teamId)?.players.find(participant => participant.playerId === input.playerId)?.status;
      
    if (!status) throw new BadRequestException('Impossibile determinare lo stato del giocatore nella squadra.');
    const result = { bookingId: updatedBooking.id, teamId: input.teamId, playerId: input.playerId, status };
    
    if (result.status === BookingPlayerStatus.REQUESTED) {
      this.eventEmitter.emit('booking.public-join.requested', new BookingPublicJoinRequestedEvent(
        result.bookingId, input.userId, input.username,
      ));
    }

    return result;
  }
}