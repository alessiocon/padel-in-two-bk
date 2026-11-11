import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module.js';
import { PromotionsPersistenceModule } from './infrastructure/promotions-persistence.module.js';
import { GetPromotionHistoryUseCase, RedeemPromotionUseCase, SetClubPromotionsUseCase, GetPromotionQuickHistoryUseCase } from './application/promotion.use-cases.js';
import { PromotionsController } from './presentation/promotions.controller.js';
import { AwardBookingPromotionsService } from './application/award-booking-promotions.service.js';

@Module({
  imports: [ClubsModule, PromotionsPersistenceModule],
  controllers: [PromotionsController],
  providers: [
    AwardBookingPromotionsService,
    GetPromotionHistoryUseCase, RedeemPromotionUseCase, SetClubPromotionsUseCase, 
    GetPromotionQuickHistoryUseCase
  ],
  exports: [AwardBookingPromotionsService, PromotionsPersistenceModule],
})
export class PromotionsModule {}