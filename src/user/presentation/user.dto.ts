import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../domain/user.entity.js';

export class CreateUserDto {
  @ApiPropertyOptional({ example: "john.doe@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: "password123!" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: "John" })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: "Doe" })
  @IsString()
  lastName!: string;
}

export class UserResponseDto{
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  id!: string;

  @ApiProperty({ example: "john.doe@example.com" })
  email!: string;

  @ApiProperty({ example: "John" })
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  lastName!: string;

  @ApiProperty({ example: "User" })
  role!: UserRole;

  @ApiProperty({ example: "2023-01-01T00:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2023-01-01T00:00:00.000Z" })
  updatedAt!: Date;
}