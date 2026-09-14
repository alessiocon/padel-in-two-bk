import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { ClubStatus} from "./../domain/club.js"
import { Decimal } from '@prisma/client/runtime/client';

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

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  courtInDoor: number = 1;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 0, maximum: 10})
  @IsOptional()
  @IsInt()
  @IsPositive()
  courtOutDoor: number = 1;

  @ApiProperty({ example: 'Via dei mille, 22, Napoli' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  position: string;
  
  @ApiPropertyOptional({type: String, example: "Europe/Rome", default: "Europe/Rome" })
  @IsOptional()
  timezone: string

  @ApiPropertyOptional({ example: 43.20, default: 0, minimum: 0, maximum: 999})
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'il costo del campo deve essere un numero valido con massimo 2 cifre decimali' })
  @Min(0)
  @Max(999)
  slotPrice: number;

  @ApiPropertyOptional({ example: 2, default: 0, minimum: 0, maximum: 99})
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'il costo della pala deve essere un numero valido con massimo 2 cifre decimali' })
  @Min(0)
  @Max(99)
  racketPrice: number

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