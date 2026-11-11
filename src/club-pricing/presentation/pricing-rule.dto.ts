import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  PricingRulePriceMode,
  PricingRuleScope,
} from '../domain/pricing-rule.entity.js';

export class CreatePricingRuleDto {
  @ApiProperty({ maxLength: 120, example: 'Weekend evening' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: PricingRuleScope })
  @IsEnum(PricingRuleScope)
  scope!: PricingRuleScope;

  @ApiPropertyOptional({ type: [String], format: 'uuid', default: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  courtIds?: string[];

  @ApiPropertyOptional({ type: [Number], minimum: 1, maximum: 7, default: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekdays?: number[];

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-11-04T00:00:00Z' })
  @IsDateString()
  validFrom!: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiProperty({ enum: PricingRulePriceMode })
  @IsEnum(PricingRulePriceMode)
  priceMode!: PricingRulePriceMode;

  @ApiProperty({ minimum: 0, maximum: 999999.9999, example: 1.25 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999.9999)
  value!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePricingRuleDto extends PartialType(CreatePricingRuleDto) {}

export class PricingRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  clubId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PricingRuleScope })
  scope!: PricingRuleScope;

  @ApiProperty({ type: [String], format: 'uuid' })
  courtIds!: string[];

  @ApiProperty({ type: [Number] })
  weekdays!: number[];

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  validUntil!: Date | null;

  @ApiProperty({ enum: PricingRulePriceMode })
  priceMode!: PricingRulePriceMode;

  @ApiProperty()
  value!: number;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}