import { Body, Controller, Post } from '@nestjs/common';
import { CryptoService, HashResult, RandomBytesResult } from './crypto.service';

class CreateHashDto {
  algorithm?: string;
  data: string;
  encoding?: 'hex' | 'base64';
}

class RandomBytesDto {
  size: number;
  encoding?: 'hex' | 'base64';
}

/**
 * Controller for cryptographic operations
 */
@Controller('api/crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  /**
   * Create a hash for the provided data
   */
  @Post('hash')
  createHash(@Body() dto: CreateHashDto): HashResult {
    return this.cryptoService.createHash(
      dto.data,
      dto.algorithm || 'sha256',
      dto.encoding || 'hex'
    );
  }

  /**
   * Generate random bytes
   */
  @Post('random')
  generateRandomBytes(@Body() dto: RandomBytesDto): RandomBytesResult {
    return this.cryptoService.generateRandomBytes(
      dto.size,
      dto.encoding || 'hex'
    );
  }

  /**
   * Hash a password securely
   */
  @Post('password/hash')
  hashPassword(@Body() { password }: { password: string }) {
    return this.cryptoService.hashPassword(password);
  }

  /**
   * Verify a password against a hash
   */
  @Post('password/verify')
  verifyPassword(
    @Body() { password, hash, salt }: { password: string; hash: string; salt: string }
  ) {
    const isValid = this.cryptoService.verifyPassword(password, hash, salt);
    return { isValid };
  }
}
