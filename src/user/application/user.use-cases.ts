import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { type IUserRepository, USER_REPOSITORY} from '../domain/user.repository.interface.js';
import { CreateUserDto } from '../presentation/user.dto.js';
import { PasswordHasher } from '../infrastructure/password.hasher.js';
import { User } from '../domain/user.entity.js';
import { UserNotFoundError } from '../domain/user-errors.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';


@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(USER_REPOSITORY) private readonly user : IUserRepository,
  ) {}

  async execute(dto: CreateUserDto) : Promise<User> {
    const existingUser = await this.user.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await PasswordHasher.hash(dto.password);
    const timeNow = this.clock.now();

    return await this.user.create(User.create({
        email: dto.email,
        passwordHash: passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        createdAt: timeNow
    }))
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
];