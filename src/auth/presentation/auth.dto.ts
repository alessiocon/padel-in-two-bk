import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { inherits } from 'util';

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
  sub: string;
  playerId?: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  isEmailVerified: boolean;
}


export class resetPasswordReqDto{
    token: string;
    password: string;
}