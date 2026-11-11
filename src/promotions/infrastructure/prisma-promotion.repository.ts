import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { IPromotionRepository, PromotionHistory } from '../domain/promotion.repository.js';
import { PromotionType } from '../domain/promotion-type.js';
import type { IPromotionAwardRepository } from '../domain/promotion-award.repository.js';
import { PromotionAccount } from '../domain/promotion.account.aggregate.js';
import { PromotionRedemption, PromotionRedemptionProps } from '../domain/entity/promotion.redemption.entity.js';
import { PrismaPromotionMapper } from './prisma-promotion-mapper.js';

@Injectable()
export class PrismaPromotionRepository implements IPromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  forAwards(transaction: Prisma.TransactionClient): IPromotionAwardRepository {
    return {
      getOrCreateAccount: async (userId, promotion, time) => {
        const record = await transaction.promotionAccount.upsert({
          where: { userId_promotion: { userId, promotion } },
          create: PromotionAccount.create(userId, promotion, time).toPrimitives(),
          update: {},
        });
        return PrismaPromotionMapper.toAccount(record);
      },
      saveCredit: async (bookingId, previous, credited) => {
        const props = credited.toPrimitives();
        const points = props.totalPoints - previous.toPrimitives().totalPoints;
        const inserted = await transaction.promotionAward.createMany({
          data: {
            accountId: props.id, bookingId, promotion: props.promotion,
            points, createdAt: props.updatedAt,
          },
          skipDuplicates: true,
        });
        if (inserted.count === 1) {
          await transaction.promotionAccount.update({
            where: { id: props.id },
            data: {
              totalPoints: { increment: points },
              availablePoints: { increment: points },
              updatedAt: props.updatedAt,
            },
          });
        }
      },
    };
  }

  async history(userId: string, limit: number): Promise<PromotionHistory> {
    const [accounts, awards, redemptions] = await this.prisma.$transaction([
      this.prisma.promotionAccount.findMany({ where: { userId }, orderBy: { promotion: 'asc' } }),
      this.prisma.promotionAward.findMany({
        where: { account: { userId } }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: limit,
      }),
      this.prisma.promotionRedemption.findMany({
        where: { account: { userId } }, include: { account: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: limit,
      }),
    ]);
    return {
      accounts: accounts.map(record => PrismaPromotionMapper.toAccount(record)),
      awards: awards.map(record => ({
        id: record.id, bookingId: record.bookingId, points: record.points,
        promotion: PrismaPromotionMapper.toPromotion(record.promotion), createdAt: record.createdAt,
      })),
      redemptions: redemptions.map(record => ({
        id: record.id, userId, clubId: record.clubId, redeemedById: record.redeemedById,
        promotion: PrismaPromotionMapper.toPromotion(record.account.promotion),
        points: record.points, createdAt: record.createdAt,
      })),
    };
  }

  async quickHistory(userId: string): Promise<PromotionAccount[]> {
    const accounts = await this.prisma.promotionAccount.findMany({ where: { userId }, orderBy: { promotion: 'asc' } });
    return accounts.map(record => PrismaPromotionMapper.toAccount(record));
  }

  async redeem(redemption: PromotionRedemption): Promise<PromotionRedemptionProps> {
    const props = redemption.toPrimitives();
    try {
      return await this.prisma.$transaction(async transaction => {
        const existing = await transaction.promotionRedemption.findUnique({
          where: { id: props.id }, include: { account: true },
        });
        if (existing) return this.assertSameRedemption(existing, props);

        const record = await transaction.promotionAccount.findUnique({
          where: { userId_promotion: { userId: props.userId, promotion: props.promotion } },
        });
        if (!record) throw new BadRequestException('Insufficient promotion points');
        try {
          PrismaPromotionMapper.toAccount(record).redeem(props.points, props.createdAt);
        } catch {
          throw new BadRequestException('Insufficient promotion points');
        }
        const changed = await transaction.promotionAccount.updateMany({
          where: { id: record.id, availablePoints: { gte: props.points } },
          data: {
            availablePoints: { decrement: props.points },
            redeemedPoints: { increment: props.points },
            updatedAt: props.createdAt,
          },
        });
        if (changed.count !== 1) throw new BadRequestException('Insufficient promotion points');
        await transaction.promotionRedemption.create({
          data: {
            id: props.id, accountId: record.id, clubId: props.clubId ?? undefined,
            redeemedById: props.redeemedById, points: props.points, createdAt: props.createdAt,
          },
        });
        return props;
      });
    } catch (error) {
      const existing = await this.prisma.promotionRedemption.findUnique({
        where: { id: props.id }, include: { account: true },
      });
      if (existing) return this.assertSameRedemption(existing, props);
      throw error;
    }
  }

  private assertSameRedemption(
    record: Prisma.PromotionRedemptionGetPayload<{ include: { account: true } }>,
    props: PromotionRedemptionProps,
  ): PromotionRedemptionProps {
    if (record.account.userId !== props.userId || record.account.promotion !== props.promotion ||
        record.clubId !== props.clubId || record.redeemedById !== props.redeemedById || record.points !== props.points) {
      throw new ConflictException('Redemption request ID is already in use');
    }
    return { ...props, createdAt: record.createdAt };
  }

  async setClubPromotions(clubId: string, promotions: PromotionType[], time: Date): Promise<PromotionType[]> {
    const record = await this.prisma.club.update({
      where: { id: clubId }, data: { promotions, updatedAt: time }, select: { promotions: true },
    });
    return record.promotions.map(PrismaPromotionMapper.toPromotion);
  }
}