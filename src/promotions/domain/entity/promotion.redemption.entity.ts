import { PromotionType } from '../promotion-type.js';

export type PromotionRedemptionProps = {
  id: string;
  userId: string;
  clubId: string | null;
  redeemedById: string;
  promotion: PromotionType;
  points: number;
  createdAt: Date;
};

export class PromotionRedemption {
  private constructor(private readonly props: PromotionRedemptionProps) {
    if (!props.id || !props.userId || !props.redeemedById ||
        !Number.isSafeInteger(props.points) || props.points <= 0) {
      throw new Error('Invalid promotion redemption');
    }
  }

  static create(props: PromotionRedemptionProps): PromotionRedemption {
    return new PromotionRedemption(props);
  }

  toPrimitives(): PromotionRedemptionProps { return { ...this.props }; }
}