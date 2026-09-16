import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Club, ClubStatus} from '../domain/club.js';
import { ClubConflictError, ClubNotFoundError } from '../domain/club-errors.js';
import type { IClubRepository } from '../domain/club-repository.js';
import { clubDetailSelect, ClubMapper, clubSummarySelect } from './prisma-club-mapper.js';
import { ClubResDto, ClubsResDto } from './../presentation/club.dto.js';


@Injectable()
export class PrismaClubRepository implements IClubRepository {
  constructor(private readonly prisma: PrismaService) {}


  async findAll(): Promise<Club[]> {
    const records = await this.prisma.club.findMany({ orderBy: { createdAt: 'asc' }, include: { courts: true } });
    return records.map((record) => ClubMapper.toDomain(record));
  }

  async findById(id: string): Promise<Club | null> {
    const record = await this.prisma.club.findUnique({ where: { id }, include: { courts: true } });
    return record ? ClubMapper.toDomain(record) : null;
  }

  async create(club: Club): Promise<Club> {
    try {
      const record = await this.prisma.$transaction(async (transaction) => {
        await transaction.club.create({ data: ClubMapper.toPersistence(club) });
        await transaction.court.createMany({
          data: club.courts.map((court) => ClubMapper.toCourtPersistence(court)),
        });
        return transaction.club.findUniqueOrThrow({
          where: { id: club.id },
          include: { courts: true },
        });
      });
      return ClubMapper.toDomain(record);
    } catch (error) {
      this.throwMappedError(error, club.name);
    }
  }

  async update(club: Club): Promise<Club> {
    try {
      const record = await this.prisma.club.update({
        where: { id: club.id },
        data: {
          name: club.name,
          email: club.email,
          status: ClubMapper.toPersistence(club).status,
          slotDurationMinutes: club.slotDurationMinutes,
          openingTime: club.openingTime,
          closingTime: club.closingTime,
        },
        include: { courts: true },
      });
      return ClubMapper.toDomain(record);
    } catch (error) {
      this.throwMappedError(error, club.name, club.id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.club.delete({ where: { id } });
    } catch (error) {
      if (this.isPrismaCode(error, 'P2025')) {
        throw new ClubNotFoundError(id);
      }
      throw error;
    }
  }

  async RO_findAll(): Promise<ClubsResDto[]> {
    const records = await this.prisma.club.findMany({
      orderBy: { createdAt: 'asc' },
      select: clubSummarySelect,
    });

    return records.map((record) => ClubMapper.toSummaryDto(record));
  }


  async RO_findById(id: string): Promise<ClubResDto | null> {
    const record = await this.prisma.club.findUnique({
      where: { id },
      select: clubDetailSelect,
    });

    if (!record) return null;
    return ClubMapper.toDetailDto(record);
  }

  


  private throwMappedError(error: unknown, name: string, id?: string): never {
    if (this.isPrismaCode(error, 'P2002')) {
      throw new ClubConflictError(name);
    }
    if (this.isPrismaCode(error, 'P2025') && id) {
      throw new ClubNotFoundError(id);
    }
    throw error;
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
  }
}