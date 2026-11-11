import { DateTime } from 'luxon';
import { Money } from './money.value-object.js';

export enum PricingRulePriceMode {
  MULTIPLIER = 'MULTIPLIER',
  FIXED_SLOT_PRICE = 'FIXED_SLOT_PRICE',
}

export enum PricingRuleScope {
  ALL_COURTS = 'ALL_COURTS',
  SELECTED_COURTS = 'SELECTED_COURTS',
}

export type PricingRuleProps = {
  id: string;
  clubId: string;
  name: string;
  scope: PricingRuleScope;
  courtIds: string[];
  weekdays: number[];
  startTime: string;
  endTime: string;
  validFrom: Date;
  validUntil: Date | null;
  priceMode: PricingRulePriceMode;
  value: number;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};


export type PricingRuleUpdateTerms = Omit<PricingRuleProps, 'clubId' | 'createdAt'>;

export class PricingRule {
  private constructor(private props: Omit<PricingRuleProps , "Id"| "updateAt">) {
    PricingRule.validate(props);
  }

  static create(
    input: Omit<PricingRuleProps , "id"| "updatedAt">,
    id = crypto.randomUUID(),
  ): PricingRule {
    const terms = PricingRule.normalizeTerms({...input, id, updatedAt: input.createdAt });
    return new PricingRule({
      ...terms,
      id,
      createdAt: terms.createdAt,
      updatedAt: terms.createdAt,
    });
  }

  static reconstitute(props: PricingRuleProps): PricingRule {
    return new PricingRule({
      ...PricingRule.normalizeTerms(props),
      id: props.id,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }

  get id(): string { return this.props.id; }
  get clubId(): string { return this.props.clubId; }
  get name(): string { return this.props.name; }
  get scope(): PricingRuleScope { return this.props.scope; }
  get courtIds(): string[] { return [...this.props.courtIds]; }
  get weekdays(): number[] { return [...this.props.weekdays]; }
  get startTime(): string { return this.props.startTime; }
  get endTime(): string { return this.props.endTime; }
  get validFrom(): Date { return new Date(this.props.validFrom); }
  get validUntil(): Date | null {
    return this.props.validUntil ? new Date(this.props.validUntil) : null;
  }
  get priceMode(): PricingRulePriceMode { return this.props.priceMode; }
  get value(): number { return this.props.value; }
  get priority(): number { return this.props.priority; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }

  appliesToSlot(input: { courtId: string; startsAt: Date; timezone: string }): boolean {
    if (!this.props.isActive) return false;
    if (this.props.scope === PricingRuleScope.SELECTED_COURTS && !this.props.courtIds.includes(input.courtId)) {
      return false;
    }

    const localStart = DateTime.fromJSDate(input.startsAt).setZone(input.timezone);
    if (!localStart.isValid) {
      throw new Error(`Invalid pricing timezone: ${input.timezone}`);
    }

    const localDate = localStart.toISODate();
    const validFrom = DateTime.fromJSDate(this.props.validFrom, { zone: 'utc' }).toISODate();
    const validUntil = this.props.validUntil
      ? DateTime.fromJSDate(this.props.validUntil, { zone: 'utc' }).toISODate()
      : null;

    if (!localDate || !validFrom || localDate < validFrom || (validUntil && localDate > validUntil)) {
      return false;
    }
    if (this.props.weekdays.length > 0 && !this.props.weekdays.includes(localStart.weekday)) {
      return false;
    }

    const localTime = localStart.toFormat('HH:mm');
    return localTime >= this.props.startTime && localTime < this.props.endTime;
  }

  calculateSlotPrice(basePrice: number): Money {
    return this.props.priceMode === PricingRulePriceMode.MULTIPLIER
      ? Money.fromDecimal(basePrice).multiplyBy(this.props.value)
      : Money.fromDecimal(this.props.value);
  }

  update(terms: PricingRuleUpdateTerms): void {
    const normalizedTerms = PricingRule.normalizeTerms({ ...terms, clubId: this.props.clubId, createdAt: this.createdAt });
    const updatedProps = { ...this.props, ...normalizedTerms, updatedAt: new Date() };
    PricingRule.validate(updatedProps);
    this.props = updatedProps;
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  toPrimitives(): PricingRuleProps {
    return {
      ...this.props,
      courtIds: [...this.props.courtIds],
      weekdays: [...this.props.weekdays],
      validFrom: new Date(this.props.validFrom),
      validUntil: this.props.validUntil ? new Date(this.props.validUntil) : null,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  private static normalizeTerms(terms: PricingRuleProps): PricingRuleProps {
    return {
      ...terms,
      name: terms.name.trim(),
      courtIds: [...terms.courtIds],
      weekdays: [...terms.weekdays],
      validFrom: new Date(terms.validFrom),
      validUntil: terms.validUntil ? new Date(terms.validUntil) : null,
    };
  }

  private static validate(props: PricingRuleProps): void {
    if (!props.id || !props.clubId) {
      throw new Error('Pricing rule and club IDs are required');
    }
    if (!props.name || props.name.length > 120) {
      throw new Error('Pricing rule name must contain between 1 and 120 characters');
    }
    if (!Object.values(PricingRuleScope).includes(props.scope)) {
      throw new Error('Invalid pricing rule scope');
    }
    if (!Object.values(PricingRulePriceMode).includes(props.priceMode)) {
      throw new Error('Invalid pricing rule price mode');
    }
    if (new Set(props.courtIds).size !== props.courtIds.length) {
      throw new Error('Pricing rule court IDs must be unique');
    }
    if (props.scope === PricingRuleScope.ALL_COURTS && props.courtIds.length > 0) {
      throw new Error('A rule for all courts cannot have assigned court IDs');
    }
    if (props.scope === PricingRuleScope.SELECTED_COURTS && props.courtIds.length === 0) {
      throw new Error('A rule for selected courts must have at least one court ID');
    }
    if (props.weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7)) {
      throw new Error('Weekdays must be integers from 1 (Monday) to 7 (Sunday)');
    }
    if (new Set(props.weekdays).size !== props.weekdays.length) {
      throw new Error('Weekdays must be unique');
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(props.startTime) || !timeRegex.test(props.endTime)) {
      throw new Error('Pricing rule times must use HH:mm format');
    }
    if (props.startTime >= props.endTime) {
      throw new Error('Pricing rule end time must be after its start time');
    }
    if (Number.isNaN(props.validFrom.getTime()) || Number.isNaN(props.createdAt.getTime()) || Number.isNaN(props.updatedAt.getTime())) {
      throw new Error('Pricing rule dates must be valid');
    }
    if (props.validUntil && Number.isNaN(props.validUntil.getTime())) {
      throw new Error('Pricing rule end date must be valid');
    }
    if (props.validUntil && props.validUntil < props.validFrom) {
      throw new Error('Pricing rule end date cannot be before its start date');
    }
    if (!Number.isFinite(props.value) || props.value < 0) {
      throw new Error('Pricing rule value must be a non-negative number');
    }
    if (!Number.isInteger(props.priority)) {
      throw new Error('Pricing rule priority must be an integer');
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}