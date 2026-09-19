import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Booking, BookingStatus } from '../domain/booking.js';
import { BookingConflictError, BookingCourtNotFoundError } from '../domain/booking-errors.js';
import type { IBookingRepository } from '../domain/booking-repository.js';
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

    var bookingPrimitive = booking.toPrimitives()
    try {
      const record = await this.prisma.booking.create({
        data: {
          id: booking.id,
          clubId: booking.clubId,
          courtId: booking.courtId,
          userId: booking.userId,
          description: bookingPrimitive.description,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          status: BookingMapper.toPrismaStatus(booking.status),
          createdAt: bookingPrimitive.createdAt,
          updatedAt: bookingPrimitive.updatedAt,
        },
      });
      return BookingMapper.toDomain(record);
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new BookingConflictError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Booking | null> {
    const record = await this.prisma.booking.findFirst({ where: { id } });
    return record ? BookingMapper.toDomain(record) : null;
  }

  async findAllByClubId(clubId: string, query: string): Promise<Booking[]> {
    const whereCondition: any = { clubId };

    const startOfDay = new Date(`${query}T00:00:00.000Z`);
    const endOfDay = new Date(`${query}T23:59:59.999Z`);

    whereCondition.startsAt = {
      gte: startOfDay,
      lte: endOfDay,
    };


    const records = await this.prisma.booking.findMany({ where: whereCondition, orderBy: {startsAt: 'asc'} });
    return records.map((record) => BookingMapper.toDomain(record));
  }

  async hasOverlappingBooking(
    courtId: string, 
    startsAt: Date, 
    endsAt: Date, 
    excludeBookingId?: string
  ): Promise<boolean> {
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
    return count > 0;
  }

  async update(booking: Booking): Promise<Booking> {
    const data = BookingMapper.toPersistence(booking);
    try {
      // 2. Esegue l'update filtrando per l'ID della prenotazione
      const updatedRecord = await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          courtId: data.courtId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: data.status,
          updatedAt: data.updatedAt,
        },
      });

      // 3. Riconverte il record modificato da Prisma nell'entità di Dominio
      return BookingMapper.toDomain(updatedRecord);
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
    userId: string,
    from: Date,
    to: Date
  ): Promise<number> {
    return this.prisma.booking.count({
      where: {
        clubId: clubId,
        userId: userId,
        status: { notIn: ["CANCELLED"] },
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



  async RO_FindAllByUserId(userId: string/*, dateQuery: string*/): Promise<BookingUserResDto[]> {
    // const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
    // const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);

    const whereCondition: Prisma.BookingWhereInput = {
      userId
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
