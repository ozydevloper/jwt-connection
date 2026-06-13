import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class RegisterDto {
  @ApiProperty({ example: 'Alan Turing', minLength: 8, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  name!: string;

  @ApiProperty({ example: 'alan.turing@example.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'mypassword123', minLength: 8, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}
