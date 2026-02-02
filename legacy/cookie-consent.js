/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use the main js/cookie-consent.js file instead
 */

console.warn(
  '[cconsent] The legacy/cookie-consent.js file is deprecated.\n' +
  'Please use the main js/cookie-consent.js file instead.\n\n' +
  'See migration guide: https://github.com/pxdsgnco/cconsent/wiki/Migration-Guide'
);

// For browser usage, the main js/cookie-consent.js is still the primary implementation
// This file serves as a deprecation notice for those loading from /legacy/

if (typeof window !== 'undefined') {
  // Browser environment - redirect to load main file
  console.info('[cconsent] Please include js/cookie-consent.js directly.');
}
