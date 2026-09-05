import { Global, Module } from '@nestjs/common';
import { ENV_CONFIG, getEnv } from './config/env.js';
import { PrismaService } from './database/prisma.service.js';

@Global() // Rende tutto ciò che è qui dentro disponibile ovunque
@Module({
  providers: [
    {
      provide: ENV_CONFIG, 
      useValue: getEnv()
    },
    PrismaService,
  ],
  
  exports: [ENV_CONFIG, PrismaService], // <-- INDISPENSABILE: li rende globali
})
export class CoreModule {}