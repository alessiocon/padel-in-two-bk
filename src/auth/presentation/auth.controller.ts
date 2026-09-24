import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus, Get, Response, Inject, Param, Query, BadRequestException, Body } from '@nestjs/common';
import { LocalAuthGuard } from './../infrastructure/guards/local.auth.guard.js';
import { emailConfirmation, LoginUseCase, resetPassword, sendEmailConfirmation, sendEmailForgotPassword } from '../application/auth.use-cases.js';
import {ApiOperation, ApiBody, ApiCreatedResponse, ApiBadRequestResponse, ApiResponse} from "@nestjs/swagger"
import { AuthUserResDto, LoginDto, resetPasswordReqDto } from './auth.dto.js';
import { type AppEnv, ENV_CONFIG } from '../../config/env.js';
import { Auth } from '../infrastructure/decorators/auth.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(ENV_CONFIG) private readonly env: AppEnv,
    private readonly loginUseCase: LoginUseCase,
    private readonly emailConfirmationUseCase: emailConfirmation,
    private readonly sendEmailConfirmationUseCase: sendEmailConfirmation,
    private readonly sendEmailForgotPasseordUseCase: sendEmailForgotPassword,
    private readonly resetPasswordUseCase: resetPassword
  ) {}

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
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: isProduction ? '.padelintwo.it' : undefined,
      path: '/',
      maxAge: this.env.cookieExpiresIn,
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
      sameSite: 'lax',
      domain: isProduction ? '.padelintwo.it' : undefined,
      path: '/',
      maxAge: -1,
    });
    return { message: 'Logout effettuato con successo' };
  }

  @Get('sendemailconfirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'send email confirmation' })
  @ApiResponse({ status: 200, description: 'Conferma della mail inviata' })
  async sendEmailConfirmation(
    @Query('tokenId') tokenId: string,
  ){
    if(tokenId === null){
      throw new BadRequestException("id non valido")
    }
    return await this.sendEmailConfirmationUseCase.execute(tokenId);
  }


  @Post('emailconfirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'email confirmation' })
  @ApiResponse({ status: 200, description: 'Conferma della mail effettuata con successo' })
  async emailConfirmation(
    @Query('tokenId') tokenId: string,
  ){
    return await this.emailConfirmationUseCase.execute(tokenId);
  }


  @Get('sendemailforgotpassword')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'send email for reset password' })
  @ApiResponse({ status: 200, description: 'Email per il reset della Password inviata' })
  async sendEmailForgotPassword(
    @Query("email") email: string,
  ){
    if(email === null){
      throw new BadRequestException("email non valida")
    }
    return await this.sendEmailForgotPasseordUseCase.execute(email);
  }

  @Post('resetpassword')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOperation({ summary: 'reimposta password' })
  @ApiResponse({ status: 200, description: 'password aggiornata' })
  async resetPassword(
    @Body() body: resetPasswordReqDto
  ){
    
    return await this.resetPasswordUseCase.execute(body);
  }
}