import { Global, Module } from '@nestjs/common';
import { ENV_CONFIG, getEnv } from './config/env.js';
import { PrismaService } from './database/prisma.service.js';
import { CLOCK_SERVICE } from './service/interface/IClockService.js';
import { ClockService } from './service/ClockService.js';

@Global() // Rende tutto ciò che è qui dentro disponibile ovunque
@Module({
  providers: [
    {
      provide: ENV_CONFIG, 
      useValue: getEnv()
    },
    PrismaService,
    { provide: CLOCK_SERVICE, useClass: ClockService },
  ],
  
  exports: [ENV_CONFIG, PrismaService, CLOCK_SERVICE],
})
export class CoreModule {}