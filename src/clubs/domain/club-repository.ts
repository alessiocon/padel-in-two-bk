import type { Club } from './club.js';

export const CLUB_REPOSITORY = Symbol('CLUB_REPOSITORY');

export interface IClubRepository {
  findAll(): Promise<Club[]>;
  findById(id: string): Promise<Club | null>;
  create(club: Club): Promise<Club>;
  update(club: Club): Promise<Club>;
  delete(id: string): Promise<void>;
}