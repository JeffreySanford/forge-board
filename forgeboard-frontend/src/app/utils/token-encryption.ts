/**
 * Utility for token encryption/decryption
 */
export class TokenEncryption {
  private static readonly ENCRYPTION_KEY = 'forge-board-secure-key';
  
  /**
   * Simple encryption for JWT tokens
   * Note: This is not production-grade encryption. For real security,
   * use a proper encryption library with server-side validation.
   */
  static encryptToken(token: string): string {
    if (!token) return '';
    
    // Simple XOR encryption
    const key = this.ENCRYPTION_KEY;
    let result = '';
    
    for (let i = 0; i < token.length; i++) {
      const charCode = token.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return btoa(result); // Base64 encode
  }
  
  /**
   * Decrypt a previously encrypted token
   */
  static decryptToken(encryptedToken: string): string {
    if (!encryptedToken) return '';
    
    try {
      const token = atob(encryptedToken); // Base64 decode
      const key = this.ENCRYPTION_KEY;
      let result = '';
      
      for (let i = 0; i < token.length; i++) {
        const charCode = token.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return result;
    } catch (e) {
      console.error('Failed to decrypt token:', e);
      return '';
    }
  }
}
