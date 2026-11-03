import { IsEmail, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClubRole } from '../../clubs/domain/entity/club.member.entity.js';

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

  @ApiProperty({ example: "+393278457548", required: true })
  @IsPhoneNumber('IT', { message: "Il numero di telefono non è valido" })
  phone: string;
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
}


export class UserSearchListDto{
  @ApiProperty({ type: String, example: "Mario" })
  @IsString()
  @MaxLength(50)
  username?: string;
}

export class UserSearchListResDto
{
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
}

export interface ClubPermissionDto {
  clubId: string;
  role: ClubRole;
  permissions: string[];
}

export interface UserPermissionsResponseDto {
  userId: string;
  playerId: string | null; // ID del player se esiste
  memberships: ClubPermissionDto[];
}