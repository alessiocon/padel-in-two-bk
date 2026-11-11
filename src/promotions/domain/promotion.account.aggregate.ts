import { PromotionType } from './promotion-type.js';

export type PromotionAccountProps = {
  id: string;
  userId: string;
  promotion: PromotionType;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  createdAt: Date;
  updatedAt: Date;
};

export class PromotionAccount {
  private constructor(private readonly props: PromotionAccountProps) {
    const balances = [props.totalPoints, props.availablePoints, props.redeemedPoints];
    if (balances.some(points => !Number.isSafeInteger(points) || points < 0) ||
        props.totalPoints !== props.availablePoints + props.redeemedPoints) {
      throw new Error('Invalid promotion account balance');
    }
  }

  static create(userId: string, promotion: PromotionType, time: Date): PromotionAccount {
    return new PromotionAccount({
      id: crypto.randomUUID(), userId, promotion,
      totalPoints: 0, availablePoints: 0, redeemedPoints: 0,
      createdAt: time, updatedAt: time,
    });
  }

  static reconstitute(props: PromotionAccountProps): PromotionAccount {
    return new PromotionAccount(props);
  }

  creditPoints(points: number, time: Date): PromotionAccount {
    if (!Number.isSafeInteger(points) || points <= 0) {
      throw new Error('Promotion credit must be a positive integer');
    }
    return new PromotionAccount({
      ...this.props,
      totalPoints: this.props.totalPoints + points,
      availablePoints: this.props.availablePoints + points,
      updatedAt: time,
    });
  }

  redeem(points: number, time: Date): PromotionAccount {
    if (!Number.isSafeInteger(points) || points <= 0 || this.props.availablePoints < points) {
      throw new Error('Insufficient promotion points');
    }
    return new PromotionAccount({
      ...this.props,
      availablePoints: this.props.availablePoints - points,
      redeemedPoints: this.props.redeemedPoints + points,
      updatedAt: time,
    });
  }

  toPrimitives(): PromotionAccountProps {
    return { ...this.props };
  }
}