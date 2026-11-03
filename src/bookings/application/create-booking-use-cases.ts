import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { CLUB_IREPOSITORY, type IClubRepository } from "../../clubs/domain/club-IRepository.js";
import { Booking, BookingStatus } from "../domain/booking.aggregate.js";
import { BookingTeam } from "../domain/entity/booking.team.entity.js";
import { BookingLogs } from "../domain/valueObject/booking.log.value.js";
import { BookingQuickResDto } from "../presentation/booking.dto.js";
import {type IPlayerRepository, PLAYER_IREPOSITORY } from "../../player/infrastructure/player-IRepository.js";
import { BookingPlayerStatus } from "../domain/entity/booking.player.entity.js";

export type CreateBookingInput = {
  clubId: string;
  createdById: string;
  createdByStaff: boolean;
  createdPlayerId?: string
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
      playerId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      username?: string;
}


@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_IREPOSITORY) private readonly clubRepository: IClubRepository,
    @Inject(PLAYER_IREPOSITORY) private readonly playerRepository: IPlayerRepository
  ) {}
  
  async execute(input: CreateBookingInput ): Promise<BookingQuickResDto> {
    const club = await this.clubRepository.findById(input.clubId);
    if (!club) {
      throw new NotFoundException(`Club with ID ${input.clubId} does not exist.`);
    }

    const playerPropose = input.teams.flatMap(team => 
      team.players.map(player => player.playerId).filter((id): id is string => id !== null && id !== undefined)
    );

    if(playerPropose.length > 0){
      const result = await this.playerRepository.checkIfExist(playerPropose);

      if(result.length !== playerPropose.length){
        throw new NotFoundException(`Uno o alcuni giocatori non sono stati trovati`);
      }
    }


    // TODO: SOLO IN FASE DI DEMO C'è questa limitazione di una prenotazione a settimana
    if (club.members.find(member => member.userId !== input.createdById)) {
      await this.countWeekForUser(input.startsAt, input.clubId, input.createdById);
    }

    const isClubOwner = club.members.find(member => member.userId === input.createdById);
    if(input.createdByStaff && !isClubOwner){
      throw new BadRequestException("Non fai parte dello staff, prenotazione annullata")
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
    
    const initialStatus = input.createdByStaff ? BookingStatus.RESERVED :  BookingStatus.PENDING ;

    let booking = Booking.create(
    {
      clubId: input.clubId,
      courtId: input.courtId,
      createdById: input.createdById,
      createdByStaff: input.createdByStaff,
      description: input.description,
      courtSize: court.size,
      startsAt: startAtUTC,
      endsAt: endsAtUTC,
      status: initialStatus,
      teams: [],
      createdAt: now,
    }, 
    {
      creatorUsername: input.username, 
      courtName: court.name
    });

    let logs : BookingLogs[] = [];

    if (input.teams && input.teams.length > 0) {
      input.teams.forEach((teamDto, teamIndex) => {
        let team = BookingTeam.create({
          bookingId: booking.id,
          teamNumber: teamIndex + 1,
          teamName: teamDto.teamName,
        });

        teamDto.players.forEach(playerDto => {
          const playerInput = playerDto.playerId
            ? { type: 'REGISTERED' as const, playerId: playerDto.playerId, userId: input.createdById }
            : {
                type: 'GUEST' as const,
                firstName: playerDto.firstName ?? 'Ospite',
                lastName: playerDto.lastName ?? '',
                phone: playerDto.phone,
              };

          const isCreatorPlayer = playerDto.playerId === input.createdPlayerId;
          team = team.addPlayer(playerInput, isCreatorPlayer ? BookingPlayerStatus.ACCEPTED : BookingPlayerStatus.PENDING );

          logs.push(BookingLogs.playerAdded({
            bookingId: booking.id,
            userId: input.createdById,
            actorUsername: input.username,
            targetUsername: playerDto.playerId
              ? playerDto.username ?? playerDto.playerId
              : `${playerDto.firstName ?? 'Ospite'} ${playerDto.lastName ?? ''}`.trim(),
            isRegistered: Boolean(playerDto.playerId),
            createdAt: now,
          }));
        });

        booking = booking.addTeam(team, now);
      });
    }

    for(let index = booking.teams.length; booking.teams.length < 2; index++){
       let team = BookingTeam.create({
          bookingId: booking.id,
          teamNumber: index + 1,
          teamName: "Team "+ (index + 1),
        });

        booking = booking.addTeam(team, now);
    }



    booking = booking.addLogs(logs, now);

    const savedBooking = await this.bookingRepository.create(booking);
    return savedBooking;
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