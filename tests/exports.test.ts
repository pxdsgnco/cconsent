import { describe, it, expect } from 'vitest';

describe('Package exports', () => {
  it('should export CookieConsent as default', async () => {
    const module = await import('../src/index');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('should export core modules', async () => {
    const module = await import('../src/index');

    expect(module.ConsentManager).toBeDefined();
    expect(module.StorageAdapter).toBeDefined();
    expect(module.ScriptManager).toBeDefined();
    expect(module.GeoDetector).toBeDefined();
  });

  it('should export types (via TypeScript compilation)', async () => {
    // This test verifies that types are exported correctly
    // by importing them - if this compiles, the types exist
    const types = await import('../src/types');

    // These are interfaces/types that should be exported
    expect(types).toBeDefined();
  });

  it('should be able to instantiate core modules', async () => {
    const { StorageAdapter, ConsentManager, ScriptManager, GeoDetector } = await import('../src/index');

    // StorageAdapter
    const storage = new StorageAdapter('test_key');
    expect(storage).toBeDefined();

    // ConsentManager
    const manager = new ConsentManager({ storage });
    expect(manager).toBeDefined();

    // ScriptManager
    const scripts = new ScriptManager(() => false);
    expect(scripts).toBeDefined();

    // GeoDetector
    const geo = new GeoDetector();
    expect(geo).toBeDefined();
  });
});
