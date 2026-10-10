import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingConflictError, BookingCourtNotFoundError } from '../domain/booking-errors.js';
import type { IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingMapper, bookingSummarySelect, bookingUserSummarySelect } from './prisma-booking-mapper.js';
import { BookingResDto, BookingUserResDto } from '../presentation/booking.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) {}
  
  async create(booking: Booking): Promise<Booking> {
    const court = await this.prisma.court.findUnique({ where: { id: booking.courtId } });
    if (!court || court.clubId !== booking.clubId) {
      throw new BookingCourtNotFoundError(booking.courtId);
    }

   const bookingPrimitive = BookingMapper.domainBookingToPersistence(booking);

    try {
      const record = await this.prisma.booking.create({
        data: bookingPrimitive,
        include: {
          teams: {
            include: {
              players: true,
            },
          },
          logs: true,
        },
      });

      return BookingMapper.prismaBookingToDomain(record);
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new BookingConflictError();
      }
      console.log((error as any).message)
      throw error;
    }
  }

  async findById(id: string): Promise<Booking> {
    const record = await this.prisma.booking.findFirst({
      where: { id },
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        logs: true,
      },
    });

    if (!record) {
      throw new NotFoundException("Prenotazione non trovata");
    }

    return BookingMapper.prismaBookingToDomain(record);
  }


  //QUESTO é IN READONLY
  async findAllByClubId(clubId: string, query: string): Promise<Booking[]> {
    const whereCondition: any = { clubId };

    const startOfDay = new Date(`${query}T00:00:00.000Z`);
    const endOfDay = new Date(`${query}T23:59:59.999Z`);

    whereCondition.startsAt = {
      gte: startOfDay,
      lte: endOfDay,
    };


    const records = await this.prisma.booking.findMany({ 
      where: whereCondition, 
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        logs: true,
      },
      orderBy: {startsAt: 'asc'} });

    return records.map((record) => BookingMapper.prismaBookingToDomain(record));
  }

  async hasOverlappingBooking(
    courtId: string, 
    startsAt: Date, 
    endsAt: Date, 
    excludeBookingId?: string
  ): Promise<void> {
    const count = await this.prisma.booking.count({
      where: {
        courtId,
        status: { in: ['RESERVED', 'PENDING', 'CONFIRMED'] }, // Ignora CANCELLED
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        AND: [
          { startsAt: { lt: endsAt } },
          { endsAt: { gt: startsAt } },
        ],
      },
    });
    if(count > 0){
       throw new BadRequestException("The requested time slot is already booked.")
    }
    return ;
  }

  //TODO: migliorare la logica di UPDATE perche attualmente non aggiorna
  async update(booking: Booking): Promise<Booking> {
    const data = BookingMapper.toPersistence(booking);
    try {
      const updatedRecord = await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          courtId: data.courtId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: data.status,
          updatedAt: data.updatedAt,
          cancBy: data.cancBy,
          cancAt: data.cancAt,
          cancPostConfirm: data.cancPostConfirm,
          cancReason: data.cancReason,
        },
        include: {
          teams: {
            include: {
              players: true,
            },
          },
          logs: true,
        },
      });

      // 2. Riconverte il record completo nell'entità di Dominio
      return BookingMapper.prismaBookingToDomain(updatedRecord);
    } catch (error) {
      // Intercetta eventuali violazioni dei vincoli di sovrapposizione a livello DB (Exclusion Constraint / Trigger)
      if (this.isOverlapError(error)) {
        throw new BookingConflictError();
      }
      throw error;
    }
  }

  async delete(bookingId: string): Promise<boolean> {
    try {
      const isDeleted = await this.prisma.booking.delete({
        where: { id: bookingId }
      });

      return isDeleted ? true : false;
    } catch (error) {
      // Intercetta eventuali violazioni dei vincoli di sovrapposizione a livello DB (Exclusion Constraint / Trigger)
      if (this.isOverlapError(error)) {
        throw new BookingConflictError();
      }
      throw error;
    }
  }


  async countUserBookingsInWeek(
    clubId: string,
    createdById: string,
    from: Date,
    to: Date
  ): Promise<number> {
    return this.prisma.booking.count({
      where: {
        clubId: clubId,
        createdById: createdById,
        status: { notIn: [BookingStatus.CANCELLED] },
        startsAt: {
          gte: from,
          lte: to,
        },
      },
    });
  }



  async RO_FindAllByClubId(clubId: string, dateQuery: string): Promise<BookingResDto[]> {
    const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);

    const whereCondition: Prisma.BookingWhereInput = {
      clubId,
      startsAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    const records = await this.prisma.booking.findMany({
      where: whereCondition,
      select: bookingSummarySelect,
      orderBy: { startsAt: 'asc' },
    });

    return records.map((record) => BookingMapper.toResDto(record));
  }



  async RO_FindAllByUserId(createdById: string/*, dateQuery: string*/): Promise<BookingUserResDto[]> {
    // const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
    // const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);

    const whereCondition: Prisma.BookingWhereInput = {
      createdById
      // startsAt: {
      //   gte: startOfDay,
      //   lte: endOfDay,
      // },
    };

    const records = await this.prisma.booking.findMany({
      where: whereCondition,
      select: bookingUserSummarySelect,
      orderBy: { startsAt: 'asc' },
    });

    return records.map((record) => BookingMapper.toResUserDto(record));
  }

  private isOverlapError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('bookings_no_active_overlap');
  }
}
