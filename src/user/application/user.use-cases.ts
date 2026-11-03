import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository, USER_IREPOSITORY} from '../infrastructure/user.repository.interface.js';
import { User } from '../domain/user.entity.js';
import { UserNotFoundError } from '../domain/user-errors.js';
import { usersListUseCase } from './user.list.use-cases.js';
import { CreateUserUseCase } from './create.user.use-case.js';


@Injectable()
export class updateUserUseCase{
  constructor(
      @Inject(USER_IREPOSITORY) private readonly userRepo : IUserRepository   
    ) {}

    async execute(user: User) : Promise<User>{
      return this.userRepo.update(user)
    }
}

@Injectable()
export class GetUserByEmailUseCase {
  constructor(
    @Inject(USER_IREPOSITORY) private readonly user : IUserRepository   
  ) {}

  async execute(email: string) {
    return this.user
    .findByEmail(email);
  }
}

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_IREPOSITORY) private readonly user
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
  updateUserUseCase,
  usersListUseCase
];