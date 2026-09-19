import {
  Prisma,
  ClubStatus as PrismaClubStatus,
  CourtStatus as PrismaCourtStatus,
} from '@prisma/client';
import { Club, ClubCourt, ClubStatus, CourtStatus, type ClubProps } from '../domain/club.js';
import { ClubResDto, ClubsResDto } from '../presentation/club.dto.js';

// ==========================================
// PRISMA SELECTION TYPES (PER READ MODELS)
// ==========================================

export const clubSummarySelect = Prisma.validator<Prisma.ClubSelect>()({
  id: true,
  ownerId: true,
  name: true,
  email: true,
  status: true,
  slotDurationMinutes: true,
  openingTime: true,
  closingTime: true,
  position: true,
  racketPrice: true,
  courts: {
    select: {
      id: true,
      price: true,
      isIndoor: true,
    },
  },
});

export const clubDetailSelect = Prisma.validator<Prisma.ClubSelect>()({
  ...clubSummarySelect,
  timezone: true,
  courts: true,
});

export type PrismaClubSummarySelect = Prisma.ClubGetPayload<{
  select: typeof clubSummarySelect;
}>;

export type PrismaClubDetailSelect = Prisma.ClubGetPayload<{
  select: typeof clubDetailSelect;
}>;

export type PrismaClubWithCourts = Prisma.ClubGetPayload<{
  include: { courts: true };
}>;


export class ClubMapper {
  public static readonly PRISMA_TO_DOMAIN_CLUB_STATUS: Record<PrismaClubStatus, ClubStatus> = {
    [PrismaClubStatus.ACTIVE]: ClubStatus.ACTIVE,
    [PrismaClubStatus.INACTIVE]: ClubStatus.INACTIVE,
  };

  public static readonly DOMAIN_TO_PRISMA_CLUB_STATUS: Record<ClubStatus, PrismaClubStatus> = {
    [ClubStatus.ACTIVE]: PrismaClubStatus.ACTIVE,
    [ClubStatus.INACTIVE]: PrismaClubStatus.INACTIVE,
  };

  public static readonly PRISMA_TO_DOMAIN_COURT_STATUS: Record<PrismaCourtStatus, CourtStatus> = {
    [PrismaCourtStatus.AVAILABLE]: CourtStatus.AVAILABLE,
    [PrismaCourtStatus.RESERVED]: CourtStatus.RESERVED,
    [PrismaCourtStatus.MAINTENANCE]: CourtStatus.MAINTENANCE,
    [PrismaCourtStatus.INACTIVE]: CourtStatus.INACTIVE,
  };

  public static readonly DOMAIN_TO_PRISMA_COURT_STATUS: Record<CourtStatus, PrismaCourtStatus> = {
    [CourtStatus.AVAILABLE]: PrismaCourtStatus.AVAILABLE,
    [CourtStatus.RESERVED]: PrismaCourtStatus.RESERVED,
    [CourtStatus.MAINTENANCE]: PrismaCourtStatus.MAINTENANCE,
    [CourtStatus.INACTIVE]: PrismaCourtStatus.INACTIVE,
  };

  private static toNumber(val: unknown): number {
    if (typeof val === 'number') return val;
    if (val && typeof (val as { toNumber?: () => number }).toNumber === 'function') {
      return (val as { toNumber: () => number }).toNumber();
    }
    return Number(val ?? 0);
  }

  static toDomain(record: PrismaClubWithCourts): Club {
    const props: ClubProps = {
      id: record.id,
      ownerId: record.ownerId,
      name: record.name,
      email: record.email,
      status: this.PRISMA_TO_DOMAIN_CLUB_STATUS[record.status],
      position: record.position,
      timezone: record.timezone,
      racketPrice: this.toNumber(record.racketPrice),
      slotDurationMinutes: record.slotDurationMinutes,
      openingTime: record.openingTime,
      closingTime: record.closingTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      courts: (record.courts ?? []).map((court) => ({
        id: court.id,
        clubId: court.clubId,
        name: court.name,
        isIndoor: court.isIndoor,
        price: this.toNumber(court.price),
        status: this.PRISMA_TO_DOMAIN_COURT_STATUS[court.status],
      })),
    };

    return Club.reconstitute(props);
  }

  static toPersistence(club: Club): Prisma.ClubCreateInput {
    return {
      id: club.id,
      name: club.name,
      email: club.email,
      status: this.DOMAIN_TO_PRISMA_CLUB_STATUS[club.status],
      position: club.position,
      timezone: club.timezone,
      racketPrice: new Prisma.Decimal(club.racketPrice),
      slotDurationMinutes: club.slotDurationMinutes,
      openingTime: club.openingTime,
      closingTime: club.closingTime,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      owner: {
        connect: { id: club.ownerId },
      },
    };
  }

  static toCourtPersistence(court: ClubCourt): Prisma.CourtCreateManyInput {
    return {
      id: court.id,
      clubId: court.clubId,
      name: court.name,
      isIndoor: court.isIndoor,
      price: new Prisma.Decimal(court.price),
      status: this.DOMAIN_TO_PRISMA_COURT_STATUS[court.status],
    };
  }

  /**
   * Mappa la proiezione Prisma nel DTO di riassunto
   */
  static toSummaryDto(record: PrismaClubSummarySelect): ClubsResDto {
    let courtsInDoor = 0;
    let courtsOutDoor = 0;
    let totalPrice = 0;

    const courts = record.courts ?? [];
    courts.forEach((court) => {
      if (court.isIndoor) courtsInDoor++;
      else courtsOutDoor++;

      totalPrice += this.toNumber(court.price);
    });

    const totalCourts = courts.length;
    const averagePrice = totalCourts > 0 ? Number((totalPrice / totalCourts).toFixed(2)) : 0;

    const { courts: _, status, racketPrice, ...props } = record;

    return {
      ...props,
      status: this.PRISMA_TO_DOMAIN_CLUB_STATUS[status],
      courtsInDoor,
      courtsOutDoor,
      averagePrice,
      racketPrice: this.toNumber(racketPrice),
    };
  }

  /**
   * Mappa la proiezione Prisma nel DTO di dettaglio
   */
  static toDetailDto(record: PrismaClubDetailSelect): ClubResDto {
    const summary = this.toSummaryDto(record);

    const mappedCourts = record.courts.map((court) => {
      const { price, status: courtStatus, ...courtProps } = court;
      return {
        ...courtProps,
        price: this.toNumber(price),
        status: this.PRISMA_TO_DOMAIN_COURT_STATUS[courtStatus],
      };
    });

    return {
      ...summary,
      timezone: record.timezone,
      courts: mappedCourts,
    };
  }
}