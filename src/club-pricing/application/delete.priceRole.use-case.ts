import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ICLUB_PRICING_RULE_REPOSITORY, type IClubPricingRuleRepository } from "../infrastructure/pricing-rule.repository.js";

@Injectable()
export class DeletePricingRuleUseCase {
  constructor(
    @Inject(ICLUB_PRICING_RULE_REPOSITORY)
    private readonly repository: IClubPricingRuleRepository,
  ) {}

  async execute(id: string, clubId: string): Promise<void> {
    if (!(await this.repository.delete(id, clubId))) {
      throw new NotFoundException('Pricing rule not found');
    }
  }
}