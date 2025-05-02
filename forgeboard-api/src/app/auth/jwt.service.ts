import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly secret: jwt.Secret = process.env.JWT_SECRET || 'forgeboard-secret-key';
  private readonly expiresIn: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRATION_TIME || '7d') as jwt.SignOptions['expiresIn'];

  sign(payload: string | object | Buffer, options?: jwt.SignOptions): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      ...options,
    });
  }

  verify<T extends object = Record<string, unknown>>(token: string, options?: jwt.VerifyOptions): T {
    return jwt.verify(token, this.secret, options) as T;
  }

  decode(token: string, options?: jwt.DecodeOptions): null | { [key: string]: unknown } | string {
    return jwt.decode(token, options);
  }
}
