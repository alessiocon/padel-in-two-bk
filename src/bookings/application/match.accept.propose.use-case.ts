import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { GetClubStaffUseCase } from "../../clubs/application/club-use-cases.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingDetailResDto, BookingMatchResDto, UpdateBookingDto } from "../presentation/booking.dto.js";
import { type IPlayerRepository, PLAYER_IREPOSITORY } from "../../player/infrastructure/player-IRepository.js";
import { SaveBookingMatchService } from './save-booking-match.service.js';


export type MatchAcceptProposeUseCaseInput = {
  bookingId: string;
  userId: string;
  playerId: string;
  username: string;
  isAccepted: boolean
  isStaff: boolean;
};


@Injectable()
export class MatchAcceptProposeUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly getClubStaffUseCase : GetClubStaffUseCase,
    private readonly saveBookingMatch: SaveBookingMatchService,
  ) {}

    async execute(input: MatchAcceptProposeUseCaseInput): Promise<BookingMatchResDto> {
        const time = this.clock.now();
        const booking = await this.bookingRepository.findById(input.bookingId);

        if(input.isStaff){
          const members = await this.getClubStaffUseCase.execute(booking.clubId);
          if (!members.find(member => member.userId === input.userId )) { throw new ForbiddenException("Autorizzazione non concessa") }
        }
        
        let updatedBooking = booking.AcceptMatchPropose({
          ...input,
          time
        })
        
        return await this.saveBookingMatch.execute(booking, updatedBooking);
    }
}