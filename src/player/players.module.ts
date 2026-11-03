import { Module } from '@nestjs/common';
import { PrismaPlayerRepository } from './infrastructure/prisma.player.repository.js';
import { PLAYER_IREPOSITORY } from './infrastructure/player-IRepository.js';

@Module({
  // controllers: [PlayersController],
  providers: [
    PrismaPlayerRepository,
    { provide: PLAYER_IREPOSITORY, useExisting: PrismaPlayerRepository },
  ],
  exports: [PrismaPlayerRepository],
})
export class PlayersModule {}