import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PrismaTokenRepository } from './infrastructure/prisma-token.repository.js';
import { TOKEN_REPOSITORY } from './domain/token.IRepository.js'; // opzionale o definito inline
import { TOKEN_USE_CASES } from './application/token-use-cases.js';

@Module({
  imports: [],
  controllers: [],
  providers: [
    PrismaService,
    PrismaTokenRepository,
    {
      provide: TOKEN_REPOSITORY,
      useExisting: PrismaTokenRepository,
    },
    ...TOKEN_USE_CASES
  ],
  exports: [
    ...TOKEN_USE_CASES,
    TOKEN_REPOSITORY,
    PrismaTokenRepository,
  ],
})
export class TokenModule {}