import {
  Prisma,
  Booking as PrismaBooking,
  BookingStatus as PrismaBookingStatus,
} from '@prisma/client';
import { Booking, BookingStatus, type BookingProps } from '../domain/booking.js';
import { BookingResDto } from '../presentation/booking.dto.js';

// ==========================================
// PRISMA SELECTION TYPES (PER READ MODELS)
// ==========================================

export const bookingSummarySelect = Prisma.validator<Prisma.BookingSelect>()({
  id: true,
  courtId: true,
  status: true,
  clubId: true,
  description: true,
  startsAt: true,
  endsAt: true,
  userId: true,
});

export type PrismaBookingSummarySelect = Prisma.BookingGetPayload<{
  select: typeof bookingSummarySelect;
}>;

// ==========================================
// MAPPER CLASS
// ==========================================

export abstract class BookingMapper {
  public static readonly PRISMA_TO_DOMAIN_BOOKING_STATUS: Record<
    PrismaBookingStatus,
    BookingStatus
  > = {
    [PrismaBookingStatus.RESERVED]: BookingStatus.RESERVED,
    [PrismaBookingStatus.PENDING]: BookingStatus.PENDING,
    [PrismaBookingStatus.CONFIRMED]: BookingStatus.CONFIRMED,
    [PrismaBookingStatus.CANCELLED]: BookingStatus.CANCELLED,
  };

  public static readonly DOMAIN_TO_PRISMA_BOOKING_STATUS: Record<
    BookingStatus,
    PrismaBookingStatus
  > = {
    [BookingStatus.RESERVED]: PrismaBookingStatus.RESERVED,
    [BookingStatus.PENDING]: PrismaBookingStatus.PENDING,
    [BookingStatus.CONFIRMED]: PrismaBookingStatus.CONFIRMED,
    [BookingStatus.CANCELLED]: PrismaBookingStatus.CANCELLED,
  };





  /**
   * Converte un record Prisma nell'Entità di Dominio Booking
   */
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

  /**
   * Converte l'Entità di Dominio nel payload per Prisma
   */
  static toPersistence(booking: Booking): Prisma.BookingUncheckedCreateInput {
    const primitives = booking.toPrimitives();

    return {
      id: primitives.id,
      clubId: primitives.clubId,
      courtId: primitives.courtId,
      userId: primitives.userId,
      description: primitives.description ?? null,
      startsAt: primitives.startsAt,
      endsAt: primitives.endsAt,
      status: this.DOMAIN_TO_PRISMA_BOOKING_STATUS[primitives.status],
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    };
  }

  /**
   * Mappa la proiezione Prisma nel DTO di risposta per i Read Model (BookingsResDto)
   */
  static toResDto(record: PrismaBookingSummarySelect): BookingResDto {
    return {
      id: record.id,
      courtId: record.courtId,
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[record.status],
      clubId: record.clubId,
      description: record.description ?? '',
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt.toISOString(),
    };
  }

    static toResDtoFromDomain(booking: Booking): BookingResDto {
    const primitives = booking.toPrimitives();
    return {
      id: primitives.id,
      courtId: primitives.courtId,
      status: primitives.status,
      clubId: primitives.clubId,
      description: primitives.description ?? '',
      startsAt: primitives.startsAt.toISOString(),
      endsAt: primitives.endsAt.toISOString(),
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