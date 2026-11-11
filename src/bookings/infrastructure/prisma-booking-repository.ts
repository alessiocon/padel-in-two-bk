import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingConflictError, BookingCourtNotFoundError } from '../domain/booking-errors.js';
import type { IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingMapper, bookingQuickSummarySelect, bookingSummarySelect, bookingDetailsSelect, bookingMatchSelect } from './prisma-booking-mapper.js';
import { BookingQuickResDto, BookingDetailResDto, SearchBookingQuery, BookingMatchResDto } from '../presentation/booking.dto.js';
import { Prisma } from '@prisma/client';
import { TournamentMapper } from '../../tournament/infrastracture/prisma-tournament-mapper.js';
import { BookingMatch } from '../domain/entity/booking.match.entity.js';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}



  
  async create(booking: Booking): Promise<BookingQuickResDto> {
    const bookingPrimitive = BookingMapper.domainBookingToPersistence(booking);

    try {
      const record = await this.prisma.booking.create({
        data: bookingPrimitive,
        select: bookingQuickSummarySelect
      });
      
      return BookingMapper.prismaToBookingQuickResDto(record);
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
        logs: { orderBy: { createdAt: 'desc' } },
        match: {
          include: {
            sets: true
          }
        },
        court: { select: {size: true }},
      },
    });

    if (!record) {
      throw new NotFoundException("Prenotazione non trovata");
    }

    return BookingMapper.prismaBookingToDomain(record);
  }


  //QUESTO é IN READONLY
  // async findAllByClubId(clubId: string, query: string): Promise<Booking[]> {
  //   const whereCondition: any = { clubId };

  //   const startOfDay = new Date(`${query}T00:00:00.000Z`);
  //   const endOfDay = new Date(`${query}T23:59:59.999Z`);

  //   whereCondition.startsAt = {
  //     gte: startOfDay,
  //     lte: endOfDay,
  //   };


  //   const records = await this.prisma.booking.findMany({ 
  //     where: whereCondition, 
  //     include: {
  //       teams: {
  //         include: {
  //           players: true,
  //         },
  //       },
  //       logs: { orderBy: { createdAt: 'desc' } },
  //     },
  //     orderBy: {startsAt: 'desc'} });

  //   return records.map((record) => BookingMapper.prismaBookingToDomain(record));
  // }

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

  async update(booking: Booking): Promise<BookingDetailResDto> {
    const data = BookingMapper.toPersistence(booking);
    try {
      const record = await this.prisma.$transaction(async (transaction) => {
        const newLogs = await this.findNewLogs(transaction, booking);
        await this.removeDeletedTeamsAndPlayers(transaction, booking);
        
        return transaction.booking.update({
          where: { id: booking.id },
          data: {
            startsAt: data.startsAt,
            endsAt: data.endsAt,
            status: data.status,
            updatedAt: data.updatedAt,
            cancBy: data.cancBy,
            cancAt: data.cancAt,
            cancPostConfirm: data.cancPostConfirm,
            cancReason: data.cancReason,
            court: { connect: { id: data.courtId } },
            club: { connect: { id: data.clubId } },
            createdBy: { connect: { id: data.createdById } },
            teams: { upsert: this.buildTeamUpserts(booking) },
            ...(newLogs.length > 0
              ? {
                  logs: {
                    create: newLogs.map((log) => ({
                      userId: log.userId,
                      eventType: BookingMapper.DOMAIN_TO_PRISMA_EVENT_TYPE[log.eventType],
                      message: log.message,
                      createdAt: log.createdAt,
                    })),
                  },
                }
              : {}),
          },
          select: bookingDetailsSelect
        });
      });

      return BookingMapper.prismaToBookingDetails(record);
    } catch (error) {
      // Intercetta eventuali violazioni dei vincoli di sovrapposizione a livello DB (Exclusion Constraint / Trigger)
      if (this.isOverlapError(error)) {
        throw new BookingConflictError();
      }
      throw error;
    }
  }

  async saveMatch(booking: Booking, expectedUpdatedAt: Date, transaction?: Prisma.TransactionClient): Promise<BookingMatchResDto> {
    try {
      const matchUpsert = this.buildMatchUpsert(booking);
      if (!matchUpsert) {
        throw new BadRequestException("Nessun match presente da salvare.");
      }

      const persist = async (transaction: Prisma.TransactionClient) => {
        const changed = await transaction.booking.updateMany({
          where: { id: booking.id, updatedAt: expectedUpdatedAt, status: 'IN_PROGRESS' },
          data: {
            status: BookingMapper.DOMAIN_TO_PRISMA_BOOKING_STATUS[booking.status],
            updatedAt: booking.updatedAt,
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException('Booking changed concurrently; reload before retrying');
        }
        const newLogs = await this.findNewLogs(transaction, booking);

        if (newLogs.length > 0) {
          await transaction.bookingLogs.createMany({
            data: newLogs.map((log) => ({
              bookingId: booking.id,
              userId: log.userId,
              eventType: BookingMapper.DOMAIN_TO_PRISMA_EVENT_TYPE[log.eventType],
              message: log.message,
              createdAt: log.createdAt,
            })),
          });
        }

        const savedMatchRecord = await transaction.bookingMatch.upsert({
          where: { id: matchUpsert.where.id },
          create: matchUpsert.matchCreateData,
          update: matchUpsert.matchUpdateData,
          select: bookingMatchSelect
        });

        return savedMatchRecord;
      };

      const record = await (transaction ? persist(transaction) : this.prisma.$transaction(persist));

      return BookingMapper.prismaToMatchDto(record);
    } catch (error) {
      throw error;
    }
  }

   public buildMatchUpsert(booking: Booking)  {
    const match = booking.match; 
    if (!match) return undefined; 

    const matchData = match.toPrimitives();

    const matchCreateData: Prisma.BookingMatchCreateInput = {
        id: match.id,
        format: TournamentMapper.DOMAIN_TO_PRISMA_MATCH_FORMAT[matchData.format],
        status: BookingMapper.DOMAIN_TO_PRISMA_MATCH_PROPOSE[matchData.status],
        proposeTeam: matchData.proposeByTeamId ? { connect: { id: matchData.proposeByTeamId} } : undefined, 
        winnerTeamNumber: matchData.winnerTeamNumber,
        proposeNumber: matchData.proposeNumber,
        booking: { connect: { id: booking.id } },
        sets: {
          create: match.score.value.map((set) => ({
            setNumber: set.setNumber,
            team1Games: set.team1Games,
            team2Games: set.team2Games,
            tieBreak: set.tieBreak,
          })),
        },
      };

      let {id, proposeNumber, sets, ...properties } = matchCreateData;

      const matchUpdateData: Prisma.BookingMatchUpdateInput = {
        ...properties,
        proposeNumber: matchData.proposeNumber + 1,
        sets: {
          deleteMany: {},
          create: sets?.create,
        },
      };

    return {
      where: { id: match.id },
      matchCreateData,
      matchUpdateData
    };
  }
  

  async deleteMatch(booking: Booking) : Promise<void>{
    try{
      await this.prisma.bookingMatch.delete({
        where: {bookingId: booking.id}
      });

    }catch(error){
      throw error;
    }
  }


  private async findNewLogs(transaction: Prisma.TransactionClient, booking: Booking) {
    const existingLogs = await transaction.bookingLogs.findMany({
      where: { bookingId: booking.id },
      select: {
        bookingId: true,
        userId: true,
        eventType: true,
        message: true,
        createdAt: true,
      },
    });

    const logKey = (log: {
      bookingId: string;
      userId: string | null;
      eventType: string;
      message: string;
      createdAt: Date;
    }) => JSON.stringify([
      log.bookingId,
      log.userId,
      log.eventType,
      log.message,
      log.createdAt.toISOString(),
    ]);
    const existingLogCounts = new Map<string, number>();
    for (const log of existingLogs) {
      const key = logKey(log);
      existingLogCounts.set(key, (existingLogCounts.get(key) ?? 0) + 1);
    }

    return booking.logs.filter((log) => {
      const key = logKey(log.toPrimitives());
      const existingCount = existingLogCounts.get(key) ?? 0;
      if (existingCount > 0) {
        existingLogCounts.set(key, existingCount - 1);
        return false;
      }
      return true;
    });
  }

  private async removeDeletedTeamsAndPlayers(
    transaction: Prisma.TransactionClient,
    booking: Booking,
  ): Promise<void> {
    const teamIds = booking.teams.map((team) => team.id);

    for (const team of booking.teams) {
      const playerIds = team.players.map((player) => player.id);
      await transaction.bookingPlayer.deleteMany({
        where: {
          teamId: team.id,
          ...(playerIds.length > 0 ? { id: { notIn: playerIds } } : {}),
        },
      });
    }

    await transaction.bookingTeam.deleteMany({
      where: {
        bookingId: booking.id,
        ...(teamIds.length > 0 ? { id: { notIn: teamIds } } : {}),
      },
    });
  }

  private buildTeamUpserts(booking: Booking) {
    return booking.teams.map((team) => ({
      where: { id: team.id },
      create: {
        id: team.id,
        teamNumber: team.teamNumber,
        teamName: team.teamName,
        players: {
          create: team.players.map((player) => ({
            id: player.id,
            ...this.toPlayerPersistence(player),
          })),
        },
      },
      update: {
        teamNumber: team.teamNumber,
        teamName: team.teamName,
        players: {
          upsert: team.players.map((player) => {
            const playerData = this.toPlayerPersistence(player);
            return {
              where: { id: player.id },
              create: { id: player.id, ...playerData },
              update: playerData,
            };
          }),
        },
      },
    }));
  }

  private toPlayerPersistence(player: Booking['teams'][number]['players'][number]) {
    const guest = player.guestDetails;
    return {
      playerId: player.playerId,
      status: BookingMapper.DOMAIN_TO_PRISMA_BOOKING_PLAYER_STATUS[player.status],
      firstName: guest?.firstName ?? null,
      lastName: guest?.lastName ?? null,
      phone: guest?.phone ?? null,
    };
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



  async RO_FindAllByClubId(clubId: string, from?: Date, to?: Date): Promise<BookingQuickResDto[]> {
    const whereCondition: Prisma.BookingWhereInput = { clubId };
    if (from || to) {
      whereCondition.startsAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const records = await this.prisma.booking.findMany({
      where: whereCondition,
      select: bookingDetailsSelect,
      orderBy: { startsAt: 'desc' },
    });

    return records.map((record) => BookingMapper.prismaToBookingQuickResDto(record));
  }


   //TODO: QUI SPECIFICARE USERID, PlayerId e ManagerId che attualmente prende sempre userId e non va bene
  async RO_SearchBookings(query: SearchBookingQuery & {from?: Date, to?: Date}) : Promise<BookingQuickResDto[]> {

    const orConditions: Prisma.BookingWhereInput[] = [];

    if (query.createdById) {
      orConditions.push({ createdById: query.createdById });
    }

    if (query.playerId) {
      orConditions.push({
        teams: { some: {  players: { some: { playerId: query.playerId },},},},});
    }

    const whereCondition: Prisma.BookingWhereInput = {
      ...(query.clubId ? { clubId: query.clubId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
      ...(orConditions.length > 0 ? { OR: orConditions } : {}),
      ...(query.member ? { club: { members: { some: { userId: query.createdById } } } } : {}),
    };

    const records = await this.prisma.booking.findMany({
      where: whereCondition,
      select: bookingQuickSummarySelect,
      take: 30,
      orderBy: { startsAt: 'desc' },
    });

    return records.map((record) => BookingMapper.prismaToBookingQuickResDto(record));
  }



  async RO_FindDetailsById(id: string, userId: string, playerId: string): Promise<BookingDetailResDto> {

    const whereCondition: Prisma.BookingWhereInput = {
      id,
      OR: [
        {createdById: userId },
        {club: {members: {some: { userId : userId} } } },
        {teams: { some: { players: { some: { playerId: playerId },},},},},
      ]
    };

    const record = await this.prisma.booking.findFirst({
      where: whereCondition,
      select: bookingDetailsSelect
    });

    if(!record) throw new BadRequestException("prenotazione non trovata, o autorizzazione non concessa");
    return BookingMapper.prismaToBookingDetails(record);
  }

  async RO_FindMatchByBookingId(bookingId: string, userId: string, playerId: string): Promise<BookingMatchResDto | null> {
    const whereCondition: Prisma.BookingMatchWhereInput = {
      bookingId: bookingId,
      booking: {
        OR: [
          {createdById: userId },
          {club: {members: {some: { userId : userId} } } },
          {teams: { some: { players: { some: { playerId: playerId },},},},},
        ]
      }
    };

    const record = await this.prisma.bookingMatch.findFirst({
      where: whereCondition,
      select: bookingMatchSelect
    });

    if(!record) return null;
    return BookingMapper.prismaToMatchDto(record);

  }

  private isOverlapError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('bookings_no_active_overlap');
  }

  
}
