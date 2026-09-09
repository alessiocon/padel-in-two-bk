import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '../../../user/domain/user.entity.js';
import { JwtAuthGuard } from './../guards/jwt.auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from './roles.decoretor.js';

export function Auth(...roles: UserRole[]) {
  const decorators = [
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Token non valido o scaduto.' }),
  ];

  if (roles.length > 0) {
    decorators.push(
      Roles(...roles),
      ApiForbiddenResponse({ description: 'Permessi insufficienti per accedere a questa risorsa.' }),
    );
  }

  return applyDecorators(...decorators);
}