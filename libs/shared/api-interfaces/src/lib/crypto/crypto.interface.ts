/**
 * Shared crypto interfaces for use in both browser and Node.js environments
 */

/**
 * Hash result interface
 */
export interface HashResult {
  hash: string;
  algorithm: string;
  encoding: string;
  salt?: string;
}

/**
 * Random bytes result interface
 */
export interface RandomBytesResult {
  bytes: string;
  size: number;
  encoding?: string;
  hex?: string;
}

/**
 * Crypto service interface definition
 */
export interface CryptoService {
  /**
   * Create a hash with the specified algorithm
   * @param algorithm Hash algorithm to use (sha256, sha512, etc)
   * @param data Data to hash
   * @param encoding Output encoding (hex, base64, etc)
   */
  createHash?(algorithm: string, data: string, encoding?: string): Promise<HashResult>;
  
  /**
   * Generate random bytes
   * @param size Number of bytes to generate
   * @param encoding Output encoding (hex, base64, etc)
   */
  randomBytes?(size: number, encoding?: string): Promise<RandomBytesResult>;
  
  /**
   * Generate a hash from input
   * @param input Text to hash
   * @param salt Optional salt value
   */
  generateHash?(input: string, salt?: string): Promise<HashResult>;
  
  /**
   * Compare a plaintext input with a stored hash
   * @param input Text to compare
   * @param hash Stored hash
   * @param salt Salt used for hashing
   */
  compareHash?(input: string, hash: string, salt: string): Promise<boolean>;
  
  /**
   * Generate random bytes
   * @param size Number of bytes to generate
   */
  generateRandomBytes?(size?: number): Promise<RandomBytesResult>;
  
  /**
   * Generate a random token of specified length
   * @param length Length of token to generate
   */
  generateToken?(length?: number): Promise<string>;
}
