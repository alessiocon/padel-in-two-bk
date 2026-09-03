import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  endsAt!: string;
}

export class CalendarAvailabilityResponseDto {
  @ApiProperty()
  isBookable!: boolean;

  @ApiProperty()
  availableCourtCount!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  availableCourtIds!: string[];

  @ApiProperty({ enum: ['open', 'closed', 'partially_available'] })
  status!: 'open' | 'closed' | 'partially_available';
}
