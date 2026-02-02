/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use the npm package instead: npm install cconsent
 */

console.warn(
  '[cconsent] The standalone cookie-consent.js file is deprecated.\n' +
  'Please migrate to the npm package for better support:\n\n' +
  '  npm install cconsent\n\n' +
  'See migration guide: https://github.com/pxdsgnco/cconsent#migration'
);

// For browser usage, the main js/cookie-consent.js is still the primary implementation
// This file serves as a deprecation notice for those loading from /legacy/

if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment - redirect to dist
  module.exports = require('../dist/index.cjs');
} else if (typeof window !== 'undefined') {
  // Browser environment - load the UMD bundle
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/cconsent@2/dist/index.umd.js';
  script.async = true;
  document.head.appendChild(script);

  // Also load styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/cconsent@2/dist/style.css';
  document.head.appendChild(link);
}
