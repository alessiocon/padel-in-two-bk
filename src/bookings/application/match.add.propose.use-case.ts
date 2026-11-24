import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { GetClubStaffUseCase } from "../../clubs/application/club-use-cases.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { BookingMatchResDto, MatchProposeDto } from "../presentation/booking.dto.js";
import { MatchFormat } from "../../tournament/domain/tournamentMatch.entity.js";
import { CLUB_IREPOSITORY, type IClubRepository } from "../../clubs/infrastructure/club-IRepository.js";
import { DateTime } from "luxon";
import { SaveBookingMatchService } from './save-booking-match.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingMatchProposedEvent } from '../domain/booking-events.js';
import { ENV_CONFIG, type AppEnv } from '../../config/env.js';


export type MatchAddProposeUseCaseInput = {
  bookingId: string;
  userId: string;
  playerId: string;
  username: string;
  matches: MatchProposeDto[]
  format: MatchFormat;
  isStaff: boolean;
};


@Injectable()
export class MatchAddProposeUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_IREPOSITORY) private readonly clubRepository: IClubRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    private readonly getClubStaffUseCase : GetClubStaffUseCase,
    private readonly saveBookingMatch: SaveBookingMatchService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(ENV_CONFIG) private readonly env: AppEnv,
  ) {}

    async execute(input: MatchAddProposeUseCaseInput): Promise<BookingMatchResDto> {
        const time = this.clock.now();
        const booking = await this.bookingRepository.findById(input.bookingId);
        const club = await this.clubRepository.findById(booking.clubId);
        if(club === null) throw new NotFoundException("Club non trovato");

        let [nowInTimeZone]= club.convertInTimeZone([time.toISOString()]);

        const now = DateTime.fromJSDate(nowInTimeZone); 
        const start = DateTime.fromJSDate(booking.startsAt);
        const extendedDeadline = start.plus({ minutes: this.env.matchProposalDelayMinutes });
  
        if (this.env.matchProposalDelayMinutes != 0 && now < extendedDeadline) {
          const diff = now.diff(extendedDeadline, ['days', 'hours', 'minutes', 'seconds']).toObject();

          const days = Math.floor(diff.days || 0);
          const hours = Math.floor(diff.hours || 0);
          const minutes = Math.floor(diff.minutes || 0);
          const seconds = Math.floor(diff.seconds || 0);

          const parts: string[] = [];
          if (days > 0) parts.push(`${days} giorni`);
          if (hours > 0 || days > 0) parts.push(`${hours} ore`);
          parts.push(`${minutes} minuti`);
          parts.push(`${seconds} secondi`);
  
          throw new BadRequestException( `Non puoi ancora creare un match, è troppo presto. Potrai farlo tra: ${parts.join(', ')}.`);
        }
        
        if(input.isStaff){
          const members = await this.getClubStaffUseCase.execute(booking.clubId);
          if (!members.find(member => member.userId === input.userId )) { throw new ForbiddenException("Autorizzazione non concessa") }
        }

        let updatedBooking = booking.AddMatchPropose({
          ...input,
          time
        })

        const savedMatch = await this.saveBookingMatch.execute(booking, updatedBooking);
        this.eventEmitter.emit('booking.match.proposed', new BookingMatchProposedEvent(
          input.bookingId, input.userId, input.username, updatedBooking.match?.proposeByTeamId,
        ));
        return savedMatch;
    }
}