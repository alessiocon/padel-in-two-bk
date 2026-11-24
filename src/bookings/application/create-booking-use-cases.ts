import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { BOOKING_IREPOSITORY, type IBookingRepository } from "../infrastructure/booking-IRepository.js";
import { CLUB_IREPOSITORY, type IClubRepository } from "../../clubs/infrastructure/club-IRepository.js";
import { Booking, BookingJoinMode, BookingStatus, type BookingInitialPlayerInput, type BookingInitialTeamInput } from "../domain/booking.aggregate.js";
import { BookingQuickResDto } from "../presentation/booking.dto.js";
import {type IPlayerRepository, PLAYER_IREPOSITORY } from "../../player/infrastructure/player-IRepository.js";
import { BookingPlayerStatus } from "../domain/entity/booking.player.entity.js";
import { ICLUB_PRICING_RULE_REPOSITORY, type IClubPricingRuleRepository } from "../../club-pricing/infrastructure/pricing-rule.repository.js";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingCreatedEvent, BookingPlayerInvitedEvent } from '../domain/booking-events.js';

export type CreateBookingInput = {
  clubId: string;
  createdById: string;
  createdByStaff: boolean;
  createdPlayerId?: string
  username: string;
  courtId: string;
  startsAt: string;
  description?: string;
  isPublic?: boolean;
  joinMode?: BookingJoinMode;
  minPlayerLevel?: number;
  maxPlayerLevel?: number;
  slots?: number;
  status: BookingStatus;
  teams: CreateBookingTeamInput[];
};

export type CreateBookingTeamInput = BookingInitialTeamInput;

export type CreateBookingPlayerInput = BookingInitialPlayerInput;


@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_IREPOSITORY) private readonly clubRepository: IClubRepository,
    @Inject(PLAYER_IREPOSITORY) private readonly playerRepository: IPlayerRepository,
    @Inject(ICLUB_PRICING_RULE_REPOSITORY) private readonly pricingRuleRepository: IClubPricingRuleRepository,
    private readonly eventEmitter: EventEmitter2,
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

    let allPlayerIds = input.teams.map(team => team.players.map(player => player.playerId)).flat().filter((id): id is string => id !== null && id !== undefined);
    let isAllPlayerFree = await this.bookingRepository.isUsersFreeForBooking(allPlayerIds, startAtUTC, endsAtUTC);
    if(!isAllPlayerFree){
      throw new BadRequestException("Uno o alcuni giocatori hanno già una prenotazione per questo intervallo di tempo.");
    }

    const pricingRules = await this.pricingRuleRepository.getAll(club.id);
    const price = club.calculateBookingPrice({
      courtId: court.id,
      startsAt: startAtUTC,
      slots: input.slots ?? 1,
      rules: pricingRules,
    });
    
    const now = this.clock.now();
    
    const initialStatus = input.createdByStaff ? BookingStatus.RESERVED :  BookingStatus.PENDING ;

    let booking = Booking.create(
    {
      clubId: input.clubId,
      courtId: input.courtId,
      createdById: input.createdById,
      createdByStaff: input.createdByStaff,
      description: input.description,
      isPublic: input.isPublic,
      joinMode: input.joinMode,
      minPlayerLevel: input.minPlayerLevel,
      maxPlayerLevel: input.maxPlayerLevel,
      courtSize: court.size,
      startsAt: startAtUTC,
      endsAt: endsAtUTC,
      price,
      eligiblePromotions: club.eligiblePromotions(input.createdByStaff),
      status: initialStatus,
      teams: [],
      createdAt: now,
    }, 
    {
      creatorUsername: input.username, 
      courtName: court.name
    });

    booking = booking.initializeTeams(input.teams, input.createdPlayerId, input.username, Boolean(isClubOwner), now);

    const savedBooking = await this.bookingRepository.create(booking);
    if(booking.status !== BookingStatus.RESERVED) {
      this.eventEmitter.emit('booking.created', new BookingCreatedEvent(booking.id, input.createdById, input.username));
    }
    
    for (const team of booking.teams) {
      for (const player of team.players) {
        if (player.playerId && player.status === BookingPlayerStatus.PENDING) {
          this.eventEmitter.emit('booking.player.invited', new BookingPlayerInvitedEvent(
            booking.id, input.createdById, input.username, player.playerId,
          ));
        }
      }
    }
    
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

    if (existingCount >= 5) {
      throw new BadRequestException(
        "In questa demo: puoi effettuare al massimo 5 prenotazioni a settimana per ciascun club."
      );
    }
  }
}