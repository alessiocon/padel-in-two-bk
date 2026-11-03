import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '@prisma/client';
import  type { IPlayerRepository } from './player-IRepository.js';
import { Player } from '../domain/player.aggregate.js';
import { playerCheckSelect, PlayerMapper, PrismaPlayerCheckSelect } from './prisma.player.mapper.js';

@Injectable()
export class PrismaPlayerRepository implements IPlayerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(player: Player): Promise<Player> {
    const playerPrimitive = PlayerMapper.domainPlayerToPrisma(player);
    
    try {
        const record = await this.prisma.player.create({
          data: playerPrimitive,
          include: {levelHistory: true}
        });
        
        return PlayerMapper.prismaPlayerToDomain(record);
      } catch (error) {
        throw new BadRequestException("non è stato possibile creare il player")
      }
  }


  async findById(id: string): Promise<Player> {

    const record = await this.prisma.player.findFirst({
      where: {id},
      include: {
        levelHistory: true
      }
    });

    if(record === null) throw new BadRequestException("Player non trovato")

    return PlayerMapper.prismaPlayerToDomain(record);
  }

  async findByUserId(userId: string): Promise<PrismaPlayerCheckSelect> {

    const record = await this.prisma.player.findFirst({
      where: {userId},
      select: playerCheckSelect
    });

    if(record === null) throw new BadRequestException("Player non trovato")

    return {id: record.id};
  }


  async findAll(ids?: string[]): Promise<Player[]> {
    const whereCondition: Prisma.PlayerWhereInput = {};
    if (ids && ids.length > 0) {
      whereCondition.id = {
        in: ids
      };
    }

    const records = await this.prisma.player.findMany({
      where: whereCondition,
      include: {
        levelHistory: true
      }
    });

    return records.map((record) => PlayerMapper.prismaPlayerToDomain(record));
  }

  async checkIfExist(ids: string[]): Promise<string[]> {
    const whereCondition: Prisma.PlayerWhereInput = {};
    if (ids && ids.length > 0) {
      whereCondition.id = {
        in: ids
      };
    }

    const records = await this.prisma.player.findMany({
      where: whereCondition,
      select: {
        id: true
      }
    });

    return records.map(x => x.id);
  }

}
