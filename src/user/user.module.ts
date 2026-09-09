import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller.js';
import { USER_REPOSITORY } from './domain/user.repository.interface.js';
import { UserPrismaRepository } from './infrastructure/user.prisma.repository.js';
import { USER_USE_CASES } from './application/user.use-cases.js';

@Module({
  controllers: [UserController],
  providers: [
    ...USER_USE_CASES,
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository},
  ],
  exports: [...USER_USE_CASES, USER_REPOSITORY], // Esportato per permettere al modulo Auth di validare le credenziali al Login
})
export class UserModule {}