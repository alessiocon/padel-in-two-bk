import { Global, Module } from '@nestjs/common';
// import { createObserveModule } from '@nestjs/observe';
import { ClubsModule } from './clubs/clubs.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { getEnv, ENV_CONFIG } from './config/env.js';
import { PrismaService } from './database/prisma.service.js';
import { CoreModule } from './core.module.js';


@Module({
  imports: [
    CoreModule,
    ClubsModule,
    BookingsModule,
  ],
})
export class AppModule {}






// // export const { ObserveModule, ObserveInstrument } = createObserveModule();
// // @Inject(ENV_CONFIG) private readonly env: AppEnv,
// @Module({
//   providers: [
//     {
//       provide: ENV_CONFIG,
//       useValue: getEnv(),
//     },
//     PrismaService,
//   ],
//   imports: [
//     CoreModule,
//     ClubsModule,
//     BookingsModule,
//     // Distributed tracing, auto-correlated logs, request/job metrics, error
//     // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    
//     // ObserveModule.forRoot({
//     //   appKey: 'YOUR_APP_KEY',
//     //   appSecret: 'YOUR_APP_SECRET',
//     //   serviceId: 'padel-in-two-bk',
//     // }),
//   ],
// })
// export class AppModule {}
