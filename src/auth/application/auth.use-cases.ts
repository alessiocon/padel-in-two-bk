import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY, type IUserRepository } from '../../user/domain/user.repository.interface.js';
import { PasswordHasher } from '../../user/infrastructure/password.hasher.js';
import { JwtPayload } from '../domain/jwt-payload.interface.js';
import { AuthTokens } from './../domain/tokens.interface.js';
import { User } from '../../user/domain/user.entity.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { userForgotPasswordEvent, userRegisteredEvent } from '../../user/domain/user-events.js';
import { createTokenUseCase, findTokenUseCase } from '../../token/application/token-use-cases.js';
import { TokenType } from '../../token/domain/token.entity.js';
import { resetPasswordReqDto } from '../presentation/auth.dto.js';
import { updateUserUseCase } from '../../user/application/user.use-cases.js';
import { randomBytes } from 'crypto';


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
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(user: User): Promise<AuthTokens> {

    const userdb = await this.userRepo.findById(user.id);
    if (!userdb) {
      throw new BadRequestException('Utente non trovato');
    }

    if(!userdb.isEmailVerified){
      throw new UnauthorizedException(`Per effettuare l\'accesso  devi confermare la tua email:${userdb.id}`);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: user.toResponse ? user.toResponse() : {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
      },
    };
  }
}

export class emailConfirmation {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user: IUserRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(userId: string) : Promise<boolean> {
    const user = await this.user.findById(userId);
    if (!user) {
      throw new BadRequestException('Utente non trovato');
    }

    user.verifiedEmail(this.clock.now())
    this.user.update(user)
    return true;
  }
}

export class sendEmailConfirmation {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string) : Promise<boolean> {
    const user = await this.user.findById(userId);
    if (!user) {
      throw new BadRequestException('Utente non trovato');
    }

    this.eventEmitter.emit('user.registered',
            new userRegisteredEvent(
              user.email,
              user.firstName,
              user.lastName,
              user.id
            ),
          );

    return true;
  }
}

export class sendEmailForgotPassword {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly createTokenUseCase: createTokenUseCase
  ) {}

  async execute(email: string) : Promise<boolean> {
    const user = await this.user.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Utente non trovato');
    }

    let tokenValue = randomBytes(32).toString('hex');
    const token = await this.createTokenUseCase.execute({
      token: tokenValue,
      referenceId: user.id,
      type: TokenType.PASSWORD_RESET,
      expireInMinutes: 15,
    })

    if(!token){
      throw new BadRequestException('Il servizio non è al momento raggiungibile');
    }

    this.eventEmitter.emit('user.forgotPassword',
      new userForgotPasswordEvent(
        user.email,
        tokenValue
      ),
    );

    return true;
  }
}

export class resetPassword {
  constructor(
    @Inject(USER_REPOSITORY) private readonly user: IUserRepository,
    @Inject(CLOCK_SERVICE)   private readonly clock: IClockService,
    private readonly findTokenUseCase: findTokenUseCase,
    private readonly updateUserUserCase: updateUserUseCase,

  ) {}

  async execute(input: resetPasswordReqDto) : Promise<boolean> {

    const token = await this.findTokenUseCase.execute(input.token);
    const user = await this.user.findById(token.referenceId);
    if (!user) {
      throw new BadRequestException('Utente non trovato');
    }

    let passwordHash = await PasswordHasher.hash(input.password);
    let now = this.clock.now();
    user.changePassword(passwordHash, now)
    
    this.updateUserUserCase.execute(user);
    return true;
  }
}

// ==========================================
// EXPORT ARRAY PER NESTJS MODULE
// ==========================================
export const AUTH_USE_CASES = [
  ValidateUserUseCase,
  LoginUseCase,
  emailConfirmation,
  sendEmailConfirmation,
  sendEmailForgotPassword,
  resetPassword
];