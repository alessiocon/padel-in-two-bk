import { UserSearchListResDto, UserSearchListDto } from '../presentation/user.dto.js';
import { User } from './user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: Omit<User, 'id'  | 'createdAt' |'updatedAt' | 'role' |'toResponse' | 'toPrimitives'> & { passwordHash: string }): Promise<User>;
  update(user: User): Promise<User>;

  findListRO(search: UserSearchListDto) : Promise<UserSearchListResDto[]>;
}