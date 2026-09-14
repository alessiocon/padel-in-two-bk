import { Inject, Injectable,NotFoundException,ForbiddenException, BadRequestException } from '@nestjs/common';
import { Booking, type BookingStatus } from '../domain/booking.js';
import { BookingNotFoundError } from '../domain/booking-errors.js';
import { BOOKING_REPOSITORY, type IBookingRepository } from '../domain/booking-repository.js';
import { CLUB_REPOSITORY, type IClubRepository } from '../../clubs/domain/club-repository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';


export type CreateBookingInput = {
  clubId: string;
  userId: string;
  courtId: string;
  startsAt: string;
  description?: string;
  slots?: number;
  status: BookingStatus;
};

export type UpdateBookingInput = {
  clubId: string;
  bookingId: string;
  userId: string;
  status: BookingStatus;
};

@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: IClubRepository
  ) {}
  async execute(input: CreateBookingInput): Promise<Booking> {

    const club = await this.clubRepository.findById(input.clubId);
    if (!club) {
      throw new NotFoundException(`Club with ID ${input.clubId} does not exist.`);
    }
    
    const endsAtUTC = club.calculateBookingEnd(input.startsAt, input.slots ?? 1);
    club.validateSlotOperatingHours(input.startsAt, endsAtUTC.toISOString());
    const [startAtUTC] = club.convertInTimeZone([input.startsAt]);
    
    const court = club.courts.find(court => court.id === input.courtId);
    if (!court) {
      throw new NotFoundException(`Court with ID ${input.courtId} does not exist in club ${input.clubId}.`);
    }

    const isOccupied = await this.bookingRepository.hasOverlappingBooking(
      input.courtId,
      startAtUTC,
      endsAtUTC,
    );
    
    if (isOccupied) {
      throw new ForbiddenException('The requested time slot is already booked.');
    }

    var dateNew = this.clock.now();
    return await this.bookingRepository.create(Booking.create({
      clubId: input.clubId,
      courtId: input.courtId,
      userId: input.userId,
      description: input.description,
      startsAt: startAtUTC,
      endsAt: endsAtUTC,
      createdAt: dateNew
    }));
  }
}

@Injectable()
export class GetBookingUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(id: string, clubId: string): Promise<Booking> {
    const booking = await this.repository.findById(id, clubId);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    return booking;
  }
}

@Injectable()
export class GetAllBookingsClubUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(clubId: string, query: string): Promise<Booking[]> {
    const bookings = await this.repository.findAllByClubId(clubId, query);
    return bookings;
  }
}

@Injectable()
export class ChangeBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: IClubRepository
  ) {}

  async execute(input: UpdateBookingInput) {


    // 1. Carica la prenotazione dal Repository
    const booking = await this.bookingRepository.findById(input.bookingId, input.clubId);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${input.bookingId} not found.`);
    }

    if(booking.clubId !== input.clubId){
      throw new NotFoundException(`La prenotazione con ID ${input.bookingId} non appartiene al club con ID ${input.clubId} `);
    }

    const club = await this.clubRepository.findById(input.clubId);
    if (!club) {
      throw new NotFoundException(`Club with ID ${input.clubId} does not exist.`);
    }

    if(club.ownerId !== input.userId){
      throw new NotFoundException(`Non sei autorizzato a modificare la prenotazione con ID ${input.bookingId} `);
    }
    
    booking.updateDetails({
      status: input.status ?? booking.status
    })

    return await this.bookingRepository.update(booking);
  }
}
