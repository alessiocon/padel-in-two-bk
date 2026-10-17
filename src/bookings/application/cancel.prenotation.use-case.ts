import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { GetClubStaffUseCase } from '../../clubs/application/club-use-cases.js';
import { Booking, BookingCancBy, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingMapper } from '../infrastructure/prisma-booking-mapper.js';
import { BookingRes } from '../presentation/booking.dto.js';

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
    private readonly getStaffClub: GetClubStaffUseCase
  ) {}

  async execute(input: CancelPrenotationInput): Promise<BookingRes> {
    const time = this.clock.now();
    const booking = await this.repository.findById(input.bookingId);

    if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}
    
    if(input.isStaff){
      const staff = await this.getStaffClub.execute(booking.clubId)
      if(!staff.includes(input.userId)) { throw new ForbiddenException("Autorizzazione non concessa");}
      
    }else{
      if (booking.createdById !== input.userId && booking.status === BookingStatus.RESERVED) 
        { throw new ForbiddenException("Autorizzazione non concessa"); }
    }

    if(booking.status === BookingStatus.CANCELLED) { 
        throw new BadRequestException("Prenotazione già cancellata");
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
        input.isStaff ? "il Club" : input.username,
        input.userId
    );

    await this.repository.update(updatedBooking);
    return BookingMapper.domainBookingToDto(updatedBooking);;
  }
}