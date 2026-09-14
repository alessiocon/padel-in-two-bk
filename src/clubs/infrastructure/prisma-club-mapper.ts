import {
  Prisma,
  ClubStatus as PrismaClubStatus,
  CourtStatus as PrismaCourtStatus,
} from '@prisma/client';
import { Club, ClubCourt, ClubStatus, CourtStatus, type ClubProps } from './../domain/club.js';

export type PrismaClubWithCourts = Prisma.ClubGetPayload<{
  include: { courts: true };
}>;



export class ClubMapper {

  // Mappe di conversione esplicite
  private static readonly PRISMA_TO_DOMAIN_CLUB_STATUS: Record<PrismaClubStatus, ClubStatus> = {
    [PrismaClubStatus.ACTIVE]: ClubStatus.ACTIVE,
    [PrismaClubStatus.INACTIVE]: ClubStatus.INACTIVE,
  };

  private static readonly DOMAIN_TO_PRISMA_CLUB_STATUS: Record<ClubStatus, PrismaClubStatus> = {
    [ClubStatus.ACTIVE]: PrismaClubStatus.ACTIVE,
    [ClubStatus.INACTIVE]: PrismaClubStatus.INACTIVE,
  };

  private static readonly  PRISMA_TO_DOMAIN_COURT_STATUS: Record<PrismaCourtStatus, CourtStatus> = {
    [PrismaCourtStatus.AVAILABLE]: CourtStatus.AVAILABLE,
    [PrismaCourtStatus.RESERVED]: CourtStatus.RESERVED,
    [PrismaCourtStatus.MAINTENANCE]: CourtStatus.MAINTENANCE,
    [PrismaCourtStatus.INACTIVE]: CourtStatus.INACTIVE,
  };

  private static readonly DOMAIN_TO_PRISMA_COURT_STATUS: Record<CourtStatus, PrismaCourtStatus> = {
    [CourtStatus.AVAILABLE]: PrismaCourtStatus.AVAILABLE,
    [CourtStatus.RESERVED]: PrismaCourtStatus.RESERVED,
    [CourtStatus.MAINTENANCE]: PrismaCourtStatus.MAINTENANCE,
    [CourtStatus.INACTIVE]: PrismaCourtStatus.INACTIVE,
  };


  /**
   * Converte un record Prisma (con le sue relazioni) nell'Entità di Dominio Club
   */
  static toDomain(record: PrismaClubWithCourts): Club {
    const props: ClubProps = {
      id: record.id,
      ownerId: record.ownerId,
      name: record.name,
      email: record.email,
      status: this.PRISMA_TO_DOMAIN_CLUB_STATUS[record.status],
      position: record.position,
      timezone: record.timezone,
      racketPrice: record.racketPrice.toNumber(),
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
        price: court.price.toNumber(),
        status: this.PRISMA_TO_DOMAIN_COURT_STATUS[court.status],
      })),
    };

    return Club.reconstitute(props);
  }

  /**
   * Converte l'Entità di Dominio nel payload per Prisma (Creazione/Update del Club)
   */
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

  /**
   * Converte i campi dell'entità nel payload Prisma per la tabella Court
   */
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
}