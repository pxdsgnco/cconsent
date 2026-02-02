import { writable, derived, get, type Readable, type Writable } from 'svelte/store';
import type { ConsentCategories, ConsentStatus, CookieConsentConfig } from 'cconsent';

// Type for the CookieConsent instance
interface CookieConsentInstance {
  init: () => Promise<void>;
  show: () => void;
  hide: () => void;
  showSettings: () => void;
  getConsent: () => ConsentState | null;
  isAllowed: (category: string) => boolean;
  resetConsent: () => void;
  _getConsentStatus: () => ConsentStatus;
}

interface ConsentState extends ConsentCategories {
  timestamp?: string;
  consentId?: string;
}

// Stores
let instance: CookieConsentInstance | null = null;

/**
 * Svelte store containing current consent state
 */
export const consent: Writable<ConsentCategories | null> = writable(null);

/**
 * Derived store for consent status
 */
export const status: Readable<ConsentStatus> = derived(consent, () => {
  return instance?._getConsentStatus() ?? 'essential';
});

/**
 * Initialize cookie consent
 *
 * @example
 * ```svelte
 * <script>
 *   import { onMount } from 'svelte';
 *   import { initCookieConsent, consent } from 'cconsent-svelte';
 *   import 'cconsent/style.css';
 *
 *   onMount(() => {
 *     initCookieConsent({
 *       policyUrl: '/privacy',
 *       googleConsentMode: { enabled: true }
 *     });
 *   });
 * </script>
 *
 * {#if $consent?.analytics}
 *   <AnalyticsComponent />
 * {/if}
 * ```
 */
export async function initCookieConsent(config: CookieConsentConfig): Promise<void> {
  if (typeof window === 'undefined') return;

  const CookieConsentClass = (window as unknown as {
    CookieConsent: new (config: CookieConsentConfig) => CookieConsentInstance;
  }).CookieConsent;

  if (!CookieConsentClass) {
    console.warn('[cconsent-svelte] CookieConsent class not found. Make sure cconsent is loaded.');
    return;
  }

  instance = new CookieConsentClass({
    ...config,
    onAccept: (categories) => {
      consent.set(categories);
      config.onAccept?.(categories);
    },
    onReject: (categories) => {
      consent.set(categories);
      config.onReject?.(categories);
    },
    onSave: (categories) => {
      consent.set(categories);
      config.onSave?.(categories);
    }
  });

  await instance.init();

  const existing = instance.getConsent();
  if (existing) {
    consent.set({
      necessary: true,
      functional: existing.functional ?? false,
      preferences: existing.preferences ?? false,
      analytics: existing.analytics ?? false,
      marketing: existing.marketing ?? false
    });
  }
}

/**
 * Check if a category is allowed
 *
 * @example
 * ```svelte
 * <script>
 *   import { isAllowed } from 'cconsent-svelte';
 *
 *   $: analyticsAllowed = isAllowed('analytics');
 * </script>
 * ```
 */
export function isAllowed(category: keyof ConsentCategories): boolean {
  return instance?.isAllowed(category) ?? false;
}

/**
 * Show the consent dialog
 */
export function showDialog(): void {
  instance?.show();
}

/**
 * Show the settings view directly
 */
export function showSettings(): void {
  instance?.show();
  instance?.showSettings();
}

/**
 * Hide the consent dialog
 */
export function hideDialog(): void {
  instance?.hide();
}

/**
 * Reset consent and show dialog again
 */
export function resetConsent(): void {
  instance?.resetConsent();
  consent.set(null);
}

/**
 * Get the current consent state (non-reactive)
 */
export function getConsent(): ConsentCategories | null {
  return get(consent);
}

/**
 * Get the current status (non-reactive)
 */
export function getStatus(): ConsentStatus {
  return get(status);
}

// Context key for SvelteKit
export const COOKIE_CONSENT_KEY = 'cconsent';

/**
 * Create a consent store for SvelteKit context
 * Useful for SSR-safe initialization
 *
 * @example
 * ```ts
 * // +layout.svelte
 * <script>
 *   import { setContext } from 'svelte';
 *   import { createConsentStore, COOKIE_CONSENT_KEY } from 'cconsent-svelte';
 *
 *   const consentStore = createConsentStore();
 *   setContext(COOKIE_CONSENT_KEY, consentStore);
 * </script>
 * ```
 */
export function createConsentStore() {
  const consentState = writable<ConsentCategories | null>(null);
  const statusState = writable<ConsentStatus>('essential');
  let localInstance: CookieConsentInstance | null = null;

  return {
    consent: { subscribe: consentState.subscribe },
    status: { subscribe: statusState.subscribe },

    async init(config: CookieConsentConfig): Promise<void> {
      if (typeof window === 'undefined') return;

      const CookieConsentClass = (window as unknown as {
        CookieConsent: new (config: CookieConsentConfig) => CookieConsentInstance;
      }).CookieConsent;

      if (!CookieConsentClass) return;

      localInstance = new CookieConsentClass({
        ...config,
        onAccept: (categories) => {
          consentState.set(categories);
          statusState.set(localInstance?._getConsentStatus() ?? 'essential');
          config.onAccept?.(categories);
        },
        onReject: (categories) => {
          consentState.set(categories);
          statusState.set(localInstance?._getConsentStatus() ?? 'essential');
          config.onReject?.(categories);
        },
        onSave: (categories) => {
          consentState.set(categories);
          statusState.set(localInstance?._getConsentStatus() ?? 'essential');
          config.onSave?.(categories);
        }
      });

      await localInstance.init();

      const existing = localInstance.getConsent();
      if (existing) {
        consentState.set({
          necessary: true,
          functional: existing.functional ?? false,
          preferences: existing.preferences ?? false,
          analytics: existing.analytics ?? false,
          marketing: existing.marketing ?? false
        });
        statusState.set(localInstance._getConsentStatus());
      }
    },

    isAllowed(category: keyof ConsentCategories): boolean {
      return localInstance?.isAllowed(category) ?? false;
    },

    showDialog(): void {
      localInstance?.show();
    },

    showSettings(): void {
      localInstance?.show();
      localInstance?.showSettings();
    },

    hideDialog(): void {
      localInstance?.hide();
    },

    resetConsent(): void {
      localInstance?.resetConsent();
      consentState.set(null);
      statusState.set('essential');
    }
  };
}

// Export types
export type ConsentStore = ReturnType<typeof createConsentStore>;
