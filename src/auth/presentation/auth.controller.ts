import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus, Get, Response, Inject } from '@nestjs/common';
import { LocalAuthGuard } from './../infrastructure/guards/local.auth.guard.js';
import { LoginUseCase } from '../application/auth.use-cases.js';
import {ApiOperation, ApiBody, ApiCreatedResponse, ApiBadRequestResponse, ApiResponse} from "@nestjs/swagger"
import { AuthUserResDto, LoginDto } from './auth.dto.js';
import { type AppEnv, ENV_CONFIG } from '../../config/env.js';
import { Auth } from '../infrastructure/decorators/auth.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(ENV_CONFIG) private readonly env: AppEnv,
    private readonly loginUseCase: LoginUseCase) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ type: Boolean, description: 'Login successful' }) 
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any, @Response({ passthrough: true }) res: any) : Promise<AuthUserResDto> {
    let response = await this.loginUseCase.execute(req.user)

    let isProduction = this.env.nodeEnv === "production"
    res.cookie('jwt', response.accessToken, {
      httpOnly: true, // Non accessibile da JavaScript nel browser (sicurezza anti-XSS)
      secure: isProduction,  // Dev'essere FALSE in locale (HTTP). Metti TRUE solo in produzione (HTTPS)
      sameSite: isProduction ? 'none' : 'lax', // Permette l'invio tra porte diverse su localhost (3001 -> 3000)
      path: '/',
      maxAge: this.env.cookieExpiresIn
    });

    return {
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      username: response.user.username,
      id: response.user.id,
      role: response.user.role
    };
    
  }

  @Post('logout')
  @Auth() 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout utente' })
  @ApiResponse({ status: 200, description: 'Logout effettuato con successo' })
  async logout(@Request() req: any, @Response({ passthrough: true }) res: any) {
  
    let isProduction = this.env.nodeEnv === "production"
    res.cookie('jwt', "", {
      httpOnly: true,
      secure: isProduction,  
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: -1
    });
    return { message: 'Logout effettuato con successo' };
  }
}