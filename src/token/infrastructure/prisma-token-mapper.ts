import {
  Prisma,
  TokenType as PrismaTokenType,
} from '@prisma/client';
import { Token, TokenType, type TokenProps } from './../domain/token.entity.js';

export class TokenMapper {
  public static readonly PRISMA_TO_DOMAIN_TOKEN_TYPE: Record<PrismaTokenType, TokenType> = {
    [PrismaTokenType.EMAIL_VERIFICATION]: TokenType.EMAIL_VERIFICATION,
    [PrismaTokenType.PASSWORD_RESET]: TokenType.PASSWORD_RESET,
    [PrismaTokenType.CLUB_INVITATION]: TokenType.CLUB_INVITATION,
  };

  public static readonly DOMAIN_TO_PRISMA_TOKEN_TYPE: Record<TokenType, PrismaTokenType> = {
    [TokenType.EMAIL_VERIFICATION]: PrismaTokenType.EMAIL_VERIFICATION,
    [TokenType.PASSWORD_RESET]: PrismaTokenType.PASSWORD_RESET,
    [TokenType.CLUB_INVITATION]: PrismaTokenType.CLUB_INVITATION,
  };

  static toDomain(record: Prisma.TokenGetPayload<{}>): Token {
    const props: TokenProps = {
      id: record.id,
      tokenHash: record.tokenHash,
      type: this.PRISMA_TO_DOMAIN_TOKEN_TYPE[record.type],
      referenceId: record.referenceId,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };

    return Token.reconstitute(props);
  }

  static toPersistence(token: Token): Prisma.TokenUncheckedCreateInput {
    const primitives = token.toPrimitives();
    return {
      id: primitives.id,
      tokenHash: primitives.tokenHash,
      type: this.DOMAIN_TO_PRISMA_TOKEN_TYPE[primitives.type],
      referenceId: primitives.referenceId,
      expiresAt: primitives.expiresAt,
      createdAt: primitives.createdAt,
    };
  }
}