/**
 * cconsent - Lightweight GDPR-compliant cookie consent dialog
 * @version 2.0.0
 */

// Export types
export * from './types';

// Export core modules
export { ConsentManager, StorageAdapter, ScriptManager, GeoDetector } from './core';

// Re-export the existing CookieConsent class (from JS file)
// For the npm package, we reference the compiled version

// Import CSS for bundlers
import '../css/cookie-consent.css';

// The main CookieConsent class from the original JS implementation
// This file serves as the TypeScript entry point and type provider
// The actual implementation is in js/cookie-consent.js

// Type declarations for the global window object
declare global {
  interface Window {
    CookieConsent: import('./types').CookieConsentAPI;
  }
}

// For backwards compatibility, the UMD build will expose CookieConsent globally
// ESM/CJS users should use the class directly

/**
 * Default export is the CookieConsent class
 * Usage:
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
