import { Inject, Injectable,NotFoundException,ForbiddenException, BadRequestException } from '@nestjs/common';
import { Booking, BookingCancBy, BookingStatus, UpdateBookingProps } from '../domain/booking.aggregate.js';
import { BookingNotFoundError } from '../domain/booking-errors.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { CLUB_REPOSITORY, type IClubRepository } from '../../clubs/domain/club-IRepository.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BookingResDto, BookingUserResDto } from '../presentation/booking.dto.js';
import { BookingMapper } from '../infrastructure/prisma-booking-mapper.js';
import { GetClubStaffUseCase, GetClubUseCase } from '../../clubs/application/club-use-cases.js';
import { CreateBookingUseCase } from './create-booking-use-cases.js';
import { IsAcceptedBookingByUserUseCase } from './isAccepted-booking-by-user-use-cases copy.js';
import { InviteBookingUseCase } from './invite.booking.use-case.js';
import { RemovePlayerInBookingTeamUseCase } from './remove.player.in.booking-team.use-case.js';
import { SearchBookingsUseCase } from './search.bookings.use-case.js';
import { CancelPrenotationUseCase } from './cancel.prenotation.use-case.js';
import { RestorePrenotationUseCase } from './restore.prenotation.use-case.js';


// export type CreateBookingInput = {
//   clubId: string;
//   userId: string;
//   courtId: string;
//   startsAt: string;
//   description?: string;
//   slots?: number;
//   status: BookingStatus;
// };

export type UpdateBookingInput = {
  clubId: string;
  bookingId: string;
  userId: string;
  status?: BookingStatus;
};


// @Injectable()
// export class CreateBookingUseCase {
//   constructor(
//     @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
//     @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
//     @Inject(CLUB_REPOSITORY) private readonly clubRepository: IClubRepository
//   ) {}
 
//   async execute(input: CreateBookingInput): Promise<BookingResDto> {

//     const club = await this.clubRepository.findById(input.clubId);
//     if (!club) {
//       throw new NotFoundException(`Club with ID ${input.clubId} does not exist.`);
//     }

//     //TODO SOLO IN FASE DI DEMO C'è questa limitazione di una prenotazione a settimana
//     if(club.ownerId != input.userId){
//       await this.countWeekForUser(input.startsAt, input.clubId, input.userId)
//     }
    
//     const endsAtUTC = club.calculateBookingEnd(input.startsAt, input.slots ?? 1);
//     const court = club.courts.find(court => court.id === input.courtId);
//     if(!court) throw new BadRequestException("il campo selezionato non esiste")
//     court.validateSlotOperatingHours(input.startsAt, endsAtUTC.toISOString(), club.timezone, club.openingTime, club.closingTime, club.slotDurationMinutes);
//     const [startAtUTC] = club.convertInTimeZone([input.startsAt]);
    
    
//     if (!court) {
//       throw new NotFoundException(`Court with ID ${input.courtId} does not exist in club ${input.clubId}.`);
//     }

//     await this.bookingRepository.hasOverlappingBooking(input.courtId, startAtUTC, endsAtUTC);
    
//     var now = this.clock.now();

//     const bookingEntity = Booking.create({
//       clubId: input.clubId,
//       courtId: input.courtId,
//       createdById: input.userId,
//       description: input.description,
//       auditLogs: [],
//       teams: [],
//       startsAt: startAtUTC,
//       endsAt: endsAtUTC,
//       createdAt: now,
//       status: club.ownerId != input.userId ? BookingStatus.PENDING : BookingStatus.RESERVED 
//     });

//     const savedBooking = await this.bookingRepository.create(bookingEntity);
//     return BookingMapper.toResDtoFromDomain(savedBooking);
//   }


//   private async countWeekForUser(startsAt: string, clubId:string, userId: string){
//     const targetDate = new Date(startsAt);
    
//     // Calcolo inizio (Lunedì 00:00) e fine (Domenica 23:59:59) della settimana di targetDate
//     const startOfWeek = new Date(targetDate);
//     const day = startOfWeek.getDay(); // 0 = Domenica, 1 = Lunedì, ...
//     const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
//     startOfWeek.setDate(diffToMonday);
//     startOfWeek.setHours(0, 0, 0, 0);

//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6);
//     endOfWeek.setHours(23, 59, 59, 999);

//     // Query al repository per contare le prenotazioni attive nel range per quel club
//     const existingCount = await this.bookingRepository.countUserBookingsInWeek(
//       clubId,
//       userId,
//       startOfWeek,
//       endOfWeek,
//     );

//     if (existingCount >= 1) {
//       throw new BadRequestException(
//         "In questa demo: puoi effettuare al massimo 1 prenotazione a settimana per ciascun club."
//       );
//     }
//   }
// }

@Injectable()
export class GetBookingUseCase {
  constructor(@Inject(BOOKING_IREPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(id: string): Promise<Booking> {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    return booking;
  }
}

@Injectable()
export class GetAllBookingsUserUseCase {
  constructor(@Inject(BOOKING_IREPOSITORY) private readonly repository: IBookingRepository) {}

  async execute(userId: string/*, query: string*/): Promise<BookingUserResDto[]> {
    return await this.repository.RO_FindAllByUserId(userId);
  }
}



  @Injectable()
  export class AcceptBookingUseCase {
    constructor(
      @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
      @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
      private readonly getClubStaffUseCase : GetClubStaffUseCase
    ) {}

    async execute(bookingId: string, userId: string): Promise<Booking> {
      const time = this.clock.now();
      const booking = await this.bookingRepository.findById(bookingId);

      if (booking === null) { throw new NotFoundException("Prenotazione non trovata");}

      const staff = await this.getClubStaffUseCase.execute(booking.clubId);
      if (!staff.includes(userId)) { throw new ForbiddenException("Autorizzazione non concessa") }

      booking.acceptPrenotation(time);

      await this.bookingRepository.hasOverlappingBooking(booking.courtId, booking.startsAt, booking.endsAt, booking.id);
      await this.bookingRepository.update(booking);

      return booking;
    }
  }



@Injectable()
export class ChangeBookingUseCase {
  constructor(
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(input: UpdateBookingInput) {
    const time = this.clock.now()
    const booking = await this.bookingRepository.findById(input.bookingId);

    if(booking.clubId !== input.clubId){
      throw new NotFoundException(`La prenotazione con ID ${input.bookingId} non appartiene al club con ID ${input.clubId}`);
    }

    booking.updateDetails({
      updateDate: time
    })

    await this.bookingRepository.hasOverlappingBooking(booking.courtId, booking.startsAt, booking.endsAt, booking.id);
   

    return await this.bookingRepository.update(booking);
  }
}

export const BOOKING_USE_CASES = [
    CreateBookingUseCase,
    GetBookingUseCase,
    GetAllBookingsUserUseCase,
    ChangeBookingUseCase,
    CancelPrenotationUseCase,
    AcceptBookingUseCase,
    RestorePrenotationUseCase,
    IsAcceptedBookingByUserUseCase,
    InviteBookingUseCase,
    RemovePlayerInBookingTeamUseCase,
    SearchBookingsUseCase
  ];
