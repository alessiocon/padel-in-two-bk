import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { BookingConflictError, BookingCourtNotFoundError } from '../domain/booking-errors.js';
import type { IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingMapper, bookingQuickSummarySelect, bookingSummarySelect, bookingDetailsSelect } from './prisma-booking-mapper.js';
import { BookingQuickResDto, BookingDetailResDto } from '../presentation/booking.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) {}



  
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
        logs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: {startsAt: 'desc'} });

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
      userId: player.userId,
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

  async RO_SearchBookings(
    clubId?: string,
    from?: Date,
    to?: Date,
    userId?: string,
    status?: BookingStatus,
  ): Promise<BookingQuickResDto[]> {
    const whereCondition: Prisma.BookingWhereInput = {
      ...(clubId ? { clubId } : {}),
      ...(status ? {status}: {}),
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(userId
        ? {
            OR: [
              { createdById: userId },
              {
                teams: {
                  some: {
                    players: {
                      some: { userId },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const records = await this.prisma.booking.findMany({
      where: whereCondition,
      select: bookingQuickSummarySelect,
      orderBy: { startsAt: 'desc' },
    });

    return records.map((record) => BookingMapper.prismaToBookingQuickResDto(record));
  }



  async RO_FindDetailsById(id: string, userId: string): Promise<BookingDetailResDto> {

    const whereCondition: Prisma.BookingWhereInput = {
      id,
      OR: [
        { createdById: userId },
        {club: {ownerId: userId}},
        {teams: { some: { players: { some: { userId },},},},},
      ]
    };

    const record = await this.prisma.booking.findFirst({
      where: whereCondition,
      select: bookingDetailsSelect
    });

    if(!record) throw new BadRequestException("prenotazione non trovata, o autorizzazione non concessa");
    return BookingMapper.prismaToBookingDetails(record);
  }

  private isOverlapError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('bookings_no_active_overlap');
  }
}
