declare module '@nestjs/jwt' {
  export class JwtService {
    sign(payload: Record<string, unknown>): string;
    verify<T>(token: string, options?: TokenVerificationOptions): T;  
  }

  export interface JwtModuleOptions {
    secret?: string;
    secretOrPrivateKey?: string;
    publicKey?: string;
    privateKey?: string;
    signOptions?: SignOptions;
    verifyOptions?: VerifyOptions;
  }

  export interface SignOptions {
    algorithm?: string;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    keyid?: string;
  }

  export interface VerifyOptions {
    algorithms?: string[];
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    maxAge?: string | number;
    clock?: string | number;
  }
  
  export const JwtModule: {
    register(options: JwtModuleOptions): JwtModuleDefinition;
    registerAsync(options: JwtAsyncOptions): JwtModuleDefinition;
  };

  // Define more specific types to replace 'any'
  export interface JwtModuleDefinition {
    module: unknown;
    providers: unknown[];
    exports: unknown[];
  }

  export interface JwtAsyncOptions {
    imports?: unknown[];
    useFactory?: (...args: unknown[]) => JwtModuleOptions | Promise<JwtModuleOptions>;
    inject?: unknown[];
  }
}
