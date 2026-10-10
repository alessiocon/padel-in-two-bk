import {
  Prisma,
  Booking as PrismaBooking,
  BookingTeam as PrismaTeam,
  BookingPlayer as PrismaPlayer,
  BookingAuditLog as PrismaAuditLog,
  BookingStatus as PrismaBookingStatus,
  BookingCancBy as PrismaBookingCancBy,
  BookingEventType as PrismaEventType,
  BookingPlayerStatus as PrismaBookingPlayerStatus,
  User as PrismaUser
} from '@prisma/client';
import { Booking, BookingCancBy, BookingStatus} from '../domain/booking.aggregate.js';
import { BookingResDto, BookingUserResDto } from '../presentation/booking.dto.js';
import { BookingAuditLog, BookingEventType } from '../domain/valueObject/booking.auditLog.value.js';
import { BookingPlayer, BookingPlayerStatus, PlayerIdentity } from '../domain/entity/booking.player.entity.js';
import { BookingTeam } from '../domain/entity/booking.team.entity.js';


export type PrismaBookingWithRelations = PrismaBooking & {
  teams: (PrismaTeam & {
    players: PrismaPlayer[];
  })[];
  logs: PrismaAuditLog[];
};

export const bookingSummarySelect = Prisma.validator<Prisma.BookingSelect>()({
  id: true,
  createdById: true,
  courtId: true,
  status: true,
  clubId: true,
  description: true,
  startsAt: true,
  endsAt: true,
});

export type PrismaBookingSummarySelect = Prisma.BookingGetPayload<{
  select: typeof bookingSummarySelect;
}>;

export const bookingUserSummarySelect = Prisma.validator<Prisma.BookingSelect>()({
  id: true,
  courtId: true,
  status: true,
  clubId: true,
  description: true,
  startsAt: true,
  endsAt: true,
  createdById: true,
  club: {
    select: {position: true}
  },
  court: {
    select: {isIndoor: true, name: true}
  }
});

export type PrismaBookingUserSummarySelect = Prisma.BookingGetPayload<{
  select: typeof bookingUserSummarySelect;
}>;

