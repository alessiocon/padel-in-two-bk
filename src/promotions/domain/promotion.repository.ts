import { PromotionAccount } from './promotion.account.aggregate.js';
import { PromotionType } from './promotion-type.js';
import { PromotionRedemption, PromotionRedemptionProps } from './entity/promotion.redemption.entity.js';

export type PromotionHistory = {
  accounts: PromotionAccount[];
  awards: { id: string; bookingId: string; promotion: PromotionType; points: number; createdAt: Date }[];
  redemptions: PromotionRedemptionProps[];
};

export const PROMOTION_REPOSITORY = Symbol('PROMOTION_REPOSITORY');

export interface IPromotionRepository {
  history(userId: string, limit: number): Promise<PromotionHistory>;
  quickHistory(userId: string): Promise<PromotionAccount[]>;
  redeem(redemption: PromotionRedemption): Promise<PromotionRedemptionProps>;
  setClubPromotions(clubId: string, promotions: PromotionType[], time: Date): Promise<PromotionType[]>;
}