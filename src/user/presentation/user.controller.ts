import { Controller, Request, Post, Body, Get, Param, HttpCode, HttpStatus,InternalServerErrorException, BadRequestException,NotFoundException, UseGuards} from '@nestjs/common';
import { CreateUserUseCase, GetUserByIdUseCase } from '../application/user.use-cases.js';
import { CreateUserDto, UserResponseDto } from './user.dto.js';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { User, UserRole } from '../domain/user.entity.js';
import { UserNotFoundError } from '../domain/user-errors.js';
import { Auth } from './../../auth/infrastructure/decorators/auth.decorator.js';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUser: GetUserByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiOkResponse({ type: String })
  @ApiBadRequestResponse({ description: 'Invalid Data' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const userDto : CreateUserDto = {...dto, email: dto.email.toLowerCase()} 
    return await this.createUser.execute(userDto);
  }

  @Auth(/*UserRole.CLUB_OWNER*/)
  @Get('me')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiCreatedResponse({ type: Boolean, description: 'Profile retrieved successfully' }) 
  @ApiBadRequestResponse({ description: 'Invalid request' })
  async getProfile(@Request() req: any) : Promise<UserResponseDto> {
    return req.user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id') id: string) : Promise<UserResponseDto> {

    try {
      return this.toResponse(await this.getUser.execute(id));
    } catch (error) {
      throw this.toHttpError(error);
    }
  }


  private toResponse(user: User): UserResponseDto {
    return { ...user.toPrimitives()};
  }

  private toHttpError(error: unknown): Error {
      if (error instanceof UserNotFoundError) {
        return new NotFoundException(error.message);
      }
      
      if (error instanceof Error && (error.message.startsWith('User name') || error.message.startsWith('User email'))) {
        return new BadRequestException(error.message);
      }
      return new InternalServerErrorException('Unable to process user request');
    }
}