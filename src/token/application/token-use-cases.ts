import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException} from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { Token, TokenType } from '../domain/token.entity.js';
import { type ITokenRepository, TOKEN_REPOSITORY } from '../domain/token.IRepository.js';
import { createHash } from 'crypto';



export type createTokenInput = {
  token: string;
  type: TokenType;
  referenceId: string;
  expireInMinutes: number;
}

@Injectable()
export class createTokenUseCase {
  constructor(
    @Inject(CLOCK_SERVICE)   private readonly clock: IClockService,
    @Inject(TOKEN_REPOSITORY) private readonly tokenRepo: ITokenRepository
  ) {}

  async execute(command: createTokenInput): Promise<Token> {

    //Evita token doppi
    await this.tokenRepo.deleteByReferenceAndType(command.referenceId, command.type);

    let {expireInMinutes, token,...props} = command
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + expireInMinutes * 60 * 1000);

    let tokenHash = createHash('sha256').update(command.token).digest('hex')
    return await this.tokenRepo.save(Token.create({
      ...props,
      expiresAt,
      createdAt: now,
      tokenHash
    }))
  }
}

@Injectable()
export class findTokenUseCase {
  constructor(
    @Inject(CLOCK_SERVICE)   private readonly clock: IClockService,
    @Inject(TOKEN_REPOSITORY) private readonly tokenRepo: ITokenRepository
  ) {}

  async execute(tokenValue: string): Promise<Token> {

    let tokenHash = createHash('sha256').update(tokenValue).digest('hex');
    let token = await this.tokenRepo.findAndDeleteByTokenHash(tokenHash);

    if(!token){
      throw new BadRequestException('Codice validazione non trovato o scaduto');
    }

    if(this.clock.now() > token.expiresAt){
      throw new BadRequestException('Codice validazione scaduto');
    }

    return token;
  }
}

export const TOKEN_USE_CASES = [
  createTokenUseCase,
  findTokenUseCase
];

