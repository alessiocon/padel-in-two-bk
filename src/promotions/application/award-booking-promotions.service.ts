import { Injectable } from '@nestjs/common';
import type { IPromotionAwardRepository } from '../domain/promotion-award.repository.js';
import { PromotionType } from '../domain/promotion-type.js';
import { PromotionPolicy } from '../domain/promotion.policy.js';

export type CompletedBookingPromotionInput = {
  bookingId: string;
  userId: string;
  promotions: readonly PromotionType[];
  completedAt: Date;
};

@Injectable()
export class AwardBookingPromotionsService {
  async execute(input: CompletedBookingPromotionInput, repository: IPromotionAwardRepository): Promise<void> {
    if (!input.promotions.includes(PromotionType.ACCUMULATE_POINTS)) return;

    const promotion = PromotionType.ACCUMULATE_POINTS;
    const account = await repository.getOrCreateAccount(input.userId, promotion, input.completedAt);
    const credited = account.creditPoints(PromotionPolicy.pointsForCompletedBooking(promotion), input.completedAt);
    await repository.saveCredit(input.bookingId, account, credited);
  }
}