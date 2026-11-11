import { Module } from '@nestjs/common';
import { PROMOTION_REPOSITORY } from '../domain/promotion.repository.js';
import { PrismaPromotionRepository } from './prisma-promotion.repository.js';

@Module({
  providers: [
    PrismaPromotionRepository,
    { provide: PROMOTION_REPOSITORY, useExisting: PrismaPromotionRepository },
  ],
  exports: [PROMOTION_REPOSITORY, PrismaPromotionRepository],
})
export class PromotionsPersistenceModule {}