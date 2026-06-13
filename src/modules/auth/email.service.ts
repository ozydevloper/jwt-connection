import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private appUrl: string | undefined;
  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.appUrl = this.configService.get<string>('APP_URL');
  }

  async sendVerificatoinEmail(email: string, token: string) {
    const verificationUrl = `${this.appUrl}/api/auth/verify-email?token=${token}`;
    await this.resend.emails.send({
      from: 'ozydeveloepr@gmail.com',
      to: email,
      subject: 'Verify your email.',
      html: `
      <h3>Click the link below to verify email</h3>
      <a href="${verificationUrl}">Verify</a>
      `,
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const resetPasswordUrl = `${this.appUrl}/api/auth/reset-password?token=${token}`;
    await this.resend.emails.send({
      from: 'ozydeveloepr@gmail.com',
      to: email,
      subject: 'Reset password.',
      html: `
      <h3>Reset password in our app</h3>
      <a href="${resetPasswordUrl}">Verify</a>
      `,
    });
  }
}
