import { Player } from "../domain/player.aggregate.js";
import { PrismaPlayerCheckSelect } from "./prisma.player.mapper.js";

export const PLAYER_IREPOSITORY = Symbol('PLAYER_REPOSITORY');

export interface IPlayerRepository {
  create(player: Player): Promise<Player>;

  findById(id: string): Promise<Player>;
  findByUserId(userId: string): Promise<PrismaPlayerCheckSelect>;
  findAll(ids?: []): Promise<Player[]>;

  checkIfExist(ids: string[]): Promise<string[]>;
  

  // RO_FindAllByClubId(clubId: string, from?: Date, to?: Date): Promise<BookingQuickResDto[]>
  // RO_SearchBookings(clubId?: string, from?: Date, to?: Date, userId?: string, status?: BookingStatus): Promise<BookingQuickResDto[]>
  // RO_FindDetailsById(id: string, userId: string): Promise<BookingDetailResDto>
}
