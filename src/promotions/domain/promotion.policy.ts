import { PromotionType } from './promotion-type.js';

export class PromotionPolicy {
  static pointsForCompletedBooking(promotion: PromotionType): number {
    switch (promotion) {
      case PromotionType.ACCUMULATE_POINTS: return 1;
      default: throw new Error('Unsupported promotion');
    }
  }

  static rewardCost(promotion: PromotionType): number {
    switch (promotion) {
      case PromotionType.ACCUMULATE_POINTS: return 10;
      default: throw new Error('Unsupported promotion');
    }
  }
}