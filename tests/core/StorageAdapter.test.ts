import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageAdapter } from '../../src/core/StorageAdapter';

describe('StorageAdapter', () => {
  const storageKey = 'test_consent';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('localStorage storage', () => {
    it('should save and load consent from localStorage', () => {
      const adapter = new StorageAdapter(storageKey, 'localStorage');
      const consent = {
        version: '2.0',
        necessary: true,
        functional: false,
        preferences: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString()
      };

      adapter.save(consent);
      const loaded = adapter.load();

      expect(loaded).toEqual(consent);
    });

    it('should clear consent from localStorage', () => {
      const adapter = new StorageAdapter(storageKey, 'localStorage');
      const consent = {
        version: '2.0',
        necessary: true,
        functional: false,
        preferences: false,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString()
      };

      adapter.save(consent);
      adapter.clear();
      const loaded = adapter.load();

      expect(loaded).toBeNull();
    });

    it('should handle Base64 encoding when encryption is enabled', () => {
      const adapter = new StorageAdapter(storageKey, 'localStorage', {}, true);
      const consent = {
        version: '2.0',
        necessary: true,
        functional: true,
        preferences: false,
        analytics: true,
        marketing: false,
        timestamp: new Date().toISOString()
      };

      adapter.save(consent);

      // The stored value should be Base64 encoded
      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toContain('"version"'); // Not plain JSON

      // But should still load correctly
      const loaded = adapter.load();
      expect(loaded).toEqual(consent);
    });
  });

  describe('cookie storage', () => {
    it('should save and load consent from cookies', () => {
      const adapter = new StorageAdapter(storageKey, 'cookie', {
        secure: false, // jsdom doesn't support secure cookies
        sameSite: 'Lax'
      });
      const consent = {
        version: '2.0',
        necessary: true,
        functional: true,
        preferences: false,
        analytics: false,
        marketing: true,
        timestamp: new Date().toISOString()
      };

      adapter.save(consent);
      const loaded = adapter.load();

      expect(loaded).toEqual(consent);
    });

    it('should not mutate cookie options after delete', () => {
      const adapter = new StorageAdapter(storageKey, 'cookie', {
        expires: 365,
        secure: false,
        sameSite: 'Lax'
      });

      const consent = {
        version: '2.0',
        necessary: true,
        functional: false,
        preferences: false,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString()
      };

      // Save initial consent
      adapter.save(consent);
      expect(adapter.load()).toEqual(consent);

      // Clear consent
      adapter.clear();
      expect(adapter.load()).toBeNull();

      // Save again - should still work with original options
      adapter.save(consent);
      const loaded = adapter.load();
      expect(loaded).toEqual(consent);
    });
  });
});
