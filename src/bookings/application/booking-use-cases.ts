import { Inject, Injectable,NotFoundException,ForbiddenException, BadRequestException } from '@nestjs/common';
import { Booking, BookingCancBy, BookingStatus, UpdateBookingProps } from '../domain/booking.aggregate.js';
import { BookingNotFoundError } from '../domain/booking-errors.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { CLUB_REPOSITORY, type IClubRepository } from '../../clubs/domain/club-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BookingRes, BookingUserResDto } from '../presentation/booking.dto.js';
import { BookingMapper } from '../infrastructure/prisma-booking-mapper.js';
import { GetClubStaffUseCase, GetClubUseCase } from '../../clubs/application/club-use-cases.js';
import { CreateBookingUseCase } from './create-booking-use-cases.js';
import { IsAcceptedBookingByUserUseCase } from './isAccepted-booking-by-user-use-cases.js';
import { InviteBookingUseCase } from './invite.booking.use-case.js';
import { RemovePlayerInBookingTeamUseCase } from './remove.player.in.booking-team.use-case.js';
import { SearchBookingsUseCase } from './search.bookings.use-case.js';
import { CancelPrenotationUseCase } from './cancel.prenotation.use-case.js';
import { RestorePrenotationUseCase } from './restore.prenotation.use-case.js';
import { SearchBookingsManagerUseCase } from './search.bookings.manager.use-case.js';
import { GetBookingByIdUseCase } from './get.booking.by-id.use-case.js';
import { AcceptBookingUseCase } from './accept.boocking.use-case.js';


export type UpdateBookingInput = {
  clubId: string;
  bookingId: string;
  userId: string;
  status?: BookingStatus;
};






@Injectable()
export class ChangeBookingUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(input: UpdateBookingInput) {
    const time = this.clock.now()
    const booking = await this.bookingRepository.findById(input.bookingId);

    if(booking.clubId !== input.clubId){
      throw new NotFoundException(`La prenotazione con ID ${input.bookingId} non appartiene al club con ID ${input.clubId}`);
    }

    let updatedBooking = booking.updateDetails({
      updateDate: time
    })

    await this.bookingRepository.hasOverlappingBooking(booking.courtId, booking.startsAt, booking.endsAt, booking.id);
   

    return await this.bookingRepository.update(updatedBooking);
  }
}

export const BOOKING_USE_CASES = [
    CreateBookingUseCase,
    GetBookingByIdUseCase,
    ChangeBookingUseCase,
    CancelPrenotationUseCase,
    AcceptBookingUseCase,
    RestorePrenotationUseCase,
    IsAcceptedBookingByUserUseCase,
    InviteBookingUseCase,
    RemovePlayerInBookingTeamUseCase,
    SearchBookingsUseCase,
    SearchBookingsManagerUseCase
  ];
