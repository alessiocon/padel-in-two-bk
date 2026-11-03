import {
  Prisma,
  Player as PrismaPlayer,
  PlayerLevelHistory as PrismaPlayerLevelHistory,
  User as PrismaUser
} from '@prisma/client';
import { Player } from '../domain/player.aggregate.js';
import { PlayerLevelHistory } from '../domain/entity/player.level.history.js';



export const playerCheckSelect = Prisma.validator<Prisma.PlayerSelect>()({
  id: true,
});

export type PrismaPlayerCheckSelect = Prisma.PlayerGetPayload<{
  select: typeof playerCheckSelect;
}>;

export type PrismaPlayerWithRelations = PrismaPlayer & {
  levelHistory: PrismaPlayerLevelHistory[]
};

// ==========================================
// MAPPER CLASS
// ==========================================

export abstract class PlayerMapper {

  /**
   * Converte un record Prisma nell'Entità di Dominio Booking
   */
  public static prismaPlayerToDomain(raw: PrismaPlayerWithRelations): Player {
    const levelHistory = raw.levelHistory.map(level => this.prismaPlayerLevelHistoryToDomain(level));

    return Player.reconstitute({
      id: raw.id,
      userId: raw.userId,
      level: raw.level.toNumber(),
      matchesPlayed: raw.matchesPlayed,
      wins: raw.wins,
      losses: raw.losses,
      reliabilityScore: raw.reliabilityScore.toNumber(),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      levelHistory: levelHistory
    });
  }

  private static prismaPlayerLevelHistoryToDomain(raw: PrismaPlayerWithRelations['levelHistory'][number]): PlayerLevelHistory {
  
     
      return PlayerLevelHistory.reconstitute({
        id: raw.id,
        playerId: raw.playerId, 
        bookingMatchId: raw.bookingMatchId,
        tournamentMatchId: raw.tournamentMatchId,
        levelBefore: raw.levelAfter.toNumber(),
        levelAfter: raw.levelAfter.toNumber(),
        createdAt: raw.createdAt  
      });
  }

  public static domainPlayerToPrisma(raw: Player): Prisma.PlayerUncheckedCreateInput & {
    levelHistory: { create: Prisma.PlayerLevelHistoryUncheckedCreateInput[] }} 
  {
    const player = raw.toPrimitives();
    const levelHistoryData = raw.levelHistory.map(history => history.toPrimitives());
    
    return {
      ...player,
      levelHistory: { create: levelHistoryData},
    }
  }
}