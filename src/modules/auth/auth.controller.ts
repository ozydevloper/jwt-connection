import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Users } from '@prisma/client';
@Controller('auth')
export class AUthController {
  constructor(private authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'register a new user.' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @ApiOperation({ summary: 'verify email and auto-login.' })
  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.verifyEmail(token, response);
  }

  @Public()
  @ApiOperation({ summary: 'login user.' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(response, loginDto);
  }

  @Public()
  @ApiOperation({ summary: 'refresh token' })
  @ApiCookieAuth()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request & { signedCookies: { refreshToken: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  @ApiOperation({ summary: 'User logged out' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: Response,
    @CurrentUser() user: Users,
  ) {
    const { id } = user;
    return this.authService.logout(response, id);
  }

  @ApiOperation({ summary: 'Get operation user' })
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: Users) {
    const { id, email, name, role, isVerified } = user;
    return { id, email, name, role, isVerified };
  }
}
