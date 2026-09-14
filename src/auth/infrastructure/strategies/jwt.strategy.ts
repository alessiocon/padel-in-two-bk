import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject } from '@nestjs/common';
import { JwtPayload } from '../../domain/jwt-payload.interface.js';
import { type AppEnv, ENV_CONFIG } from '../../../config/env.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ENV_CONFIG) env: AppEnv) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Cerca il token nell'header Authorization: Bearer <token>
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Se non lo trova nell'header, lo estrae automaticamente dal cookie 'jwt'
        (request: any) => {
          return request?.cookies?.jwt || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: env.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Il valore restituito viene iniettato automaticamente in req.user
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}