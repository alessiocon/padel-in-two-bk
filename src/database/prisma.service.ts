import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { ENV_CONFIG, type AppEnv } from '../config/env.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV_CONFIG) private readonly env: AppEnv,) {
    const connectionString = env.databaseUrl;
    if (!connectionString) {
      throw new Error('Missing required env: DATABASE_URL');
    }

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}