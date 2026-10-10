import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { CLUB_REPOSITORY, type IClubRepository } from "../../clubs/domain/club-IRepository.js";
import { BookingResDto, CreateBookingTeamDto } from "../presentation/booking.dto.js";
import { Booking, BookingStatus } from "../domain/booking.aggregate.js";
import { BookingTeam } from "../domain/entity/booking.team.entity.js";
import { BookingPlayer, BookingPlayerStatus } from "../domain/entity/booking.player.entity.js";
import { BookingAuditLog, BookingEventType } from "../domain/valueObject/booking.auditLog.value.js";
import { BookingMapper } from "../infrastructure/prisma-booking-mapper.js";

export type CreateBookingInput = {
  clubId: string;
  createdById: string;
  username: string;
  courtId: string;
  startsAt: string;
  description?: string;
  slots?: number;
  status: BookingStatus;
  teams: CreateBookingTeamInput[];
};

export type CreateBookingTeamInput = {
    teamName: string;
    players: CreateBookingPlayerInput[];
}

export type CreateBookingPlayerInput = {
      userId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
}


@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: IClubRepository
  ) {}
  
  async execute(input: CreateBookingInput ): Promise<BookingResDto> {
    const club = await this.clubRepository.findById(input.clubId);
    if (!club) {
      throw new NotFoundException(`Club with ID ${input.clubId} does not exist.`);
    }

    // TODO: SOLO IN FASE DI DEMO C'è questa limitazione di una prenotazione a settimana
    if (club.ownerId != input.createdById) {
      await this.countWeekForUser(input.startsAt, input.clubId, input.createdById);
    }
    
    const endsAtUTC = club.calculateBookingEnd(input.startsAt, input.slots ?? 1);
    const court = club.courts.find(c => c.id === input.courtId);
    if (!court) {
      throw new NotFoundException(`Court with ID ${input.courtId} does not exist in club ${input.clubId}.`);
    }

    court.validateSlotOperatingHours(
      input.startsAt, 
      endsAtUTC.toISOString(), 
      club.timezone, 
      club.openingTime, 
      club.closingTime, 
      club.slotDurationMinutes
    );
    
    const [startAtUTC] = club.convertInTimeZone([input.startsAt]);
    
    await this.bookingRepository.hasOverlappingBooking(input.courtId, startAtUTC, endsAtUTC);
    
    const now = this.clock.now();
    const isClubOwner = club.ownerId === input.createdById
    const initialStatus = isClubOwner ? BookingStatus.RESERVED :  BookingStatus.PENDING ;
    
    let booking = Booking.create({
      clubId: input.clubId,
      courtId: input.courtId,
      createdById: input.createdById,
      description: input.description,
      startsAt: startAtUTC,
      endsAt: endsAtUTC,
      status: initialStatus,
      logs: [],
      teams: [],
      createdAt: now,
    });

    // 2. Aggiunta delle squadre e dei giocatori (se presenti nel payload)
    if (input.teams && input.teams.length > 0) {
      input.teams.forEach((teamDto, teamIndex) => {
        let team = BookingTeam.create({
          bookingId: booking.id,
          teamNumber: teamIndex + 1,
          teamName: teamDto.teamName,
        });

        teamDto.players.forEach(playerDto => {
          const identity = playerDto.userId
            ? { type: 'REGISTERED' as const, userId: playerDto.userId }
            : {
                type: 'GUEST' as const,
                firstName: playerDto.firstName ?? 'Ospite',
                lastName: playerDto.lastName ?? '',
                phone: playerDto.phone,
              };

          //Accetta l'utente ma se registrato e non è il cratore aspetta conferma
          let status = BookingPlayerStatus.ACCEPTED;
          if(identity.userId && identity.userId !== input.createdById ){
            status =  BookingPlayerStatus.PENDING;
            //TODO: INVIA INVITO DI PARTECIPAZIONE TRAMITE EMAIL
          }

          const player = BookingPlayer.create({
            teamId: team.id,
            status,
            identity,
          });

          team = team.addPlayer(player);
        });

        booking = booking.addTeam(team, now);
      });
    }

    // 3. Creazione del log di audit iniziale (Value Object)
    const auditLog = BookingAuditLog.create({
      bookingId: booking.id,
      userId: input.createdById,
      eventType: BookingEventType.CREATED,
      message: `Prenotazione creata da ${input.username} per il campo: ${court.name}`,
      createdAt:now,
    });

    booking = booking.addAuditLog(auditLog, now);

    //TODO: DA SISTEMARE IL REPOSITORY
    const savedBooking = await this.bookingRepository.create(booking);
    return BookingMapper.domainBookingToDto(savedBooking);
  }





  private async countWeekForUser(startsAt: string, clubId: string, userId: string) {
    const targetDate = new Date(startsAt);
    
    const startOfWeek = new Date(targetDate);
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const existingCount = await this.bookingRepository.countUserBookingsInWeek(
      clubId,
      userId,
      startOfWeek,
      endOfWeek,
    );

    if (existingCount >= 1) {
      throw new BadRequestException(
        "In questa demo: puoi effettuare al massimo 1 prenotazione a settimana per ciascun club."
      );
    }
  }
}