import { Module , Global} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './presentation/auth.controller.js';
import { AUTH_USE_CASES } from './application/auth.use-cases.js';
import { LocalStrategy } from './infrastructure/strategies/local.strategy.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { ENV_CONFIG, type AppEnv } from './../config/env.js'
import { TokenModule } from '../token/token.module.js';



@Global()
@Module({
  imports: [
    UserModule,
    PassportModule,
    TokenModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ENV_CONFIG],
      useFactory: (env: AppEnv) => ({
        secret: env.jwtSecret,
        signOptions: {
          expiresIn: (env.jwtExpiresIn as StringValue) || '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ...AUTH_USE_CASES,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [
    ...AUTH_USE_CASES,
    PassportModule,
    JwtStrategy
  ],
})
export class AuthModule {}