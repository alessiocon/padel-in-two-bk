import { Club } from '../domain/club.aggregate.js';
import { ClubConflictError, ClubNotFoundError } from '../domain/club-errors.js';
import { Inject, Injectable, NotFoundException, ForbiddenException} from '@nestjs/common';
import { UserRole } from './../../user/domain/user.entity.js';
import { CLUB_REPOSITORY, type IClubRepository } from '../domain/club-IRepository.js';
import { USER_REPOSITORY, type IUserRepository } from '../../user/domain/user.repository.interface.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { ClubResDto, ClubsResDto } from './../presentation/club.dto.js';



export type CreateClubInput = {
  ownerId: string; 
  name: string;
  email: string;
  position: string;
  timezone: string;
  slotPrice: number;
  racketPrice: number;
  slotDurationMinutes: number; 
  openingTime: string;         
  closingTime: string;       
  courtInDoor: number;
  courtOutDoor: number;
}
export type UpdateClubCommand = { id: string; name?: string; email?: string; status?: 'ACTIVE' | 'INACTIVE' };



@Injectable()
export class CreateClubUseCase {
  constructor(
    @Inject(CLOCK_SERVICE)   private readonly clock: IClockService,
    @Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository,
    @Inject(USER_REPOSITORY) private readonly user: IUserRepository
  ) {}

  async execute(command: CreateClubInput): Promise<Club> {
    const owner = await this.user.findById(command.ownerId);

    if (!owner) {
      throw new NotFoundException(`User with ID ${command.ownerId} does not exist.`);
    }

    // Opzionale: verifica che l'utente abbia il ruolo adatto per possedere un club
    if (owner.role !== UserRole.CLUB_OWNER && owner.role !== UserRole.ADMIN) {
      throw new ForbiddenException('User is not authorized to own a club.');
    }

    var dateNow = this.clock.now();
    
    return await this.clubs.create(Club.create(
      {
        ownerId :command.ownerId,
        name: command.name,
        email :command.email,
        position: command.position,
        timezone :command.timezone,
        racketPrice: command.racketPrice,
        slotDurationMinutes :command.slotDurationMinutes,
        openingTime :command.openingTime,
        closingTime :command.closingTime,
        createdAt :dateNow
      },
      command.slotPrice,
      command.courtInDoor,
      command.courtOutDoor
    ));
  }
}

      
      

@Injectable()
export class ListClubsUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(): Promise<ClubsResDto[]> {
    return await this.clubs.RO_findAll();
  }
}

@Injectable()
export class GetClubUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(id: string): Promise<ClubResDto> {
    const club = await this.clubs.RO_findById(id);
    if (!club) {
      throw new ClubNotFoundError(id);
    }
    return club;
  }
}

@Injectable()
export class GetClubByManagerUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(id: string, ownerId: string): Promise<ClubResDto> {
    const club = await this.clubs.RO_findById(id);
    if (!club) {
      throw new ClubNotFoundError(id);
    }
    if(club.ownerId !== ownerId){
       throw new ClubConflictError("Non sei autorizzato ad acccedere a questo club");
    }
    return club;
  }
}

// @Injectable()
// export class UpdateClubUseCase {
//   constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

//   async execute(command: UpdateClubCommand): Promise<Club> {
//     const club = await new GetClubUseCase(this.clubs).execute(command.id);

//     if (command.name !== undefined) {
//       club.rename(command.name);
//     }
//     if (command.email !== undefined) {
//       club.changeEmail(command.email);
//     }
//     if (command.status === 'ACTIVE') {
//       club.activate();
//     } else if (command.status === 'INACTIVE') {
//       club.deactivate();
//     }

//     return this.clubs.update(club);
//   }
// }

@Injectable()
export class DeleteClubUseCase {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubs: IClubRepository) {}

  async execute(id: string): Promise<void> {
    await new GetClubUseCase(this.clubs).execute(id);
    await this.clubs.delete(id);
  }
}