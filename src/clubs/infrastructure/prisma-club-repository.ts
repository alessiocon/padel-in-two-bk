import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Club, type ClubProps } from '../domain/club.js';
import { ClubConflictError, ClubNotFoundError } from '../domain/club-errors.js';
import type { IClubRepository } from '../domain/club-repository.js';

@Injectable()
export class PrismaClubRepository implements IClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Club[]> {
    const records = await this.prisma.club.findMany({ orderBy: { createdAt: 'asc' }, include: { courts: true } });
    return records.map((record) => this.toDomain(record));
  }

  async findById(id: string): Promise<Club | null> {
    const record = await this.prisma.club.findUnique({ where: { id }, include: { courts: true } });
    return record ? this.toDomain(record) : null;
  }

  async create(club: Club): Promise<Club> {
    try {
      const record = await this.prisma.$transaction(async (transaction) => {
        await transaction.club.create({ data: this.toData(club) });
        await transaction.court.createMany({
          data: club.courts.map((court) => ({
            id: court.id,
            clubId: club.id,
            name: court.name,
            status: 'AVAILABLE' as const,
          })),
        });
        return transaction.club.findUniqueOrThrow({
          where: { id: club.id },
          include: { courts: true },
        });
      });
      return this.toDomain(record);
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
          status: club.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        },
        include: { courts: true },
      });
      return this.toDomain(record);
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

  private toDomain(record: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    courts?: Array<{
      id: string;
      clubId: string;
      name: string;
      status: string;
    }>;
  }): Club {
    const props: ClubProps = {
      id: record.id,
      name: record.name,
      email: record.email,
      status: record.status.toLowerCase() as ClubProps['status'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      courts: record.courts?.map((court) => ({
        id: court.id,
        clubId: court.clubId,
        name: court.name,
        status: court.status.toLowerCase() as ClubProps['courts'][number]['status'],
      })) ?? [],
    };
    return Club.reconstitute(props);
  }

  private toData(club: Club) {
    return {
      id: club.id,
      name: club.name,
      email: club.email,
      status: club.status === 'active' ? 'ACTIVE' as const : 'INACTIVE' as const,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
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