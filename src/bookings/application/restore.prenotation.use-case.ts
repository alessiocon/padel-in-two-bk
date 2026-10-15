import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { GetClubStaffUseCase } from "../../clubs/application/club-use-cases.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BookingCancBy, BookingStatus } from "../domain/booking.aggregate.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingResDto } from "../presentation/booking.dto.js";
import { BookingMapper } from "../infrastructure/prisma-booking-mapper.js";



@Injectable()
export class RestorePrenotationUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly getClubStaffUseCase : GetClubStaffUseCase
  ) {}

  async execute(bookingId: string, userId: string, username: string, isReqStaff: boolean): Promise<BookingResDto> {
    const time = this.clock.now();
    const booking = await this.bookingRepository.findById(bookingId);

    if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}
    if (booking.status !== BookingStatus.CANCELLED) {throw new BadRequestException("La prenotazione non è eliminata")}


    let status = BookingStatus.CANCELLED;
    if(isReqStaff){
      const staff = await this.getClubStaffUseCase.execute(booking.clubId);

      if (!staff.includes(userId)) { throw new ForbiddenException("Autorizzazione non concessa") }
      if (booking.cancBy !== BookingCancBy.CLUB) { throw new ForbiddenException("La cancellazione è partita dall'utente non puoi ripristinarla");}

      status = staff.includes(booking.createdById) ? BookingStatus.RESERVED : BookingStatus.CONFIRMED;

    }else{
      if (booking.createdById !== userId || booking.cancBy !== BookingCancBy.USER) { throw new ForbiddenException("Autorizzazione non concessa");}
      status = booking.cancPostConfirm ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    }

    let updatedBooking = booking.RestorePrenotation(
        {
            status: status,
            updatedAt: time,
            cancBy: null,
            cancAt: null,
            cancPostConfirm: null,
            cancReason: null
        }, 
        isReqStaff ? "il Club" : username,
        userId
    );

    await this.bookingRepository.hasOverlappingBooking(updatedBooking.courtId, updatedBooking.startsAt, updatedBooking.endsAt, updatedBooking.id);
    await this.bookingRepository.update(updatedBooking);

    return BookingMapper.domainBookingToDto(updatedBooking);
}
}