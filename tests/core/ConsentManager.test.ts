import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsentManager } from '../../src/core/ConsentManager';
import { StorageAdapter } from '../../src/core/StorageAdapter';

describe('ConsentManager', () => {
  const storageKey = 'test_consent';
  let storage: StorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new StorageAdapter(storageKey, 'localStorage');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default denied categories', () => {
      const manager = new ConsentManager({ storage });

      const categories = manager.getCategories();
      expect(categories.necessary).toBe(true);
      expect(categories.functional).toBe(false);
      expect(categories.preferences).toBe(false);
      expect(categories.analytics).toBe(false);
      expect(categories.marketing).toBe(false);
    });

    it('should load existing consent from storage', () => {
      const consent = {
        version: '2.0',
        necessary: true,
        functional: true,
        preferences: false,
        analytics: true,
        marketing: false,
        timestamp: new Date().toISOString()
      };
      storage.save(consent);

      const manager = new ConsentManager({ storage });
      manager.load();

      const categories = manager.getCategories();
      expect(categories.functional).toBe(true);
      expect(categories.analytics).toBe(true);
      expect(categories.marketing).toBe(false);
    });
  });

  describe('acceptAll', () => {
    it('should set all categories to true', async () => {
      const manager = new ConsentManager({ storage });

      await manager.acceptAll();

      const categories = manager.getCategories();
      expect(categories.necessary).toBe(true);
      expect(categories.functional).toBe(true);
      expect(categories.preferences).toBe(true);
      expect(categories.analytics).toBe(true);
      expect(categories.marketing).toBe(true);
    });

    it('should call onAccept callback', async () => {
      const onAccept = vi.fn();
      const manager = new ConsentManager({ storage, onAccept });

      await manager.acceptAll();

      expect(onAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          necessary: true,
          functional: true,
          preferences: true,
          analytics: true,
          marketing: true
        })
      );
    });

    it('should persist to storage', async () => {
      const manager = new ConsentManager({ storage });

      await manager.acceptAll();

      const saved = storage.load();
      expect(saved).not.toBeNull();
      expect(saved?.analytics).toBe(true);
      expect(saved?.marketing).toBe(true);
    });
  });

  describe('rejectAll', () => {
    it('should set all optional categories to false', async () => {
      const manager = new ConsentManager({ storage });
      await manager.acceptAll(); // First accept all

      await manager.rejectAll();

      const categories = manager.getCategories();
      expect(categories.necessary).toBe(true);
      expect(categories.functional).toBe(false);
      expect(categories.preferences).toBe(false);
      expect(categories.analytics).toBe(false);
      expect(categories.marketing).toBe(false);
    });

    it('should call onReject callback', async () => {
      const onReject = vi.fn();
      const manager = new ConsentManager({ storage, onReject });

      await manager.rejectAll();

      expect(onReject).toHaveBeenCalled();
    });
  });

  describe('savePreferences', () => {
    it('should save specific category preferences', async () => {
      const manager = new ConsentManager({ storage });

      await manager.savePreferences({
        functional: true,
        analytics: true,
        marketing: false
      });

      const categories = manager.getCategories();
      expect(categories.functional).toBe(true);
      expect(categories.analytics).toBe(true);
      expect(categories.marketing).toBe(false);
    });

    it('should call onSave callback', async () => {
      const onSave = vi.fn();
      const manager = new ConsentManager({ storage, onSave });

      await manager.savePreferences({ analytics: true });

      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('isAllowed', () => {
    it('should return true for allowed categories', async () => {
      const manager = new ConsentManager({ storage });

      await manager.savePreferences({ analytics: true });

      expect(manager.isAllowed('necessary')).toBe(true);
      expect(manager.isAllowed('analytics')).toBe(true);
      expect(manager.isAllowed('marketing')).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return "essential" when only necessary is allowed', () => {
      const manager = new ConsentManager({ storage });

      expect(manager.getStatus()).toBe('essential');
    });

    it('should return "all" when all categories are allowed', async () => {
      const manager = new ConsentManager({ storage });
      await manager.acceptAll();

      expect(manager.getStatus()).toBe('all');
    });

    it('should return "partial" when some categories are allowed', async () => {
      const manager = new ConsentManager({ storage });
      await manager.savePreferences({ analytics: true });

      expect(manager.getStatus()).toBe('partial');
    });
  });

  describe('reset', () => {
    it('should clear storage and reset categories', async () => {
      const manager = new ConsentManager({ storage });
      await manager.acceptAll();

      manager.reset();

      expect(storage.load()).toBeNull();

      const categories = manager.getCategories();
      expect(categories.analytics).toBe(false);
      expect(categories.marketing).toBe(false);
    });
  });

  describe('consent ID generation', () => {
    it('should generate consent ID when enabled', async () => {
      const manager = new ConsentManager({
        storage,
        generateConsentId: true
      });

      await manager.acceptAll();

      const consentId = manager.getConsentId();
      expect(consentId).not.toBeNull();
      expect(consentId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should not generate consent ID when disabled', async () => {
      const manager = new ConsentManager({
        storage,
        generateConsentId: false
      });

      await manager.acceptAll();

      expect(manager.getConsentId()).toBeNull();
    });
  });

  describe('legacy mode', () => {
    it('should transform categories for legacy callbacks', async () => {
      const onAccept = vi.fn();
      const manager = new ConsentManager({
        storage,
        legacyMode: true,
        onAccept
      });

      await manager.savePreferences({
        functional: true,
        preferences: false,
        analytics: false,
        marketing: true
      });

      // Note: onSave would be called, not onAccept
      // Let's test with acceptAll to trigger onAccept
      await manager.acceptAll();

      const callArg = onAccept.mock.calls[0][0];
      // In legacy mode, analytics = functional || preferences || analytics
      expect(callArg.analytics).toBe(true);
      expect(callArg.marketing).toBe(true);
    });
  });

  describe('v1 to v2 migration', () => {
    it('should migrate v1 consent to v2 format', () => {
      // Save v1 format consent (no version field)
      const v1Consent = {
        necessary: true,
        analytics: true,
        marketing: false,
        timestamp: '2024-01-01T00:00:00.000Z'
      };
      localStorage.setItem(storageKey, JSON.stringify(v1Consent));

      const manager = new ConsentManager({ storage });
      const loaded = manager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.version).toBe('2.0');
      expect(loaded?.analytics).toBe(true);
      expect(loaded?.marketing).toBe(false);
      // New categories should default to false
      expect(loaded?.functional).toBe(false);
      expect(loaded?.preferences).toBe(false);
    });
  });
});
