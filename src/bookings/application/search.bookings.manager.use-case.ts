import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingQuickResDto, SearchBookingQuery } from '../presentation/booking.dto.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { GetClubStaffUseCase } from '../../clubs/application/club-use-cases.js';
import { SearchResponseDto } from '../../cammon/search.res.dto.js';
import { toBookingSearchFilter } from './booking-search-filter.js';

@Injectable()
export class SearchBookingsManagerUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    private readonly getClubStaffUseCase : GetClubStaffUseCase,
  ) {}

  async execute(input: SearchBookingQuery): Promise<SearchResponseDto<BookingQuickResDto>> {
    if(!input.clubId) throw new BadRequestException("Nessun riferimento al club inserito");
    let members = await this.getClubStaffUseCase.execute(input.clubId);
    if (!members.find(member => member.userId === input.member)) { throw new ForbiddenException("Autorizzazione non concessa")}

    const filter = toBookingSearchFilter(input);
    const take = input.take ?? 10;
    const skip = input.skip ?? ((input.page ?? 1) - 1) * take;
    if (skip > 2147483647 || (input.page !== undefined && input.skip !== undefined && skip !== (input.page - 1) * take)) {
      throw new BadRequestException('I parametri di paginazione non sono coerenti.');
    }
    const page = Math.floor(skip / take) + 1;
    const result = await this.bookingRepository.RO_SearchBookingsPage({ ...filter, member: undefined }, take, skip);
    return { ...result, take, skip, page };
  }
}