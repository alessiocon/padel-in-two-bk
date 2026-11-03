import { Inject, Injectable } from "@nestjs/common";
import { type IUserRepository, USER_IREPOSITORY } from "../infrastructure/user.repository.interface.js";
import { UserSearchListResDto } from "../presentation/user.dto.js";


export type usersListUseCaseProps = {
    userSearchedId: string;
    username?: string;
}

@Injectable()
export class usersListUseCase {
  constructor(
    @Inject(USER_IREPOSITORY) private readonly user : IUserRepository,
  ) {}

  async execute(input: usersListUseCaseProps) : Promise<UserSearchListResDto[]> {
        const user = await this.user.RO_findList(input);
        return user;
  }
}