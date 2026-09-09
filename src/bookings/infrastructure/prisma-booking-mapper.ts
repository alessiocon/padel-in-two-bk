import { Booking as PrismaBooking, BookingStatus as PrismaBookingStatus } from '@prisma/client';
import { Booking, BookingStatus, type BookingProps } from '../domain/booking.js';

export abstract class BookingMapper {

  private static readonly PRISMA_TO_DOMAIN_BOOKING_STATUS: Record<PrismaBookingStatus, BookingStatus> = {
    [PrismaBookingStatus.RESERVED]: BookingStatus.RESERVED,
    [PrismaBookingStatus.PENDING]: BookingStatus.PENDING,
    [PrismaBookingStatus.CONFIRMED]: BookingStatus.CONFIRMED,
    [PrismaBookingStatus.CANCELLED]: BookingStatus.CANCELLED,
  };

  private static readonly DOMAIN_TO_PRISMA_BOOKING_STATUS: Record<BookingStatus, PrismaBookingStatus> = {
    [BookingStatus.RESERVED]: PrismaBookingStatus.RESERVED,
    [BookingStatus.PENDING]: PrismaBookingStatus.PENDING,
    [BookingStatus.CONFIRMED]: PrismaBookingStatus.CONFIRMED,
    [BookingStatus.CANCELLED]: PrismaBookingStatus.CANCELLED,
  };

  static toDomain(record: PrismaBooking): Booking {
    const props: BookingProps = {
      id: record.id,
      clubId: record.clubId,
      courtId: record.courtId,
      userId: record.userId,
      description: record.description ?? undefined,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[record.status],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return Booking.reconstitute(props);
  }

  static toPersistence(booking: Booking) {
    const primitives = booking.toPrimitives();

    return {
      id: primitives.id,
      clubId: primitives.clubId,
      courtId: primitives.courtId,
      description: primitives.description,
      startsAt: primitives.startsAt,
      endsAt: primitives.endsAt,
      status: this.DOMAIN_TO_PRISMA_BOOKING_STATUS[primitives.status],
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    };
  }

  static toDomainStatus(status: PrismaBookingStatus): BookingStatus {
    const domainStatus = this.PRISMA_TO_DOMAIN_BOOKING_STATUS[status];
    if (!domainStatus) {
      throw new Error(`Prisma BookingStatus non gestito: ${status}`);
    }
    return domainStatus;
  }

  static toPrismaStatus(status: BookingStatus): PrismaBookingStatus {
    const prismaStatus = this.DOMAIN_TO_PRISMA_BOOKING_STATUS[status];
    if (!prismaStatus) {
      throw new Error(`Domain BookingStatus non gestito: ${status}`);
    }
    return prismaStatus;
  }
}