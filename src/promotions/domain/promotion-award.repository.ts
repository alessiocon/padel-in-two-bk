import type { PromotionAccount } from './promotion.account.aggregate.js';
import type { PromotionType } from './promotion-type.js';

export interface IPromotionAwardRepository {
  getOrCreateAccount(userId: string, promotion: PromotionType, time: Date): Promise<PromotionAccount>;
  saveCredit(bookingId: string, previous: PromotionAccount, credited: PromotionAccount): Promise<void>;
}