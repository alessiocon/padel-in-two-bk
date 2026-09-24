import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { type IUserRepository, USER_REPOSITORY} from '../domain/user.repository.interface.js';
import { CreateUserDto } from '../presentation/user.dto.js';
import { PasswordHasher } from '../infrastructure/password.hasher.js';
import { User } from '../domain/user.entity.js';
import { UserNotFoundError } from '../domain/user-errors.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { userRegisteredEvent } from '../domain/user-events.js';


@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(USER_REPOSITORY) private readonly user : IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateUserDto) : Promise<User> {
    const passwordHash = await PasswordHasher.hash(dto.password);
    const timeNow = this.clock.now();

    const newUser = User.create({
        email: dto.email,
        passwordHash: passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        createdAt: timeNow,
    })

    try {
      let user = await this.user.create(newUser);
      const verificationToken = user.id;

      this.eventEmitter.emit('user.registered',
        new userRegisteredEvent(
          newUser.email,
          newUser.firstName,
          newUser.lastName,
          verificationToken
        ),
      );

      return user;

    } catch (error: any) {
      //TODO: il catch così è molto fragile, da sostituire appena si può      
      if (error?.code === 'P2002') {
        const targetField : string= error.meta?.driverAdapterError.cause.constraint.index; // Es. ['email'] o ['username']
        let key = targetField.split("_")[1];
        throw new ConflictException(`${key} già in uso`);
      }
      throw error;
    }
  }
}

@Injectable()
export class updateUserUseCase{
  constructor(
      @Inject(USER_REPOSITORY) private readonly userRepo : IUserRepository   
    ) {}

    async execute(user: User) : Promise<User>{
      return this.userRepo.update(user)
    }
}

@Injectable()
export class GetUserByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user : IUserRepository   
  ) {}

  async execute(email: string) {
    return this.user
    .findByEmail(email);
  }
}

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user
    : IUserRepository
    ,
  ) {}

  async execute(id: string) : Promise<User> {
        const user = await this.user.findById(id);
        if (!user) {
            throw new UserNotFoundError(id);
        }
    return user;
  }
}



export const USER_USE_CASES = [
  CreateUserUseCase,
  GetUserByEmailUseCase,
  GetUserByIdUseCase,
  updateUserUseCase
];