/**
 * Manages Master PIN derivation, Biometric simulation, and First-Time PIN initialization.
 */
import { EncryptedFileVault } from './vault';

export class BiometricSecurityManager {
  private static PREF_PIN_HASH = 'shosho_sec_pin_hash';
  private static PREF_PIN_SALT = 'shosho_sec_pin_salt';
  private static PREF_IS_SETUP_COMPLETE = 'shosho_sec_is_setup_complete';
  private static PREF_USE_BIOMETRIC = 'shosho_sec_use_biometric';

  public static isSetupComplete(): boolean {
    return localStorage.getItem(this.PREF_IS_SETUP_COMPLETE) === 'true';
  }

  public static isBiometricEnabled(): boolean {
    const val = localStorage.getItem(this.PREF_USE_BIOMETRIC);
    return val === null ? true : val === 'true';
  }

  public static setBiometricEnabled(enabled: boolean): void {
    localStorage.setItem(this.PREF_USE_BIOMETRIC, enabled ? 'true' : 'false');
  }

  private static async hashPin(pin: string, saltHex: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${saltHex}:${pin}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private static generateSalt(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Initial setup when 11:11 is triggered for the first time.
   */
  public static async setupInitialPin(pin: string): Promise<boolean> {
    if (pin.length < 4) return false;
    const salt = this.generateSalt();
    const hash = await this.hashPin(pin, salt);

    localStorage.setItem(this.PREF_PIN_HASH, hash);
    localStorage.setItem(this.PREF_PIN_SALT, salt);
    localStorage.setItem(this.PREF_IS_SETUP_COMPLETE, 'true');

    await this.deriveAndUnlockMasterKey(pin);
    return true;
  }

  /**
   * Verify backup PIN and unlock master key
   */
  public static async verifyPin(pin: string): Promise<boolean> {
    const storedHash = localStorage.getItem(this.PREF_PIN_HASH);
    const storedSalt = localStorage.getItem(this.PREF_PIN_SALT);
    if (!storedHash || !storedSalt) return false;

    const computed = await this.hashPin(pin, storedSalt);
    if (computed === storedHash) {
      await this.deriveAndUnlockMasterKey(pin);
      return true;
    }
    return false;
  }

  /**
   * Change backup PIN after being authenticated
   */
  public static async changePin(newPin: string): Promise<boolean> {
    if (newPin.length < 4) return false;
    const salt = this.generateSalt();
    const hash = await this.hashPin(newPin, salt);

    localStorage.setItem(this.PREF_PIN_HASH, hash);
    localStorage.setItem(this.PREF_PIN_SALT, salt);

    await this.deriveAndUnlockMasterKey(newPin);
    return true;
  }

  /**
   * Derives master encryption key from PIN
   */
  private static async deriveAndUnlockMasterKey(pin: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(`master_key_${pin}`));
    const masterKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    EncryptedFileVault.setMasterKey(masterKey);
  }

  /**
   * Simulates/executes biometric unlock
   */
  public static async authenticateBiometric(): Promise<boolean> {
    if (!this.isSetupComplete()) return false;
    // In browser, unlock master key with default derivation
    const storedHash = localStorage.getItem(this.PREF_PIN_HASH);
    if (!storedHash) return false;
    // Simulate biometric matching delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    await this.deriveAndUnlockMasterKey('biometric_verified');
    return true;
  }

  public static lockApp(): void {
    EncryptedFileVault.setMasterKey(null);
  }
}
