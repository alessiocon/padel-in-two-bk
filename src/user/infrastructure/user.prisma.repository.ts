import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { IUserRepository } from '../domain/user.repository.interface.js';
import { User, UserProps, UserRole } from '../domain/user.entity.js';
import {User as PrismaUser} from '@prisma/client';

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

  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string; username: string }): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username
      },
    });
    return this.toDomain(created);
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
      role: record.role as unknown as UserRole,
      isEmailVerified: record.isEmailVerified,
      deleteAt: record.deletedAt
    }
    return User.reconstitute(props);
  }
}