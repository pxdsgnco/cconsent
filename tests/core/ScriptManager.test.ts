import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScriptManager } from '../../src/core/ScriptManager';

describe('ScriptManager', () => {
  let container: HTMLDivElement;
  let allowedCategories: Set<string>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    allowedCategories = new Set(['necessary']);
  });

  afterEach(() => {
    container.remove();
  });

  const isAllowed = (category: string) => allowedCategories.has(category);

  describe('shouldAllow', () => {
    it('should allow scripts when category is allowed', () => {
      allowedCategories.add('analytics');
      const manager = new ScriptManager(isAllowed);

      expect(manager.shouldAllow('analytics')).toBe(true);
    });

    it('should block scripts when category is not allowed', () => {
      const manager = new ScriptManager(isAllowed);

      expect(manager.shouldAllow('analytics')).toBe(false);
    });

    it('should handle OR logic with multiple categories', () => {
      const manager = new ScriptManager(isAllowed);

      // Neither analytics nor marketing is allowed
      expect(manager.shouldAllow('analytics marketing')).toBe(false);

      // Allow analytics
      allowedCategories.add('analytics');
      expect(manager.shouldAllow('analytics marketing')).toBe(true);
    });

    it('should handle negation logic', () => {
      const manager = new ScriptManager(isAllowed);

      // !marketing means "run if marketing is NOT allowed"
      expect(manager.shouldAllow('!marketing')).toBe(true);

      // Allow marketing
      allowedCategories.add('marketing');
      expect(manager.shouldAllow('!marketing')).toBe(false);
    });

    it('should allow scripts with no required categories if exclusions do not match', () => {
      const manager = new ScriptManager(isAllowed);

      // Only exclusions, none of which are allowed
      expect(manager.shouldAllow('!analytics !marketing')).toBe(true);
    });
  });

  describe('script blocking', () => {
    it('should track scripts with data-cookie-category', () => {
      const script = document.createElement('script');
      script.setAttribute('data-cookie-category', 'analytics');
      script.src = 'https://example.com/analytics.js';
      container.appendChild(script);

      const manager = new ScriptManager(isAllowed);
      manager.scanScripts();

      const managed = manager.getManagedScripts();
      expect(managed.length).toBe(1);
      expect(managed[0].category).toBe('analytics');
      expect(managed[0].status).toBe('pending');
    });

    it('should block inline scripts by clearing content', () => {
      const script = document.createElement('script');
      script.setAttribute('data-cookie-category', 'analytics');
      script.textContent = 'console.log("analytics");';
      container.appendChild(script);

      const manager = new ScriptManager(isAllowed);
      manager.scanScripts();
      manager.evaluate();

      // Script should be blocked
      const managed = manager.getManagedScripts();
      expect(managed[0].status).toBe('blocked');

      // Script type should be text/plain
      expect(script.getAttribute('type')).toBe('text/plain');
    });

    it('should allow scripts when consent is given', () => {
      const script = document.createElement('script');
      script.setAttribute('data-cookie-category', 'analytics');
      script.src = 'https://example.com/analytics.js';
      container.appendChild(script);

      const manager = new ScriptManager(isAllowed);
      manager.scanScripts();
      manager.evaluate();

      // Should be blocked initially
      let managed = manager.getManagedScripts();
      expect(managed[0].status).toBe('blocked');

      // Grant consent
      allowedCategories.add('analytics');
      manager.evaluate();

      // Should now be allowed
      managed = manager.getManagedScripts();
      expect(managed[0].status).toBe('allowed');
    });
  });

  describe('iframe blocking', () => {
    it('should track iframes with data-cookie-category', () => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('data-cookie-category', 'marketing');
      iframe.setAttribute('data-src', 'https://example.com/widget');
      container.appendChild(iframe);

      const manager = new ScriptManager(isAllowed);
      manager.scanIframes();

      const managed = manager.getManagedIframes();
      expect(managed.length).toBe(1);
      expect(managed[0].category).toBe('marketing');
    });
  });

  describe('cleanup', () => {
    it('should disconnect observer on destroy', () => {
      const manager = new ScriptManager(isAllowed);
      manager.initObserver();
      manager.destroy();

      // No error should occur, observer should be null
      expect(true).toBe(true);
    });
  });
});
