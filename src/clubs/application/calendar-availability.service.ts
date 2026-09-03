import { Inject, Injectable } from '@nestjs/common';
import { CLUB_REPOSITORY, type IClubRepository } from '../domain/club-repository.js';
import { BOOKING_REPOSITORY, type IBookingRepository } from '../../bookings/domain/booking-repository.js';
import { CalendarAvailabilityResponseDto, AvailabilityQueryDto} from '../presentation/calendar.dto.js';




@Injectable()
export class CalendarAvailabilityService {
  constructor(
    @Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository,
    @Inject(BOOKING_REPOSITORY) private readonly bookings: IBookingRepository
) {}

    calculateCalendarAvailability(id: string, body: AvailabilityQueryDto): Promise<CalendarAvailabilityResponseDto> {
    



  }
}