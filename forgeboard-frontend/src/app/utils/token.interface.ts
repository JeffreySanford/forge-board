import { environment } from '../../environments/environment';


/**
 * Token Service Bridge Module
 * 
 * Provides a consistent interface between the frontend application
 * and JWT token operations, including secure storage, retrieval,
 * and management of authentication tokens.
 */
export class TokenEncryption {
  private static readonly ENCRYPTION_KEY = environment.JWTKEY;
  
  /**
   * Encrypt a JWT token for secure storage
   * @param token The JWT token to encrypt
   * @returns Encrypted token string
   */
  public static encryptToken(token: string): string {
    if (!token) return '';
    
    try {
      // Simple XOR encryption with the key for obfuscation
      // This is not cryptographically secure but prevents simple token theft
      const encrypted = TokenEncryption.xorEncrypt(token, TokenEncryption.ENCRYPTION_KEY);
      return btoa(encrypted); // Base64 encode for storage
    } catch (error) {
      console.error('Token encryption failed:', error);
      return '';
    }
  }
  
  /**
   * Decrypt an encrypted JWT token
   * @param encryptedToken The encrypted token string
   * @returns Decrypted JWT token
   */
  public static decryptToken(encryptedToken: string): string {
    if (!encryptedToken) return '';
    
    try {
      // Base64 decode
      const encrypted = atob(encryptedToken);
      // XOR decrypt
      return TokenEncryption.xorEncrypt(encrypted, TokenEncryption.ENCRYPTION_KEY);
    } catch (error) {
      console.error('Token decryption failed:', error);
      return '';
    }
  }
  
  /**
   * XOR encrypt/decrypt a string
   * @param text Text to encrypt/decrypt
   * @param key Encryption key
   * @returns Encrypted/decrypted text
   */
  private static xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  }
}
