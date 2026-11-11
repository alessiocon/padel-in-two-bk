import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ICLUB_PRICING_RULE_REPOSITORY, type IClubPricingRuleRepository } from "../infrastructure/pricing-rule.repository.js";
import { PricingRule, PricingRuleUpdateTerms } from "../domain/pricing-rule.entity.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";


export type UpdatePricingRuleCommand = {
  id: string;
  clubId: string;
  changes: Partial<PricingRuleUpdateTerms>;
};


@Injectable()
export class UpdatePricingRuleUseCase {
  constructor(
    @Inject(ICLUB_PRICING_RULE_REPOSITORY) private readonly repository: IClubPricingRuleRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(command: UpdatePricingRuleCommand): Promise<PricingRule> {
    let now = this.clock.now();
    if (!Object.values(command.changes).some(value => value !== undefined)) {
      throw new BadRequestException('At least one pricing rule field must be provided');
    }

    const rule = await this.repository.findById(command.id, command.clubId);
    if (!rule) {
      throw new NotFoundException('Pricing rule not found');
    }

    rule.update({
      id: command.id,
      name: command.changes.name ?? rule.name,
      scope: command.changes.scope ?? rule.scope,
      courtIds: command.changes.courtIds ?? rule.courtIds,
      weekdays: command.changes.weekdays ?? rule.weekdays,
      startTime: command.changes.startTime ?? rule.startTime,
      endTime: command.changes.endTime ?? rule.endTime,
      validFrom: command.changes.validFrom ?? rule.validFrom,
      validUntil: command.changes.validUntil === undefined ? rule.validUntil : command.changes.validUntil,
      priceMode: command.changes.priceMode ?? rule.priceMode,
      value: command.changes.value ?? rule.value,
      priority: command.changes.priority ?? rule.priority,
      isActive: command.changes.isActive ?? rule.isActive,
      updatedAt: now,
    });

    return this.repository.upsert(rule);
  }
}
