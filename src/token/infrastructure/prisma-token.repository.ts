import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Token, TokenType } from './../domain/token.entity.js';
import type { ITokenRepository } from './../domain/token.IRepository.js';
import { TokenMapper } from './prisma-token-mapper.js';

@Injectable()
export class PrismaTokenRepository implements ITokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(token: Token): Promise<Token> {
    const data = TokenMapper.toPersistence(token);
    
    const tokenDb = await this.prisma.token.create({data});

    return TokenMapper.toDomain(tokenDb)
  }

  async findAndDeleteByTokenHash(tokenHash: string): Promise<Token | null> {
    const record = await this.prisma.token.delete({
      where: {  tokenHash },
    });

    return record ? TokenMapper.toDomain(record) : null;
  }

  async findByReferenceId(referenceId: string, type?: TokenType): Promise<Token[]> {
    const records = await this.prisma.token.findMany({
      where: {
        referenceId,
        ...(type && { type: TokenMapper.DOMAIN_TO_PRISMA_TOKEN_TYPE[type] }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => TokenMapper.toDomain(record));
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.token.delete({
        where: { id },
      });
    } catch (error) {
      // Se il record non esiste, ignoriamo l'errore o gestiamo la cancellazione idempotente
      if (!this.isPrismaCode(error, 'P2025')) {
        throw error;
      }
    }
  }

  async deleteByReferenceAndType(referenceId: string, type: TokenType): Promise<void> {
    await this.prisma.token.deleteMany({
      where: {
        referenceId,
        type: TokenMapper.DOMAIN_TO_PRISMA_TOKEN_TYPE[type],
      },
    });
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
  }
}