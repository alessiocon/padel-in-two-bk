import {
  Prisma,
  Booking as PrismaBooking,
  BookingTeam as PrismaTeam,
  BookingPlayer as PrismaPlayer,
  BookingLogs as PrismaBookingLogs,
  BookingStatus as PrismaBookingStatus,
  BookingCancBy as PrismaBookingCancBy,
  BookingEventType as PrismaEventType,
  BookingPlayerStatus as PrismaBookingPlayerStatus,
  User as PrismaUser
} from '@prisma/client';
import { Booking, BookingCancBy, BookingStatus} from '../domain/booking.aggregate.js';
import { BookingResDto, BookingTeamResDto, BookingUserResDto } from '../presentation/booking.dto.js';
import { BookingLogs, BookingEventType } from '../domain/valueObject/booking.log.value.js';
import { BookingPlayer, BookingPlayerStatus, PlayerIdentity } from '../domain/entity/booking.player.entity.js';
import { BookingTeam } from '../domain/entity/booking.team.entity.js';


export type PrismaBookingWithRelations = PrismaBooking & {
  teams: (PrismaTeam & {
    players: PrismaPlayer[];
  })[];
  logs: PrismaBookingLogs[];
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

  createdBy: {
    select: {
      id: true, 
      username: true, 
      firstName: true, 
      lastName: true}
  },

  teams: {
    select: {
      id: true,
      bookingId: true,
      teamNumber:true,
      teamName: true,
      players: {select:
        {
          id: true,
          status: true,
          firstName: true,
          lastName: true,
          phone: true,
          userId: true,
          user: true
        }
      }
    }
  },
  logs: {
    orderBy: { createdAt: 'desc' },
    select : 
    {
      createdAt: true,
      message: true,
      eventType: true,     
      user: {select: {username: true}}
    }
  },

  cancAt: true,
  cancBy: true,
  cancPostConfirm: true,
  cancReason: true,

  club: {
    select: {position: true, name: true}
  },
  court: {
    select: {isIndoor: true, name: true}
  },
  createdAt: true,
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
  logs: (PrismaBookingLogs & {
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
    [PrismaEventType.INSERT]: BookingEventType.INSERT,
    [PrismaEventType.REMOVED]: BookingEventType.REMOVED,
    [PrismaEventType.PLAYER_JOINED]: BookingEventType.PLAYER_JOINED,
    [PrismaEventType.PLAYER_LEFT]: BookingEventType.PLAYER_LEFT,
    [PrismaEventType.STATUS_CHANGED]: BookingEventType.STATUS_CHANGED,
    [PrismaEventType.CANCELLED]: BookingEventType.CANCELLED,
  };

  public static readonly DOMAIN_TO_PRISMA_EVENT_TYPE: Record<BookingEventType, PrismaEventType> = {
    [BookingEventType.CREATED]: PrismaEventType.CREATED,
    [BookingEventType.INSERT]: PrismaEventType.INSERT,
    [BookingEventType.REMOVED]: PrismaEventType.REMOVED,
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
    const bookingLogs = raw.logs.map(log => this.mapPrismaBookingLogsToDomain(log));

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
      logs: bookingLogs,
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

  private static mapPrismaBookingLogsToDomain(prismaLog: PrismaBookingWithRelations['logs'][number]): BookingLogs {
    return BookingLogs.reconstitute({
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

      logs: primitives.logs.map(log => ({
        eventType: log.eventType,
        message: log.message,
        createdAt: log.createdAt.toISOString(),
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
      create: Prisma.BookingLogsCreateWithoutBookingInput[];
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
        create: primitives.logs.map(log => ({
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
      teams: raw.teams.map(team => (this.prismaTeamToDto(team))),
      
      logs: raw.logs.map(log => ({
        eventType: this.PRISMA_TO_DOMAIN_EVENT_TYPE[log.eventType],
        message: log.message,
        createdAt: log.createdAt.toISOString(),
        username: log.user?.username ?? null, // Molto utile anche nei log!
      })),

      cancAt: raw.cancAt,
      cancBy: raw.cancBy? this.PRISMA_TO_DOMAIN_BOOKING_CANCELEDBY[raw.cancBy] : null,
      cancPostConfirm: raw.cancPostConfirm,
      cancReason: raw.cancReason,

      createdAt: raw.createdAt
    };
  }

  static prismaTeamToDto(team: PrismaTeam & { players: (PrismaPlayer & { user: PrismaUser | null})[];}): BookingTeamResDto {
    return {
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
      }
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
      createdBy: record.createdBy,
      courtId: record.courtId,
      isCourtIndoor: record.court.isIndoor,
      courtName: record.court.name,

      clubId: record.clubId,
      clubName: record.club.name,
      position: record.club.position,
    
      status: this.PRISMA_TO_DOMAIN_BOOKING_STATUS[record.status],
      description: record.description ?? '',
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt.toISOString(),
      isIndoor: record.court.isIndoor,
      teams: record.teams.map(team => {
        return {
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
        }
      }),

      cancAt: record.cancAt,
      cancBy: record.cancBy ? this.PRISMA_TO_DOMAIN_BOOKING_CANCELEDBY[record.cancBy] : null,
      cancPostConfirm: record.cancPostConfirm,
      cancReason: record.cancReason,

      logs: record.logs.map(log => {
        return {
          createdAt: log.createdAt.toISOString(),
          eventType: this.PRISMA_TO_DOMAIN_EVENT_TYPE[log.eventType],
          message: log.message,
          username: log.user?.username ?? null
        }
      }),
      createdAt: record.createdAt
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