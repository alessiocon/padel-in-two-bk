import { describe, expect, it } from 'vitest';
import { Club } from '../domain/club.js';
import { ClubNotFoundError } from '../domain/club-errors.js';
import type { IClubRepository } from '../domain/club-repository.js';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubUseCase,
  UpdateClubUseCase,
} from './club-use-cases.js';

class FakeClubRepository implements IClubRepository {
  readonly records = new Map<string, Club>();

  async findAll(): Promise<Club[]> {
    return [...this.records.values()];
  }

  async findById(id: string): Promise<Club | null> {
    return this.records.get(id) ?? null;
  }

  async create(club: Club): Promise<Club> {
    this.records.set(club.id, club);
    return club;
  }

  async update(club: Club): Promise<Club> {
    this.records.set(club.id, club);
    return club;
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}

describe('Club use cases', () => {
  it('creates and updates a club through the repository port', async () => {
    const repository = new FakeClubRepository();
    const create = new CreateClubUseCase(repository);
    const update = new UpdateClubUseCase(repository);

    const club = await create.execute({ name: 'Padel Torino', email: 'info@padeltorino.it', courtCount: 2 });
    const updated = await update.execute({ id: club.id, name: 'Padel Torino Centro' });

    expect(updated.name).toBe('Padel Torino Centro');
    expect(repository.records.get(club.id)?.name).toBe('Padel Torino Centro');
  });

  it('rejects reads and deletes for an unknown club', async () => {
    const repository = new FakeClubRepository();
    const get = new GetClubUseCase(repository);
    const remove = new DeleteClubUseCase(repository);

    await expect(get.execute('missing-id')).rejects.toBeInstanceOf(ClubNotFoundError);
    await expect(remove.execute('missing-id')).rejects.toBeInstanceOf(ClubNotFoundError);
  });
});