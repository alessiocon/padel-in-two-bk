import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ClubStatus} from "./../domain/club.js"

export class CreateClubDto {
  @ApiProperty({ example: 'Padel Milano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'info@padelmilano.it' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  ownerId!: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  courtCount: number = 1;
  
  @ApiPropertyOptional({type: String, example: "Europe/Rome", default: "Europe/Rome" })
  @IsOptional()
  timezone: string

  @ApiPropertyOptional({ example: 90, default: 90 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  slotDurationMinutes: number = 90;

  @ApiPropertyOptional({ example: '08:00', default: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openingTime must be in HH:mm format',
  })
  openingTime: string = '08:00';

  @ApiPropertyOptional({ example: '23:00', default: '23:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closingTime must be in HH:mm format',
  })
  closingTime: string = '23:00';
}

export class UpdateClubDto {
  @ApiPropertyOptional({ example: 'Padel Milano Centro' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'info@padelmilano.it' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: ClubStatus, example: ClubStatus.ACTIVE })  
  @IsOptional()
  @IsIn([...Object.values(ClubStatus)])
  status?: ClubStatus;
}

export class ClubResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ClubStatus, example: ClubStatus.ACTIVE })  
  status!: ClubStatus;

  @ApiProperty({ type: Number, example: 90 })
  slotDurationMinutes: number = 90;

  @ApiProperty({ type: String, example: '08:00' })
  openingTime: string = '08:00';

  @ApiProperty({ type: String, example: '23:00' })
  closingTime: string = '23:00';

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ example: 4 })
  courtCount!: number;
}