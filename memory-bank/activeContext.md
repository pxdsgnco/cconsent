# Active Context: cconsent

## Current State
The library is at version 2.0.0 with a complete feature set. Recent work focused on:
- Fixing package export alignment
- Fixing script blocking for inline scripts
- Fixing storage mutation bugs
- Adding test coverage

## Recent Changes (Latest Session)

### 1. Package Exports Fixed
- Updated `src/index.ts` to properly import and re-export the CookieConsent class
- Added ES module export to `js/cookie-consent.js`
- Updated rollup config to handle JS imports with TypeScript

### 2. Framework Adapters Updated
- React, Vue, and Svelte adapters now import from the package
- Removed reliance on `window.CookieConsent` for instantiation
- All adapters import `CookieConsentClass` and types from `cconsent`

### 3. Script Blocking Improved
- Inline scripts now also get `type="text/plain"` set
- Content cleared to prevent re-parsing
- Both JS and TS implementations updated

### 4. Storage Bug Fixed
- `deleteCookie` in StorageAdapter.ts no longer mutates `this.cookieOptions`
- Uses local cookie string construction instead

### 5. UI Cleanup Fixed
- `resetConsent()` now removes:
  - Modal and overlay
  - ARIA live region
  - Floating button
- All references set to null after removal

### 6. Tests Added
- Created `tests/` directory with vitest configuration
- Tests for StorageAdapter, ScriptManager, ConsentManager
- Export verification tests

## Active Decisions
- The main CookieConsent implementation remains in JS for now
- TypeScript core modules provide headless alternatives
- Framework adapters depend on the main package

## Next Steps
- Consider converting `js/cookie-consent.js` to TypeScript
- Add integration tests with real browser
- Document inline script requirement (`type="text/plain"`)
