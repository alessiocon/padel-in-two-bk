import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { GetClubStaffUseCase } from "../../clubs/application/club-use-cases.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingDetailResDto, BookingMatchResDto } from "../presentation/booking.dto.js";


export type AcceptMatchProposeUseCaseInput = {
  bookingId: string;
  userId: string;
  playerId: string;
  username: string;
  isStaff: boolean;
};


@Injectable()
export class MatchRemoveProposeUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly getClubStaffUseCase : GetClubStaffUseCase
  ) {}

    async execute(input: AcceptMatchProposeUseCaseInput): Promise<void> {
        const time = this.clock.now();
        const booking = await this.bookingRepository.findById(input.bookingId);

        if(input.isStaff){
          const members = await this.getClubStaffUseCase.execute(booking.clubId);
          if (!members.find(member => member.userId === input.userId )) { throw new ForbiddenException("Autorizzazione non concessa") }
        }
        
        
        let updatedBooking = booking.removeMatchPropose({
          ...input,
          time
        })
        
        await this.bookingRepository.deleteMatch(updatedBooking);
    }
}