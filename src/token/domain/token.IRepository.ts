import { Token, TokenType } from './token.entity.js';

export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');
export interface ITokenRepository {
  /**
   * Salva un nuovo token o aggiorna uno esistente
   */
  save(token: Token): Promise<Token>;
  findAndDeleteByTokenHash(tokenHash: string): Promise<Token | null>;
  findByReferenceId(referenceId: string, type?: TokenType): Promise<Token[]>;
  delete(id: string): Promise<void>;
  deleteByReferenceAndType(referenceId: string, type: TokenType): Promise<void>;
}