import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus, Get, Response, Inject } from '@nestjs/common';
import { LocalAuthGuard } from './../infrastructure/guards/local.auth.guard.js';
import { JwtAuthGuard } from './../infrastructure/guards/jwt.auth.guard.js';
import { LoginUseCase } from '../application/auth.use-cases.js';
import {ApiOperation, ApiBody, ApiCreatedResponse, ApiBadRequestResponse, ApiResponse} from "@nestjs/swagger"
import { LoginDto } from './auth.dto.js';
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
  async login(@Request() req: any, @Response({ passthrough: true }) res: any) {
    var user = await this.loginUseCase.execute(req.user)

    res.cookie('jwt', user.accessToken, {
      httpOnly: true, // Non accessibile da JavaScript nel browser (sicurezza anti-XSS)
      secure: this.env.nodeEnv === "production",  // Dev'essere FALSE in locale (HTTP). Metti TRUE solo in produzione (HTTPS)
      sameSite: 'lax', // Permette l'invio tra porte diverse su localhost (3001 -> 3000)
      path: '/',
      maxAge: this.env.jwtExpiresIn
    });

    //TODO: PROD- DA LEVARE ASSOLUTAMENTE IN PRODUZIONE FATTO PER SWAGER
    if(this.env.nodeEnv == "development"){
      return {
        user: user.user,
        jwt: user.accessToken
      }; 
    }else{
      return user.user;
    }
    
  }

  @Post('logout')
  @Auth() 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout utente' })
  @ApiResponse({ status: 200, description: 'Logout effettuato con successo' })
  async logout(@Request() req: any, @Response({ passthrough: true }) res: any) {
  
    res.cookie('jwt', "", {
      httpOnly: true, // Non accessibile da JavaScript nel browser (sicurezza anti-XSS)
      secure: this.env.nodeEnv === "production",  // Dev'essere FALSE in locale (HTTP). Metti TRUE solo in produzione (HTTPS)
      sameSite: 'lax', // Permette l'invio tra porte diverse su localhost (3001 -> 3000)
      path: '/',
      maxAge: -1
    });
    return { message: 'Logout effettuato con successo' };
  }
}