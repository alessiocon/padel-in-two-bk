import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { GetClubStaffUseCase } from '../../clubs/application/club-use-cases.js';
import { BookingCancBy, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingDetailResDto } from '../presentation/booking.dto.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStaffRespondedEvent } from '../domain/booking-events.js';

type CancelPrenotationInput = { 
    bookingId: string, 
    userId: string,
    username: string,
    reason: string | null, 
    isStaff: boolean
}


@Injectable()
export class CancelPrenotationUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly repository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly getStaffClub: GetClubStaffUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CancelPrenotationInput): Promise<BookingDetailResDto> {
    const time = this.clock.now();
    const booking = await this.repository.findById(input.bookingId);
    
    if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}

    if (booking.status !== BookingStatus.PENDING && 
        booking.status !== BookingStatus.RESERVED && 
        booking.status !== BookingStatus.CONFIRMED
       ){ throw new NotFoundException("Impossibile eliminare la prenotazione in questo stato");}
    
    if(input.isStaff){
      const members = await this.getStaffClub.execute(booking.clubId)
      if(!members.find(member => member.userId === input.userId )) { throw new ForbiddenException("Autorizzazione non concessa");}
      
    }else{
      if (booking.createdById !== input.userId) 
        { throw new ForbiddenException("Autorizzazione non concessa"); }
    }


    let updatedBooking = booking.CancelPrenotation(
        {
            status: BookingStatus.CANCELLED,
            updatedAt: time,
            cancBy: input.isStaff ? BookingCancBy.CLUB : BookingCancBy.USER,
            cancAt: time,
            cancPostConfirm: true,
            cancReason: input.reason
        },
        booking.createdByStaff ? "il Club" : input.username,
        input.userId
    );

    const savedBooking = await this.repository.update(updatedBooking);
    if (input.isStaff) {
      this.eventEmitter.emit('booking.staff.responded', new BookingStaffRespondedEvent(
        input.bookingId, input.userId, input.username, false, input.reason,
      ));
    }
    return savedBooking;
  }
}