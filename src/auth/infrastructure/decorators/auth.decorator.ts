import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './../guards/jwt.auth.guard.js';


export function Auth() {
  const decorators = [
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Token non valido o scaduto.' }),
  ];

  return applyDecorators(...decorators);
}