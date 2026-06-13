import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { CryptoService } from '../crypto/crypto.service';

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
      throw new ConflictException('AN account with this email already exists.');

    const passwordHash = await this.cryptoService.generateHash(password);

    const verificationToken = this.cryptoService.generateHex(
      `${name}:${email}`,
    );
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
}
