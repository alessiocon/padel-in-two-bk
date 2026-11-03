import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller.js';
import { USER_IREPOSITORY } from './infrastructure/user.repository.interface.js';
import { UserPrismaRepository } from './infrastructure/prisma.user.repository.js';
import { USER_USE_CASES } from './application/user.use-cases.js';
import { userForgotPasswordEvent, userRegisteredEvent } from './domain/user-events.js';
import { PrismaPlayerRepository } from '../player/infrastructure/prisma.player.repository.js';
import { PLAYER_IREPOSITORY } from '../player/infrastructure/player-IRepository.js';

@Module({
  controllers: [UserController],
  providers: [
    ...USER_USE_CASES,
    PrismaPlayerRepository,
    { provide: USER_IREPOSITORY, useClass: UserPrismaRepository},
    { provide: PLAYER_IREPOSITORY, useClass: PrismaPlayerRepository},
    userRegisteredEvent,
    userForgotPasswordEvent
  ],
  exports: [...USER_USE_CASES, USER_IREPOSITORY, userRegisteredEvent, userForgotPasswordEvent], // Esportato per permettere al modulo Auth di validare le credenziali al Login
})
export class UserModule {}