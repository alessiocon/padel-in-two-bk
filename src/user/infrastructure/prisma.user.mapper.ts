import {
  Prisma,
  User as PrismaUser
} from '@prisma/client';
import { UserSearchListResDto } from '../presentation/user.dto.js';


export const userListSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  firstName:true,
  lastName: true,
  username: true,
  phone: true
});

export type PrismaUserListSelect = Prisma.UserGetPayload<{
  select: typeof userListSelect;
}>;

// ==========================================
// MAPPER CLASS
// ==========================================

export abstract class BookingMapper {

}