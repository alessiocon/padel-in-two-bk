import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { UserRole } from './../../user/domain/user.entity.js';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthUserResDto{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
}