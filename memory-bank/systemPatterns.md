# System Patterns: cconsent

## Architecture Overview

The library has two main layers:

1. **Core (Headless)**: Pure logic without UI dependencies
   - `ConsentManager`: State management for consent categories
   - `StorageAdapter`: Persistence layer (localStorage/cookies)
   - `ScriptManager`: Script/iframe blocking logic
   - `GeoDetector`: Region detection for consent modes

2. **UI Layer**: Full implementation with modal/buttons
   - Main `CookieConsent` class in `js/cookie-consent.js`
   - CSS in `css/cookie-consent.css`

## Key Design Patterns

### Configuration Merging
Deep merge of user config with defaults:
```javascript
this.config = this._mergeDeep(defaults, userOptions);
```

### Script Blocking Strategy
1. Scan DOM for elements with `data-cookie-category`
2. Block by setting `type="text/plain"` and removing `src`
3. Watch for new elements via MutationObserver
4. On consent change, evaluate and allow/block

### Storage Strategy
- Primary: localStorage (default)
- Alternative: Cookies (for cross-subdomain support)
- Optional: Base64 encoding for obfuscation
- Version field for migration support

### Global API Exposure
```javascript
window.CookieConsent = {
  show: () => {},
  showSettings: () => {},
  getConsent: () => {},
  isAllowed: (category) => {},
  // ...
};
```

### Category Attribute Syntax
```html
<!-- Single category -->
<script data-cookie-category="analytics" src="..."></script>

<!-- OR logic (any of these) -->
<script data-cookie-category="analytics marketing" src="..."></script>

<!-- Negation (run if NOT allowed) -->
<script data-cookie-category="!marketing" src="..."></script>
```

## Component Relationships

```
CookieConsent (Main Class)
    ├── StorageAdapter (persistence)
    ├── ConsentManager (state)
    ├── ScriptManager (blocking)
    ├── GeoDetector (regions)
    └── UI Components
        ├── Modal/Overlay
        ├── Initial View
        ├── Settings View
        ├── Floating Button
        └── Debug Badge
```

## Event Flow

1. `init()` called
2. Check for existing consent in storage
3. If geo-detection enabled, detect region
4. Scan scripts/iframes and block as needed
5. If no consent, show modal
6. On user action (accept/reject/save):
   - Update categories
   - Save to storage
   - Update Google Consent Mode
   - Re-evaluate scripts
   - Hide modal
   - Show floating button

## Framework Adapter Pattern

All adapters follow the same pattern:
1. Import `CookieConsent` from core package
2. Create instance with merged config
3. Wrap state in framework-specific reactivity
4. Expose hooks/composables for component access
