import { UserSearchListResDto, UserSearchListDto, UserPermissionsResponseDto } from '../presentation/user.dto.js';
import { User } from '../domain/user.entity.js';
import { AuthUserResDto} from '../../auth/presentation/auth.dto.js';

export const USER_IREPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: Omit<User, 'id'  | 'createdAt' |'updatedAt' | 'role' |'toResponse' | 'toPrimitives'> & { passwordHash: string }): Promise<User>;
  update(user: User): Promise<User>;

  getAllUserPermissions(userId: string) : Promise<UserPermissionsResponseDto>;
  RO_findAuth(userId: string) : Promise<AuthUserResDto> 
  RO_findList(search: UserSearchListDto) : Promise<UserSearchListResDto[]>;
}