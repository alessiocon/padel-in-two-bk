import { PromotionHistory } from '../domain/promotion.repository.js';
import { PromotionRedemptionProps } from '../domain/entity/promotion.redemption.entity.js';
import { PromotionAccountResDto, PromotionHistoryResDto, PromotionRedemptionResDto } from './promotion.dto.js';
import { PromotionAccount } from '../domain/promotion.account.aggregate.js';

export class PromotionResponseMapper {
  static redemption(props: PromotionRedemptionProps): PromotionRedemptionResDto {
    return { ...props, createdAt: props.createdAt.toISOString() };
  }

  static history(history: PromotionHistory): PromotionHistoryResDto {
    return {
      accounts: history.accounts.map(account => {
        const props = account.toPrimitives();
        return {
          promotion: props.promotion, 
          totalPoints: props.totalPoints,
          availablePoints: props.availablePoints, 
          redeemedPoints: props.redeemedPoints,
        };
      }),
      awards: history.awards.map(award => ({ ...award, createdAt: award.createdAt.toISOString() })),
      redemptions: history.redemptions.map(PromotionResponseMapper.redemption),
    };
  }

  static domainToDto(accounts: PromotionAccount[]): PromotionAccountResDto[] {
    return accounts.map(account => {
      const props = account.toPrimitives();
      return {
        promotion: props.promotion, 
        totalPoints: props.totalPoints,
        availablePoints: props.availablePoints, 
        redeemedPoints: props.redeemedPoints,
      };
    });
  }
}