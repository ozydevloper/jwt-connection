import { Injectable } from '@nestjs/common';
import { hash, compare, genSalt } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
@Injectable()
export class CryptoService {
  async generateHash(password: string) {
    const salt = await genSalt();
    return hash(password, salt);
  }

  generateHex(data: string) {
    return createHash('sha256').update(data).digest('hex');
  }

  generateRandomByte() {
    return randomBytes(32).toString('hex');
  }

  async compareHash(password: string, hashPassword: string) {
    return compare(password, hashPassword);
  }
}