export type PrismaBookingWithDetails = PrismaBooking & {
  createdBy: PrismaUser;
  teams: (PrismaTeam & {
    players: (PrismaPlayer & {
      user: PrismaUser | null;
    })[];
  })[];
  auditLogs: (PrismaAuditLog & {
    user: PrismaUser| null;
  })[];
};

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

    public static readonly PRISMA_TO_DOMAIN_BOOKING_CANCELEDBY: Record<
    PrismaBookingCancBy,
    BookingCancBy
  > = {
    [PrismaBookingCancBy.USER]: BookingCancBy.USER,
    [PrismaBookingCancBy.CLUB]: BookingCancBy.CLUB,
  };

  public static readonly DOMAIN_TO_PRISMA_BOOKING_CANCELEDBY: Record<
    BookingCancBy,
    PrismaBookingCancBy
  > = {
    [BookingCancBy.USER]: PrismaBookingCancBy.USER,
    [BookingCancBy.CLUB]: PrismaBookingCancBy.CLUB,
  };

  public static readonly PRISMA_TO_DOMAIN_EVENT_TYPE: Record<PrismaEventType, BookingEventType> = {
    [PrismaEventType.CREATED]: BookingEventType.CREATED,
    [PrismaEventType.PLAYER_JOINED]: BookingEventType.PLAYER_JOINED,
    [PrismaEventType.PLAYER_LEFT]: BookingEventType.PLAYER_LEFT,
    [PrismaEventType.STATUS_CHANGED]: BookingEventType.STATUS_CHANGED,
    [PrismaEventType.CANCELLED]: BookingEventType.CANCELLED,
  };

  public static readonly DOMAIN_TO_PRISMA_EVENT_TYPE: Record<BookingEventType, PrismaEventType> = {
    [BookingEventType.CREATED]: PrismaEventType.CREATED,
    [BookingEventType.PLAYER_JOINED]: PrismaEventType.PLAYER_JOINED,
    [BookingEventType.PLAYER_LEFT]: PrismaEventType.PLAYER_LEFT,
    [BookingEventType.STATUS_CHANGED]: PrismaEventType.STATUS_CHANGED,
    [BookingEventType.CANCELLED]: PrismaEventType.CANCELLED,
  };

  public static readonly PRISMA_TO_DOMAIN_BOOKING_PLAYER_STATUS: Record<PrismaBookingPlayerStatus, BookingPlayerStatus> = {
    [PrismaBookingPlayerStatus.ACCEPTED]: BookingPlayerStatus.ACCEPTED,
    [PrismaBookingPlayerStatus.PENDING]:  BookingPlayerStatus.PENDING,
    [PrismaBookingPlayerStatus.DECLINED]: BookingPlayerStatus.DECLINED,
    [PrismaBookingPlayerStatus.REMOVED]:  BookingPlayerStatus.REMOVED
  };

  public static readonly DOMAIN_TO_PRISMA_BOOKING_PLAYER_STATUS: Record<BookingPlayerStatus, PrismaBookingPlayerStatus> = {
    [BookingPlayerStatus.ACCEPTED]: PrismaBookingPlayerStatus.ACCEPTED,
    [BookingPlayerStatus.PENDING]:  PrismaBookingPlayerStatus.PENDING,
    [BookingPlayerStatus.DECLINED]: PrismaBookingPlayerStatus.DECLINED,
    [BookingPlayerStatus.REMOVED]:  PrismaBookingPlayerStatus.REMOVED
  };







  /**
   * Converte un record Prisma nell'Entità di Dominio Booking
   */
  public static prismaBookingToDomain(raw: PrismaBookingWithRelations): Booking {
    const teams = raw.teams.map(team => this.mapPrismaTeamToDomain(team));
    const auditLogs = raw.logs.map(log => this.mapPrismaAuditLogToDomain(log));

    return Booking.reconstitute({
      id: raw.id,
      clubId: raw.clubId,
      courtId: raw.courtId,
      createdById: raw.createdById,
      description: raw.description ?? undefined,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[raw.status],
      teams,
      logs: auditLogs,
      cancBy: raw.cancBy ? this.PRISMA_TO_DOMAIN_BOOKING_CANCELEDBY[raw.cancBy] : null,
      cancAt: raw.cancAt,
      cancPostConfirm: raw.cancPostConfirm,
      cancReason: raw.cancReason,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private static mapPrismaTeamToDomain(prismaTeam: PrismaBookingWithRelations['teams'][number]): BookingTeam {
    const players = prismaTeam.players.map(prismaPlayer => {
      const identity: PlayerIdentity = prismaPlayer.userId
        ? { type: 'REGISTERED', userId: prismaPlayer.userId }
        : {
            type: 'GUEST',
            firstName: prismaPlayer.firstName ?? '',
            lastName: prismaPlayer.lastName ?? '',
            phone: prismaPlayer.phone ?? undefined,
          };

      return BookingPlayer.reconstitute({
        id: prismaPlayer.id,
        status: this.PRISMA_TO_DOMAIN_BOOKING_PLAYER_STATUS[prismaPlayer.status],
        teamId: prismaPlayer.teamId,
        identity,
      });
    });

    return BookingTeam.reconstitute({
      id: prismaTeam.id,
      bookingId: prismaTeam.bookingId,
      teamNumber: prismaTeam.teamNumber,
      teamName: prismaTeam.teamName,
      players,
    });
  }

  private static mapPrismaAuditLogToDomain(prismaLog: PrismaBookingWithRelations['logs'][number]): BookingAuditLog {
    return BookingAuditLog.reconstitute({
      bookingId: prismaLog.bookingId,
      userId: prismaLog.userId,
      eventType: this.PRISMA_TO_DOMAIN_EVENT_TYPE[prismaLog.eventType],
      message: prismaLog.message,
      createdAt: prismaLog.createdAt,
    });
  }


  public static domainBookingToDto(booking: Booking): BookingResDto {
    const primitives = booking.toPrimitives();

    return {
      id: primitives.id,
      clubId: primitives.clubId,
      courtId: primitives.courtId,
      status: primitives.status, // Se l'enum di dominio combacia col DTO
      startsAt: primitives.startsAt,
      endsAt: primitives.endsAt,
      description: primitives.description ?? null,
      createdBy: {
        id: primitives.createdById,
        username: '', // Il dominio ha solo l'ID, lo username richiederebbe un join o un lookup
        firstName: "",
        lastName: "",
      },
      teams: primitives.teams.map(team => ({
        id: team.id,
        teamName: team.teamName,
        teamNumber: team.teamNumber,
        players: team.players.map(player => ({
          id: player.id,
          userId: player.userId ?? undefined,
          status: this.PRISMA_TO_DOMAIN_BOOKING_PLAYER_STATUS[player.status],
          type: player.userId ? "REGISTERED" : "GUEST",
          firstName: player.firstName ?? null,
          lastName: player.lastName ?? null,
          phone: player.phone ?? null,
        })),
      })),

      auditLogs: primitives.auditLogs.map(log => ({
        eventType: log.eventType,
        message: log.message,
        createdAt: log.createdAt,
        username: null, // Anche qui, il dominio possiede solo lo userId
      })),

      cancAt: primitives.cancAt,
      cancBy: primitives.cancBy,
      cancPostConfirm: primitives.cancPostConfirm,
      cancReason: primitives.cancReason,
      createdAt: primitives.createdAt
    };
  }

  public static domainBookingToPersistence(domainBooking: Booking): Prisma.BookingUncheckedCreateInput & {
    teams?: {
      create: (Prisma.BookingTeamCreateWithoutBookingInput & {
        players?: {
          create: Prisma.BookingPlayerCreateWithoutTeamInput[];
        };
      })[];
    };
    logs?: {
      create: Prisma.BookingAuditLogCreateWithoutBookingInput[];
    };
  } {
    const primitives = domainBooking.toPrimitives();

    return {
      id: primitives.id,
      clubId: primitives.clubId,
      courtId: primitives.courtId,
      createdById: primitives.createdById,
      description: primitives.description ?? null,
      startsAt: primitives.startsAt,
      endsAt: primitives.endsAt,
      status: this.DOMAIN_TO_PRISMA_BOOKING_STATUS[primitives.status],
      
      cancBy: primitives.cancBy ? this.DOMAIN_TO_PRISMA_BOOKING_CANCELEDBY[primitives.cancBy] : null,
      cancAt: primitives.cancAt,
      cancPostConfirm: primitives.cancPostConfirm,
      cancReason: primitives.cancReason,

      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,

      teams: {
        create: primitives.teams.map(team => ({
          id: team.id,
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          players: {
            create: team.players.map(player => ({
              id: player.id,
              userId: player.userId ?? null,
              status: player.status,
              firstName: player.firstName ?? null,
              lastName: player.lastName ?? null,
              phone: player.phone ?? null,
            })),
          },
        })),
      },

      // Mappatura dei log di audit (Value Objects)
      logs: {
        create: primitives.auditLogs.map(log => ({
          userId: log.userId,
          eventType: this.DOMAIN_TO_PRISMA_EVENT_TYPE[log.eventType],
          message: log.message,
          createdAt: log.createdAt,
        })),
      },
    };
  }



  public static prismaBookingToDto(raw: PrismaBookingWithDetails): BookingResDto {
    return {
      id: raw.id,
      clubId: raw.clubId,
      courtId: raw.courtId,
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[raw.status],
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      description: raw.description,
      createdBy: {
        id: raw.createdBy.id,
        username: raw.createdBy.username,
        firstName: raw.createdBy.firstName,
        lastName: raw.createdBy.lastName,
      },
      teams: raw.teams.map(team => ({
        id: team.id,
        teamName: team.teamName,
        teamNumber: team.teamNumber,
        players: team.players.map(player => ({
            id: player.id,
            username: player.user?.username,
            status: this.PRISMA_TO_DOMAIN_BOOKING_PLAYER_STATUS[player.status],
            userId: player.user?.id,
            type: player.userId ? "REGISTERED" : "GUEST",
            firstName: player.firstName,
            lastName: player.lastName,
            phone: player.phone
        })),
      })),
      
      auditLogs: raw.auditLogs.map(log => ({
        eventType: this.PRISMA_TO_DOMAIN_EVENT_TYPE[log.eventType],
        message: log.message,
        createdAt: log.createdAt,
        username: log.user?.username ?? null, // Molto utile anche nei log!
      })),

      cancAt: raw.cancAt,
      cancBy: raw.cancBy? this.PRISMA_TO_DOMAIN_BOOKING_CANCELEDBY[raw.cancBy] : null,
      cancPostConfirm: raw.cancPostConfirm,
      cancReason: raw.cancReason,

      createdAt: raw.createdAt
    };
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
      createdById: primitives.createdById,
      description: primitives.description ?? null,

      cancBy: primitives.cancBy ? this.DOMAIN_TO_PRISMA_BOOKING_CANCELEDBY[primitives.cancBy] : null,
      cancAt: primitives.cancAt,
      cancPostConfirm: primitives.cancPostConfirm ,
      cancReason: primitives.cancReason,

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
  //TODO DA ELIMINARE E UTILIZZARE UN SUMMARY MIGLIORE
  static toResDto(record: PrismaBookingSummarySelect): BookingResDto {
    return {
      id: record.id,
      courtId: record.courtId,
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[record.status],
      clubId: record.clubId,
      description: record.description ?? '',
      startsAt: record.startsAt,
      endsAt: record.endsAt,
    } as BookingResDto;
  }

  static toResUserDto(record: PrismaBookingUserSummarySelect): BookingUserResDto {
    return {
      id: record.id,
      courtId: record.courtId,
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[record.status],
      clubId: record.clubId,
      description: record.description ?? '',
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt.toISOString(),
      courtName: record.court.name,
      isIndoor: record.court.isIndoor,
      position: record.club.position
    };
  }

  // static toResDtoFromDomain(booking: Booking): BookingResDto {
  //   const primitives = booking.toPrimitives();
  //   return {
  //     id: primitives.id,
  //     courtId: primitives.courtId,
  //     status: primitives.status,
  //     clubId: primitives.clubId,
  //     description: primitives.description ?? '',
  //     startsAt: primitives.startsAt.toISOString(),
  //     endsAt: primitives.endsAt.toISOString(),
  //   };
  // }

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