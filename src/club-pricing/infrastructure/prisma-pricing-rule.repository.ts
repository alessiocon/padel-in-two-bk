import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { IClubPricingRuleRepository } from './pricing-rule.repository.js';
import { PricingRule } from '../domain/pricing-rule.entity.js';
import {
  pricingRuleWithCourtLinks,
  PrismaPricingRuleMapper,
} from './prisma-pricing-rule-mapper.js';

@Injectable()
export class PrismaPricingRuleRepository implements IClubPricingRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(rule: PricingRule): Promise<PricingRule> {
    const data = PrismaPricingRuleMapper.toPersistence(rule);
    const updateData: Prisma.ClubPricingRuleUncheckedUpdateInput = {
      name: data.name,
      scope: data.scope,
      weekdays: data.weekdays,
      startTime: data.startTime,
      endTime: data.endTime,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      priceMode: data.priceMode,
      value: data.value,
      priority: data.priority,
      isActive: data.isActive,
      updatedAt: data.updatedAt,
    };

    const record = await this.prisma.$transaction(async transaction => {
      await transaction.clubPricingRule.upsert({
        where: {
          id_clubId: { id: rule.id, clubId: rule.clubId },
        },
        create: data,
        update: updateData,
      });

      await transaction.clubPricingRuleCourt.deleteMany({
        where: { pricingRuleId: rule.id, clubId: rule.clubId },
      });

      if (rule.courtIds.length > 0) {
        await transaction.clubPricingRuleCourt.createMany({
          data: rule.courtIds.map(courtId => ({
            pricingRuleId: rule.id,
            courtId,
            clubId: rule.clubId,
          })),
        });
      }

      return transaction.clubPricingRule.findUniqueOrThrow({
        where: {
          id_clubId: { id: rule.id, clubId: rule.clubId },
        },
        include: {
          courtLinks: {
            select: { courtId: true },
          },
        },
      });
    });

    return PrismaPricingRuleMapper.toDomain(record);
  }

  async getAll(clubId: string): Promise<PricingRule[]> {
    const records = await this.prisma.clubPricingRule.findMany({
      where: { clubId },
      ...pricingRuleWithCourtLinks,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return records.map(record => PrismaPricingRuleMapper.toDomain(record));
  }

  async findById(id: string, clubId: string): Promise<PricingRule | null> {
    const record = await this.prisma.clubPricingRule.findUnique({
      where: { id_clubId: { id, clubId } },
      ...pricingRuleWithCourtLinks,
    });

    return record ? PrismaPricingRuleMapper.toDomain(record) : null;
  }

  async delete(id: string, clubId: string): Promise<boolean> {
    const result = await this.prisma.clubPricingRule.deleteMany({
      where: { id, clubId },
    });

    return result.count > 0;
  }
}