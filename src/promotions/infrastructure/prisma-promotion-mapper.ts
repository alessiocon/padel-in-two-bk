import { PromotionAccount as PrismaAccount, PromotionType as PrismaPromotionType } from '@prisma/client';
import { PromotionAccount } from '../domain/promotion.account.aggregate.js';
import { PromotionType } from '../domain/promotion-type.js';

export class PrismaPromotionMapper {
  static toPromotion(value: PrismaPromotionType): PromotionType {
    return PromotionType[value];
  }

  static toAccount(record: PrismaAccount): PromotionAccount {
    return PromotionAccount.reconstitute({
      ...record,
      promotion: this.toPromotion(record.promotion),
    });
  }
}