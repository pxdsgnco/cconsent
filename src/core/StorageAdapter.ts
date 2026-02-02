import type { ConsentState, CookieOptions } from '../types';

/**
 * Storage adapter for consent data (localStorage or cookies)
 */
export class StorageAdapter {
  private storageKey: string;
  private storageMethod: 'localStorage' | 'cookie';
  private cookieOptions: CookieOptions;
  private encryption: boolean;

  constructor(
    storageKey: string = 'cookie_consent',
    storageMethod: 'localStorage' | 'cookie' = 'localStorage',
    cookieOptions: Partial<CookieOptions> = {},
    encryption: boolean = false
  ) {
    this.storageKey = storageKey;
    this.storageMethod = storageMethod;
    this.cookieOptions = {
      sameSite: 'Strict',
      secure: true,
      path: '/',
      expires: 365,
      ...cookieOptions
    };
    this.encryption = encryption;
  }

  /**
   * Encode data for storage
   */
  private encode(data: ConsentState): string {
    const jsonString = JSON.stringify(data);
    if (this.encryption) {
      try {
        return btoa(unescape(encodeURIComponent(jsonString)));
      } catch {
        return jsonString;
      }
    }
    return jsonString;
  }

  /**
   * Decode data from storage
   */
  private decode(encodedData: string): ConsentState | null {
    if (!encodedData) return null;

    // Try plain JSON first (backward compatibility)
    try {
      return JSON.parse(encodedData);
    } catch {
      // Not plain JSON, try Base64
    }

    try {
      const decoded = decodeURIComponent(escape(atob(encodedData)));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Set a cookie
   */
  private setCookie(name: string, value: string): void {
    const opts = this.cookieOptions;
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (opts.expires) {
      const date = new Date();
      date.setTime(date.getTime() + opts.expires * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (opts.path) cookieString += `; path=${opts.path}`;
    if (opts.domain) cookieString += `; domain=${opts.domain}`;
    if (opts.sameSite) cookieString += `; SameSite=${opts.sameSite}`;
    if (opts.secure) cookieString += '; Secure';

    document.cookie = cookieString;
  }

  /**
   * Get a cookie value
   */
  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    const encodedName = encodeURIComponent(name);

    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
      if (cookieName === encodedName) {
        return decodeURIComponent(cookieValueParts.join('='));
      }
    }
    return null;
  }

  /**
   * Delete a cookie by setting it with an expired date
   */
  private deleteCookie(name: string): void {
    const opts = this.cookieOptions;
    // Build cookie string with expired date directly (do not mutate this.cookieOptions)
    let cookieString = `${encodeURIComponent(name)}=`;

    // Set expiration to the past
    const date = new Date(0);
    cookieString += `; expires=${date.toUTCString()}`;

    if (opts.path) cookieString += `; path=${opts.path}`;
    if (opts.domain) cookieString += `; domain=${opts.domain}`;
    if (opts.sameSite) cookieString += `; SameSite=${opts.sameSite}`;
    if (opts.secure) cookieString += '; Secure';

    document.cookie = cookieString;
  }

  /**
   * Save consent to storage
   */
  save(consent: ConsentState): void {
    const encoded = this.encode(consent);

    try {
      if (this.storageMethod === 'cookie') {
        this.setCookie(this.storageKey, encoded);
      } else {
        localStorage.setItem(this.storageKey, encoded);
      }
    } catch (e) {
      console.warn('Cookie consent: Unable to save to ' + this.storageMethod, e);
    }
  }

  /**
   * Load consent from storage
   */
  load(): ConsentState | null {
    try {
      let stored: string | null;
      if (this.storageMethod === 'cookie') {
        stored = this.getCookie(this.storageKey);
      } else {
        stored = localStorage.getItem(this.storageKey);
      }

      if (!stored) return null;
      return this.decode(stored);
    } catch (e) {
      console.warn('Cookie consent: Unable to read from ' + this.storageMethod, e);
      return null;
    }
  }

  /**
   * Clear consent from storage
   */
  clear(): void {
    try {
      if (this.storageMethod === 'cookie') {
        this.deleteCookie(this.storageKey);
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {
      console.warn('Cookie consent: Unable to clear ' + this.storageMethod, e);
    }
  }

  /**
   * Migrate from localStorage to cookies
   */
  migrateToStorage(): void {
    if (this.storageMethod !== 'cookie') return;

    try {
      const localData = localStorage.getItem(this.storageKey);
      if (localData && !this.getCookie(this.storageKey)) {
        const consent = this.decode(localData);
        if (consent) {
          this.save(consent);
          localStorage.removeItem(this.storageKey);
        }
      }
    } catch {
      // Migration failed, ignore
    }
  }
}
