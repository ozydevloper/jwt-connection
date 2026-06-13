import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { UsersModule } from '../users/users.module';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  providers: [AuthService, EmailService],
  imports: [UsersModule, CryptoModule],
})
export class AuthModule {}
