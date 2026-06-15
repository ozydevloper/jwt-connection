import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Users } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { CryptoService } from '../crypto/crypto.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, name, password } = registerDto;
    const existingUser = await this.usersService.findOne({ email });

    if (existingUser)
      throw new ConflictException('An account with this email already exists.');

    const passwordHash = await this.cryptoService.generateHash(password);

    const verificationToken = this.cryptoService.generateRandomByte();
    const verificationTokenExpiresAt = new Date(
      Date.now() + 1 * 60 * 60 * 1000,
    );

    const user = await this.usersService.create({
      email,
      name,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt,
    });

    void this.emailService.sendVerificatoinEmail(user.email, verificationToken);

    return {
      message:
        'Registration Successful. Please check your email to verify your account.',
    };
  }

  async login(response: Response, loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid email or password.');

    const matchPassword = await this.cryptoService.compareHash(
      password,
      user.passwordHash,
    );
    if (!matchPassword)
      throw new UnauthorizedException('Invalid email or password.');

    if (!user.isVerified)
      throw new UnauthorizedException(
        'Please check your email to verify your email before continue',
      );

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    void this.saveRefreshTokenCookie(response, refreshToken);

    return {
      message: 'Success login.',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(
    request: Request & { signedCookies: { refreshToken: string } },
    response: Response,
  ) {
    const refreshTokenCookie = request.signedCookies.refreshToken;
    if (!refreshTokenCookie)
      throw new UnauthorizedException('No refresh token provided.');

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshTokenCookie, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.usersService.findOne({ id: payload.sub });
    if (!user || !user.refreshTokenHash)
      throw new UnauthorizedException('Invalid refresh token.');

    const refreshTokenMatch = await this.compareRefreshToken(
      refreshTokenCookie,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatch)
      throw new UnauthorizedException('Invalid refresh token.');

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    void this.saveRefreshTokenCookie(response, refreshToken);

    return {
      message: 'Success refresh token.',
      accessToken,
    };
  }

  async logout(response: Response, id: string) {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    await this.usersService.update({ id }, { refreshTokenHash: null });
    return { message: 'Logged out successfully.' };
  }

  async verifyEmail(token: string, response: Response) {
    if (!token) throw new UnauthorizedException('Invalid verification token.');
    const user = await this.usersService.findOne({ verificationToken: token });
    if (!user || !user.verificationToken)
      throw new BadRequestException('Invalid verification token.');

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    )
      throw new BadRequestException(
        'Verification token has expired. Please create a new one',
      );

    await this.usersService.update(
      { id: user.id },
      {
        verificationToken: null,
        verificationTokenExpiresAt: null,
        isVerified: true,
      },
    );

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    void this.saveRefreshTokenCookie(response, refreshToken);

    return {
      message: 'Success verify, you are now logged in.',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne({ email });

    if (!user)
      return {
        message:
          'if an account with that email exist, a reset link has been send',
      };

    const resetPasswordToken = this.cryptoService.generateRandomByte();
    const resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.update(
      { email: user.email },
      { resetPasswordToken, resetPasswordTokenExpiresAt },
    );

    void this.emailService.sendResetPasswordEmail(
      user.email,
      resetPasswordToken,
    );
    return {
      message:
        'if an account with that email exist, a reset link has been send',
    };
  }

  async resetPassword(resetPasswordToken: string, newPassword: string) {
    if (!resetPasswordToken) throw new UnauthorizedException('invalid token.');
    const user = await this.usersService.findOne({ resetPasswordToken });
    if (!user || !user.resetPasswordToken || !user.resetPasswordTokenExpiresAt)
      throw new UnauthorizedException('invalid token.');

    if (user.resetPasswordTokenExpiresAt < new Date())
      throw new UnauthorizedException(
        'Reset password ha been expired, please create new One',
      );

    const passwordHash = await this.cryptoService.generateHash(newPassword);

    await this.usersService.update(
      { id: user.id },
      {
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
        passwordHash,
      },
    );

    return {
      message: 'reset password success',
    };
  }

  async generateTokens(user: Users) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async saveRefreshToken(id: string, refreshToken: string) {
    const refreshTokenHex = this.cryptoService.generateHex(refreshToken);
    const refreshTokenHash =
      await this.cryptoService.generateHash(refreshTokenHex);
    return this.usersService.update({ id }, { refreshTokenHash });
  }

  async compareRefreshToken(refreshToken: string, refreshTokenHash: string) {
    const refreshTokenHex = this.cryptoService.generateHex(refreshToken);
    return this.cryptoService.compareHash(refreshTokenHex, refreshTokenHash);
  }

  saveRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}
