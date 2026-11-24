import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingLogs, BookingEventType } from "../domain/valueObject/booking.log.value.js";
import { BookingDetailResDto } from "../presentation/booking.dto.js";
import { type IPlayerRepository, PLAYER_IREPOSITORY } from "../../player/infrastructure/player-IRepository.js";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingPlayerRespondedEvent } from '../domain/booking-events.js';

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
    @Inject(PLAYER_IREPOSITORY) private readonly playerRepository: IPlayerRepository,
    private readonly eventEmitter: EventEmitter2,
  ){}
  
  async execute(input: IsAcceptedBookingByUserInput): Promise<BookingDetailResDto> {
   
    
    const now = this.clock.now();
    let  booking = await this.bookingRepository.findById(input.bookingId);
    let player = await this.playerRepository.findByUserId(input.userId);
    if(!player) throw new BadRequestException("Player non trovato");

    if(input.isAccepted === true){
      let isPlayerFree = await this.bookingRepository.isUsersFreeForBooking([player.id], booking.startsAt, booking.endsAt, booking.id);
      if(!isPlayerFree) {
        throw new BadRequestException("hai già una prenotazione per questo intervallo di tempo.");
      }
    }

    booking = booking.isAcceptedBookingByUser(input.userId, player.id, input.username, input.isAccepted, now);
    
    const savedBooking = await this.bookingRepository.update(booking);

    this.eventEmitter.emit('booking.player.responded', new BookingPlayerRespondedEvent(
      input.bookingId, input.userId, input.username, input.isAccepted,
    ));
    return savedBooking;
  }
}