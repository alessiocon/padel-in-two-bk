import { Inject, Injectable } from "@nestjs/common";
import { type IUserRepository, USER_REPOSITORY } from "../domain/user.repository.interface.js";
import { UserSearchListResDto } from "../presentation/user.dto.js";


export type usersListUseCaseProps = {
    userSearchedId: string;
    username?: string;
}

@Injectable()
export class usersListUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user : IUserRepository,
  ) {}

  async execute(input: usersListUseCaseProps) : Promise<UserSearchListResDto[]> {
        const user = await this.user.findListRO(input);
        return user;
  }
}