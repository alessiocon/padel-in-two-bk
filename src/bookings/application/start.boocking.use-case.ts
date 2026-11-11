import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { GetClubStaffUseCase } from "../../clubs/application/club-use-cases.js";
import { CLUB_IREPOSITORY, type IClubRepository } from "../../clubs/infrastructure/club-IRepository.js";
import { DateTime } from "luxon";

  @Injectable()
  export class StartBookingUseCase {
    constructor(
      @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
      @Inject(CLUB_IREPOSITORY) private readonly clubRepository: IClubRepository,
      @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
      private readonly getClubStaffUseCase : GetClubStaffUseCase
    ) {}

    async execute(bookingId: string, userId: string, username: string): Promise<boolean> {
      const time = this.clock.now();
      const booking = await this.bookingRepository.findById(bookingId);
      if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}

      let bookingStart = booking.startPrenotation(userId, username, time);

      const members = await this.getClubStaffUseCase.execute(booking.clubId);
      if (!members.find(member => member.userId === userId )) { throw new ForbiddenException("Autorizzazione non concessa") }

      const club = await this.clubRepository.findById(booking.clubId);
      if(club === null) throw new NotFoundException("Club non trovato");
      
      let [nowInTimeZone]= club.convertInTimeZone([time.toISOString()]);

      const now = DateTime.fromJSDate(nowInTimeZone); 
      const start = DateTime.fromJSDate(booking.startsAt);

      const allowedStartTime = start.minus({ minutes: 15 });

      if (now < allowedStartTime) {
        const diff = allowedStartTime.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();

        const days = Math.floor(diff.days || 0);
        const hours = Math.floor(diff.hours || 0);
        const minutes = Math.floor(diff.minutes || 0);
        const seconds = Math.floor(diff.seconds || 0);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days} giorni`);
        if (hours > 0 || days > 0) parts.push(`${hours} ore`);
        parts.push(`${minutes} minuti`);
        parts.push(`${seconds} secondi`);

        throw new BadRequestException( `Non puoi ancora avviare il match, è troppo presto. Potrai farlo tra: ${parts.join(', ')}.`);
      }
  
      await this.bookingRepository.update(bookingStart);
      return true;
    }
  }
