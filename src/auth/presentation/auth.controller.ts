import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { LocalAuthGuard } from './../infrastructure/guards/local.auth.guard.js';
import { JwtAuthGuard } from './../infrastructure/guards/jwt.auth.guard.js';
import { LoginUseCase } from '../application/auth.use-cases.js';
import {ApiOperation, ApiBody, ApiCreatedResponse, ApiBadRequestResponse, ApiResponse} from "@nestjs/swagger"
import { LoginDto } from './auth.dto.js';
import { Auth } from '../infrastructure/decorators/auth.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ type: Boolean, description: 'Login successful' }) 
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any) {
    
    return await this.loginUseCase.execute(req.user);
  }


  // TODO: eliminare il jwt token lato client 
  // @Auth() 
  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Logout utente' })
  // @ApiResponse({ status: 200, description: 'Logout effettuato con successo' })
  // async logout() {
  
  //   return { message: 'Logout effettuato con successo' };
  // }
}