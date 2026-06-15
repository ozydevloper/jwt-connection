import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { UsersModule } from '../users/users.module';
import { CryptoModule } from '../crypto/crypto.module';
import { AUthController } from './auth.controller';

@Module({
  controllers: [AUthController],
  providers: [AuthService, EmailService],
  imports: [UsersModule, CryptoModule],
})
export class AuthModule {}
