/**
 * cconsent - Lightweight GDPR-compliant cookie consent dialog
 * @version 2.0.0
 */

// Export types
export * from './types';

// Export core modules
export { ConsentManager, StorageAdapter, ScriptManager, GeoDetector } from './core';

// Import CSS for bundlers (side effect)
import '../css/cookie-consent.css';

// Import the main CookieConsent class from JS implementation
// @ts-expect-error - JS file without types
import CookieConsentClass from '../js/cookie-consent.js';

import type {
  CookieConsentConfig,
  ConsentState,
  ConsentCategories,
  ConsentStatus,
  ManagedScriptInfo,
  ManagedIframeInfo,
  DebugExport
} from './types';

/**
 * CookieConsent class interface for TypeScript users
 */
export interface CookieConsentInstance {
  init(): Promise<void>;
  show(): void;
  hide(): void;
  showSettings(): void;
  showInitial(): void;
  getConsent(): ConsentState | null;
  isAllowed(category: keyof ConsentCategories): boolean;
  resetConsent(): void;
  acceptAll(): Promise<void>;
  rejectAll(): Promise<void>;
  savePreferences(): Promise<void>;
  exportDebug(): DebugExport;
  _getConsentStatus(): ConsentStatus;
  _getActiveCategoryCount(): number;
}

/**
 * CookieConsent constructor type
 */
export interface CookieConsentConstructor {
  new (config?: CookieConsentConfig): CookieConsentInstance;
}

/**
 * The CookieConsent class - main entry point for the library
 *
 * @example
 * ```typescript
 * import CookieConsent from 'cconsent';
 * import 'cconsent/style.css';
 *
 * const consent = new CookieConsent({
 *   policyUrl: '/privacy',
 *   googleConsentMode: { enabled: true }
 * });
 *
 * consent.init();
 * ```
 */
const CookieConsent: CookieConsentConstructor = CookieConsentClass;

export default CookieConsent;

// Type declarations for the global window object
declare global {
  interface Window {
    CookieConsent: {
      show: () => void;
      showSettings: () => void;
      hide: () => void;
      getConsent: () => ConsentState | null;
      isAllowed: (category: keyof ConsentCategories) => boolean;
      resetConsent: () => void;
      getStatus: () => ConsentStatus;
      scanScripts: () => void;
      wouldRunScript: (element: HTMLElement) => boolean;
      getManagedScripts: () => ManagedScriptInfo[];
      getManagedIframes: () => ManagedIframeInfo[];
    };
  }
}