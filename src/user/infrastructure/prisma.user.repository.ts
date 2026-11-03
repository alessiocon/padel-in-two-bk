import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { IUserRepository } from './user.repository.interface.js';
import { User, UserProps } from '../domain/user.entity.js';
import {Prisma, User as PrismaUser} from '@prisma/client';
import { UserSearchListResDto, UserPermissionsResponseDto } from '../presentation/user.dto.js';
import { usersListUseCaseProps } from '../application/user.list.use-cases.js';
import { userListSelect } from './prisma.user.mapper.js';
import { ClubMapper } from '../../clubs/infrastructure/prisma-club-mapper.js';
import { AuthUserResDto } from '../../auth/presentation/auth.dto.js';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? this.toDomain(raw) : null;
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async create(data: User): Promise<User> {

    const result = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          id: data.id,
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          phone: data.phone,
        },
      });

      await tx.player.create({
        data: {
          id: crypto.randomUUID(),
          userId: createdUser.id,
        },
      });

      return createdUser;
    })

    return this.toDomain(result);
  }

  async update(user: User): Promise<User> {
    const created = await this.prisma.user.update({
      where: {id: user.id},
      data: {
        isEmailVerified: user.isEmailVerified,
        passwordHash: user.passwordHash,
        updatedAt: user.updatedAt,
      }
     });
    return this.toDomain(created);
  }


  private toDomain(record: PrismaUser): User {
    const props : UserProps = {
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      firstName: record.firstName,
      lastName: record.lastName,
      username: record.username,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      isEmailVerified: record.isEmailVerified,
      phone: record.phone,
      deleteAt: record.deletedAt
    }
    return User.reconstitute(props);
  }

  async getAllUserPermissions(userId: string): Promise<UserPermissionsResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: true,        
        memberships: true,   
      },
    });

    if (!user) { throw new NotFoundException('Utente non trovato');}

    return {
      userId: user.id,
      playerId: user.player?.id || null,
      memberships: user.memberships.map((m) => ({
        clubId: m.clubId,
        role: ClubMapper.PRISMA_TO_DOMAIN_CLUB_ROLE[m.role],
        permissions: m.permissions,
      })),
    };
  }

   async RO_findAuth(userId: string) : Promise<AuthUserResDto> {
    const user = await this.prisma.user.findFirst({
      where: {id: userId},
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        player: {select: {id: true}}
      },
    });

    if(!user) throw new BadRequestException("utente non trovato");

    let {player, id, ...element} = user;
    return { ...element, sub: id, playerId: player?.id }
   }



  async RO_findList(search: usersListUseCaseProps) : Promise<UserSearchListResDto[]>{
    const whereCondition: Prisma.UserWhereInput = {
        deletedAt: null,
        NOT: {id: search.userSearchedId}
        
    };

    if (search.username && search.username.trim() !== "") {
      whereCondition.username = {
        startsWith: search.username.trim(),
        mode: 'insensitive',
      };
    }

    const users = await this.prisma.user.findMany({
      where: whereCondition,
      select: userListSelect,
      take: 5
    });

    return users.map(u => {
      let {player, ...element} = u
      return {
        ...element,
        playerId: player?.id || ""
      }
    })
  }
}