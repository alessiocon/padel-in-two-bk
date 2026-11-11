const MICRO_UNITS_PER_UNIT = 1_000_000n;
const MICRO_UNITS_PER_CENT = 10_000n;
const MULTIPLIER_SCALE = 10_000n;

export class Money {
  private constructor(private readonly microUnits: bigint) {}

  static zero(): Money {
    return new Money(0n);
  }

  static fromDecimal(value: number): Money {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Money value must be finite and non-negative');
    }

    const [whole, fraction = ''] = value.toFixed(6).split('.');
    return new Money(
      BigInt(whole) * MICRO_UNITS_PER_UNIT + BigInt(fraction.padEnd(6, '0')),
    );
  }

  plus(other: Money): Money {
    return new Money(this.microUnits + other.microUnits);
  }

  multiplyBy(value: number): Money {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Money multiplier must be finite and non-negative');
    }

    const [whole, fraction = ''] = value.toFixed(4).split('.');
    const multiplier = BigInt(whole) * MULTIPLIER_SCALE + BigInt(fraction);
    return new Money((this.microUnits * multiplier) / MULTIPLIER_SCALE);
  }

  toNumberRoundedToCents(): number {
    const cents = (this.microUnits + MICRO_UNITS_PER_CENT / 2n) / MICRO_UNITS_PER_CENT;
    return Number(cents) / 100;
  }
}