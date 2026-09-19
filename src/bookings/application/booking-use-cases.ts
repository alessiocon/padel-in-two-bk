import { Inject, Injectable,NotFoundException,ForbiddenException, BadRequestException } from '@nestjs/common';
import { Booking, BookingStatus, UpdateBookingProps } from '../domain/booking.js';
import { BookingNotFoundError } from '../domain/booking-errors.js';
import { BOOKING_REPOSITORY, type IBookingRepository } from '../domain/booking-repository.js';
import { CLUB_REPOSITORY, type IClubRepository } from '../../clubs/domain/club-repository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BookingResDto, BookingUserResDto } from '../presentation/booking.dto.js';
import { BookingMapper } from '../infrastructure/prisma-booking-mapper.js';


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
 
  async execute(input: CreateBookingInput): Promise<BookingResDto> {

    const club = await this.clubRepository.findById(input.clubId);
    if (!club) {
      throw new NotFoundException(`Club with ID ${input.clubId} does not exist.`);
    }

    //TODO SOLO IN FASE DI DEMO C'è questa limitazione di una prenotazione a settimana
    if(club.ownerId != input.userId){
      await this.countWeekForUser(input.startsAt, input.clubId, input.userId)
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

    var now = this.clock.now();

    const bookingEntity = Booking.create({
      clubId: input.clubId,
      courtId: input.courtId,
      userId: input.userId,
      description: input.description,
      startsAt: startAtUTC,
      endsAt: endsAtUTC,
      createdAt: now,
      status: club.ownerId != input.userId ? BookingStatus.PENDING : BookingStatus.RESERVED 
    });

    const savedBooking = await this.bookingRepository.create(bookingEntity);
    return BookingMapper.toResDtoFromDomain(savedBooking);
  }


  private async countWeekForUser(startsAt: string, clubId:string, userId: string){
    const targetDate = new Date(startsAt);
    
    // Calcolo inizio (Lunedì 00:00) e fine (Domenica 23:59:59) della settimana di targetDate
    const startOfWeek = new Date(targetDate);
    const day = startOfWeek.getDay(); // 0 = Domenica, 1 = Lunedì, ...
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Query al repository per contare le prenotazioni attive nel range per quel club
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

@Injectable()
export class GetBookingUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(id: string): Promise<Booking> {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    return booking;
  }
}

@Injectable()
export class GetAllBookingsClubUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(clubId: string, query: string): Promise<BookingResDto[]> {
    return await this.repository.RO_FindAllByClubId(clubId, query);
  }
}

@Injectable()
export class GetAllBookingsUserUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(userId: string/*, query: string*/): Promise<BookingUserResDto[]> {
    return await this.repository.RO_FindAllByUserId(userId);
  }
}

@Injectable()
export class DeleteBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly repository: IBookingRepository,
  ) {}

  async execute(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.repository.findById(bookingId);

    if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}
    if (booking.userId !== userId) { throw new ForbiddenException("Autorizzazione non concessa");}

    switch (booking.status) {
      case BookingStatus.CONFIRMED: {
        const now = new Date();
        const startsAt = new Date(booking.startsAt);

        const hoursDifference = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDifference < 24) {
          const updateBooking: UpdateBookingProps = {
            status: BookingStatus.CANCELLED,
            description: "Cancellata dall'utente",
          };

          booking.updateDetails(updateBooking);
          await this.repository.update(booking);
        } else {
          await this.repository.delete(booking.id);
          // Impostiamo lo stato a CANCELLED in memoria per segnalare al FE che è stata disdetta/rimossa nei tempi
          booking.updateDetails({ status: BookingStatus.CANCELLED });
        }

        break;
      }
      case BookingStatus.PENDING: {
        await this.repository.delete(booking.id);
        break;
      }
      // default:
      //   return booking;
    }
    return booking;
  }
}

@Injectable()
export class ChangeBooking {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: IClubRepository
  ) {}

  async execute(input: UpdateBookingInput) {

    const booking = await this.bookingRepository.findById(input.bookingId);
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

    let isOverlapping = await this.bookingRepository.hasOverlappingBooking(booking.courtId, booking.startsAt, booking.endsAt, booking.id);
    if(isOverlapping){
      throw new BadRequestException("è presente già una prenotazione a quest'ora per questo campo")
    }

    return await this.bookingRepository.update(booking);
  }
}
