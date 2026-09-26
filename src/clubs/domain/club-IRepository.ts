import { ClubResDto, ClubsResDto } from '../presentation/club.dto.js';
import type { Club } from './club.aggregate.js';

export const CLUB_REPOSITORY = Symbol('CLUB_REPOSITORY');

export interface IClubRepository {
  findAll(): Promise<Club[]>;
  findById(id: string): Promise<Club | null>;
  create(club: Club): Promise<Club>;
  update(club: Club): Promise<Club>;
  delete(id: string): Promise<void>;

  RO_findAll(): Promise<ClubsResDto[]>;
  RO_findById(id: string): Promise<ClubResDto | null>;
}