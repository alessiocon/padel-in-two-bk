import { Club } from '../domain/club.js';
import { ClubNotFoundError } from '../domain/club-errors.js';
import { Inject, Injectable } from '@nestjs/common';
import { CLUB_REPOSITORY, type IClubRepository } from '../domain/club-repository.js';

export type CreateClubCommand = { name: string; email: string; courtCount: number };
export type UpdateClubCommand = { id: string; name?: string; email?: string; status?: 'active' | 'inactive' };

@Injectable()
export class CreateClubUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  execute(command: CreateClubCommand): Promise<Club> {
    return this.clubs.create(Club.create(command.name, command.email, undefined, command.courtCount));
  }
}

@Injectable()
export class ListClubsUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  execute(): Promise<Club[]> {
    return this.clubs.findAll();
  }
}

@Injectable()
export class GetClubUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(id: string): Promise<Club> {
    const club = await this.clubs.findById(id);
    if (!club) {
      throw new ClubNotFoundError(id);
    }
    return club;
  }
}

@Injectable()
export class UpdateClubUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(command: UpdateClubCommand): Promise<Club> {
    const club = await new GetClubUseCase(this.clubs).execute(command.id);

    if (command.name !== undefined) {
      club.rename(command.name);
    }
    if (command.email !== undefined) {
      club.changeEmail(command.email);
    }
    if (command.status === 'active') {
      club.activate();
    } else if (command.status === 'inactive') {
      club.deactivate();
    }

    return this.clubs.update(club);
  }
}

@Injectable()
export class DeleteClubUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(id: string): Promise<void> {
    await new GetClubUseCase(this.clubs).execute(id);
    await this.clubs.delete(id);
  }
}