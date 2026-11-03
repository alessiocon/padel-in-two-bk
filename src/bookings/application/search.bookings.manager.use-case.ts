import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingQuickResDto, SearchBookingQuery } from '../presentation/booking.dto.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { SearchBookingsUseCase } from './search.bookings.use-case.js';
import { GetClubStaffUseCase } from '../../clubs/application/club-use-cases.js';

@Injectable()
export class SearchBookingsManagerUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    private readonly getClubStaffUseCase : GetClubStaffUseCase,
    private readonly searchBookingUseCase : SearchBookingsUseCase
  ) {}

  async execute(input: SearchBookingQuery): Promise<BookingQuickResDto[]> {
    if(!input.clubId) throw new BadRequestException("Nessun riferimento al club inserito");
    let members = await this.getClubStaffUseCase.execute(input.clubId);
    if (!members.find(member => member.userId === input.member)) { throw new ForbiddenException("Autorizzazione non concessa")}

    return this.searchBookingUseCase.execute(input)
  }
}