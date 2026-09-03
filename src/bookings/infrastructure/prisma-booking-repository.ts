import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Booking, type BookingProps } from '../domain/booking.js';
import { BookingConflictError, BookingCourtNotFoundError } from '../domain/booking-errors.js';
import type { IBookingRepository } from '../domain/booking-repository.js';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(booking: Booking): Promise<Booking> {
    const court = await this.prisma.court.findUnique({ where: { id: booking.courtId } });
    if (!court || court.clubId !== booking.clubId) {
      throw new BookingCourtNotFoundError(booking.courtId);
    }

    try {
      const record = await this.prisma.booking.create({
        data: {
          id: booking.id,
          clubId: booking.clubId,
          courtId: booking.courtId,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          status: booking.status.toUpperCase() as 'FREE' | 'RESERVED' | 'SEARCHING' | 'BLOCKED',
          createdAt: booking.toPrimitives().createdAt,
          updatedAt: booking.toPrimitives().updatedAt,
        },
      });
      return this.toDomain(record);
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new BookingConflictError();
      }
      throw error;
    }
  }

  async findById(id: string, clubId: string): Promise<Booking | null> {
    const record = await this.prisma.booking.findFirst({ where: { id, clubId } });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    clubId: string;
    courtId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Booking {
    const props: BookingProps = {
      ...record,
      status: record.status.toLowerCase() as BookingProps['status'],
    };
    return Booking.reconstitute(props);
  }

  private isOverlapError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('bookings_no_active_overlap');
  }
}
