import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../domain/user.entity.js';

export class CreateUserDto {
  @ApiProperty({ example: "john.doe@example.com", required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "password123!", required: true })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: "John", required: true })
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  firstName: string;

  @ApiProperty({ example: "Doe", required: true })
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  lastName: string;

  @ApiProperty({ example: "padJhon", required: true })
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  username: string;
}

export class UserResponseDto{
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  id: string;

  @ApiProperty({ example: "john.doe@example.com" })
  email: string;

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "padJhon"})
  username: string;

  @ApiProperty({ example: "User" })
  role: UserRole;
}