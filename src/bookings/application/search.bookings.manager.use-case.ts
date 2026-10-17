import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingQuickResDto } from '../presentation/booking.dto.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { SearchBookingsInput, SearchBookingsUseCase } from './search.bookings.use-case.js';
import { GetClubStaffUseCase } from '../../clubs/application/club-use-cases.js';


export type SearchBookingsManagerInput = SearchBookingsInput & {
  clubId: string;
  managerId: string;
};

@Injectable()
export class SearchBookingsManagerUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    private readonly getClubStaffUseCase : GetClubStaffUseCase,
    private readonly searchBookingUseCase : SearchBookingsUseCase
  ) {}

  async execute(input: SearchBookingsManagerInput): Promise<BookingQuickResDto[]> {
    
    let clubStaff = await this.getClubStaffUseCase.execute(input.clubId);
    if (!clubStaff.includes(input.managerId)) { throw new ForbiddenException("Autorizzazione non concessa")}

    


    return this.searchBookingUseCase.execute(input)
  }
}