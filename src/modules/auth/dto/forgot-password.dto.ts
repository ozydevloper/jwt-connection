import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alan.turing@gmail.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
