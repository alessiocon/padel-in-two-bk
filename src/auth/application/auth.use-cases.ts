import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY, type IUserRepository } from '../../user/domain/user.repository.interface.js';
import { PasswordHasher } from '../../user/infrastructure/password.hasher.js';
import { LoginDto } from '../presentation/auth.dto.js';
import { JwtPayload } from '../domain/jwt-payload.interface.js';
import { AuthTokens } from './../domain/tokens.interface.js';


@Injectable()
export class ValidateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user: IUserRepository,
  ) {}

  async execute(email: string, pass: string) {
    const user = await this.user.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const isPasswordValid = await PasswordHasher.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    return user;
  }
}

// ==========================================
// 2. LOGIN USE CASE (Generazione JWT)
// ==========================================
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async execute(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: user.toResponse ? user.toResponse() : {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}

// ==========================================
// EXPORT ARRAY PER NESTJS MODULE
// ==========================================
export const AUTH_USE_CASES = [
  ValidateUserUseCase,
  LoginUseCase,
];