# API Reference

Complete reference for the cconsent API.

## Constructor

### CookieConsent(config)

Creates a new CookieConsent instance.

```javascript
const consent = new CookieConsent({
  policyUrl: '/privacy',
  // ... other options
});
```

See [Configuration](Configuration) for all available options.

## Instance Methods

### init()

Initializes the consent manager. Must be called after creating the instance.

```javascript
const consent = new CookieConsent({ policyUrl: '/privacy' });
consent.init();
```

**Returns:** `void`

---

### show()

Shows the initial consent modal.

```javascript
consent.show();
```

**Returns:** `void`

---

### showSettings()

Shows the settings/preferences view of the modal.

```javascript
consent.showSettings();
```

**Returns:** `void`

---

### hide()

Hides the consent modal.

```javascript
consent.hide();
```

**Returns:** `void`

---

### getConsent()

Returns the current consent state.

```javascript
const state = consent.getConsent();
console.log(state);
// {
//   version: "2.0",
//   necessary: true,
//   functional: false,
//   preferences: true,
//   analytics: true,
//   marketing: false,
//   timestamp: "2024-01-15T10:30:00.000Z",
//   consentId: "550e8400-e29b-41d4-a716-446655440000"  // if enabled
// }
```

**Returns:** `ConsentState | null`

---

### isAllowed(category)

Checks if a specific category is allowed.

```javascript
if (consent.isAllowed('analytics')) {
  initAnalytics();
}
```

**Parameters:**
- `category` (string): Category name (`necessary`, `functional`, `preferences`, `analytics`, `marketing`)

**Returns:** `boolean`

---

### getStatus()

Returns the overall consent status.

```javascript
const status = consent.getStatus();
// 'all' | 'partial' | 'essential'
```

**Returns:** `ConsentStatus`

| Status | Meaning |
|--------|---------|
| `'all'` | All 5 categories accepted |
| `'partial'` | Some non-essential categories accepted |
| `'essential'` | Only necessary cookies (all others rejected) |

---

### resetConsent()

Clears stored consent and shows the consent modal again.

```javascript
consent.resetConsent();
```

**Returns:** `void`

---

### scanScripts()

Re-scans the DOM for elements with `data-cookie-category`.

```javascript
// After dynamically adding scripts
consent.scanScripts();
```

**Returns:** `void`

---

### wouldRunScript(element)

Checks if an element would be allowed to run based on current consent.

```javascript
const script = document.querySelector('[data-cookie-category="analytics"]');
const wouldRun = consent.wouldRunScript(script);
console.log(wouldRun); // true or false
```

**Parameters:**
- `element` (HTMLElement): Element with `data-cookie-category` attribute

**Returns:** `boolean`

---

### getManagedScripts()

Returns an array of all scripts being managed.

```javascript
const scripts = consent.getManagedScripts();
console.log(scripts);
// [
//   { src: 'https://analytics.example.com/script.js', category: 'analytics', status: 'blocked' },
//   { src: 'inline', category: 'marketing', status: 'executed' }
// ]
```

**Returns:** `ManagedScript[]`

```typescript
interface ManagedScript {
  src: string;
  category: string;
  status: 'blocked' | 'executed';
}
```

---

### getManagedIframes()

Returns an array of all iframes being managed.

```javascript
const iframes = consent.getManagedIframes();
console.log(iframes);
// [
//   { src: 'https://youtube.com/embed/...', category: 'marketing', status: 'blocked' },
//   { src: 'https://maps.google.com/...', category: 'functional', status: 'loaded' }
// ]
```

**Returns:** `ManagedIframe[]`

```typescript
interface ManagedIframe {
  src: string;
  category: string;
  status: 'blocked' | 'loaded';
}
```

---

### exportDebug()

Exports the complete internal state for debugging.

```javascript
const debug = consent.exportDebug();
console.log(debug);
// {
//   consent: { necessary: true, ... },
//   config: { ... },
//   scripts: [...],
//   iframes: [...],
//   geo: { country: 'DE', region: 'gdpr', mode: 'opt-in' },
//   googleConsentMode: { ... }
// }
```

**Returns:** `DebugExport`

## Global API

After initialization, a global `window.CookieConsent` object is available:

```javascript
// Access from anywhere
window.CookieConsent.show();
window.CookieConsent.showSettings();
window.CookieConsent.hide();
window.CookieConsent.getConsent();
window.CookieConsent.isAllowed('analytics');
window.CookieConsent.getStatus();
window.CookieConsent.resetConsent();
window.CookieConsent.scanScripts();
window.CookieConsent.wouldRunScript(element);
window.CookieConsent.getManagedScripts();
window.CookieConsent.getManagedIframes();
```

## HTML Attributes

### data-cookie-category

Applied to scripts and iframes to control blocking:

```html
<script data-cookie-category="analytics" src="..."></script>
<iframe data-cookie-category="marketing" src="..."></iframe>
```

**Values:**
- Single category: `"analytics"`
- Multiple categories (OR): `"analytics marketing"`
- Negation: `"!marketing"`

### data-cc-open

Applied to any element to open the consent modal when clicked:

```html
<a href="#" data-cc-open>Manage Cookie Preferences</a>
<button data-cc-open>Cookie Settings</button>
```

## Events

cconsent pushes events to `window.dataLayer`:

### cookie_consent_update

Fired when consent changes:

```javascript
window.dataLayer.push({
  event: 'cookie_consent_update',
  cookie_consent: {
    necessary: true,
    functional: true,
    preferences: false,
    analytics: true,
    marketing: false
  }
});
```

## Types

### ConsentCategories

```typescript
interface ConsentCategories {
  necessary: boolean;
  functional: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}
```

### ConsentState

```typescript
interface ConsentState extends ConsentCategories {
  version: string;
  timestamp: string;
  consentId?: string;
}
```

### ConsentStatus

```typescript
type ConsentStatus = 'all' | 'partial' | 'essential';
```

### CookieConsentConfig

```typescript
interface CookieConsentConfig {
  storageKey?: string;
  storageMethod?: 'localStorage' | 'cookie';
  cookieOptions?: CookieOptions;
  encryption?: boolean;
  generateConsentId?: boolean;
  policyUrl?: string;
  debug?: boolean;
  legacyMode?: boolean;
  floatingButton?: FloatingButtonConfig;
  googleConsentMode?: GoogleConsentModeConfig;
  geo?: GeoConfig;
  content?: ContentConfig;
  onAccept?: (categories: ConsentCategories) => void;
  onReject?: (categories: ConsentCategories) => void;
  onSave?: (categories: ConsentCategories) => void;
}
```

### GoogleConsentModeConfig

```typescript
interface GoogleConsentModeConfig {
  enabled: boolean;
  waitForUpdate?: number;
  mapping?: {
    analytics?: string[];
    marketing?: string[];
    functional?: string[];
    preferences?: string[];
  };
  adsDataRedaction?: boolean;
  urlPassthrough?: boolean;
  regionDefaults?: Record<string, Record<string, 'granted' | 'denied'>>;
}
```

### GeoConfig

```typescript
interface GeoConfig {
  enabled: boolean;
  method?: 'timezone' | 'api' | 'header';
  apiEndpoint?: string;
  headerName?: string;
  timeout?: number;
  cache?: boolean;
  cacheDuration?: number;
  regions?: {
    gdpr?: string[];
    ccpa?: string[];
    lgpd?: string[];
    [key: string]: string[] | undefined;
  };
  modeByRegion?: {
    gdpr?: 'opt-in' | 'opt-out' | 'none';
    ccpa?: 'opt-in' | 'opt-out' | 'none';
    lgpd?: 'opt-in' | 'opt-out' | 'none';
    default?: 'opt-in' | 'opt-out' | 'none';
    [key: string]: 'opt-in' | 'opt-out' | 'none' | undefined;
  };
}
```

### FloatingButtonConfig

```typescript
interface FloatingButtonConfig {
  enabled: boolean;
  position?: 'bottom-left' | 'bottom-right';
  icon?: 'cookie' | 'shield' | 'gear' | string;
  label?: string;
  showIndicator?: boolean;
  offset?: { x: number; y: number };
}
```

## CSS Classes

### Modal Classes

| Class | Description |
|-------|-------------|
| `.cc-modal` | Main modal container |
| `.cc-modal-overlay` | Background overlay |
| `.cc-modal-content` | Modal content wrapper |
| `.cc-initial-view` | Initial consent view |
| `.cc-settings-view` | Settings/preferences view |

### Button Classes

| Class | Description |
|-------|-------------|
| `.cc-btn` | Base button class |
| `.cc-btn-accept` | Accept all button |
| `.cc-btn-reject` | Reject all button |
| `.cc-btn-customize` | Customize/settings button |
| `.cc-btn-save` | Save preferences button |

### Toggle Classes

| Class | Description |
|-------|-------------|
| `.cc-toggle` | Toggle switch container |
| `.cc-toggle-input` | Hidden checkbox input |
| `.cc-toggle-slider` | Visual slider element |

### Other Classes

| Class | Description |
|-------|-------------|
| `.cc-floating-btn` | Floating settings button |
| `.cc-blocked-placeholder` | Blocked iframe placeholder |
| `.cc-debug-badge` | Debug mode badge |

## CSS Variables

Customize the appearance with CSS variables:

```css
:root {
  --cc-bg: #1a1a1a;
  --cc-text: #ffffff;
  --cc-text-secondary: #888888;
  --cc-accent: #00d4aa;
  --cc-accent-hover: #00b894;
  --cc-border: #333333;
  --cc-toggle-on: #00d4aa;
  --cc-toggle-off: #555555;
  --cc-radius: 12px;
  --cc-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
```

## Related Pages

- **[Configuration](Configuration)** — Full configuration reference
- **[Script Blocking](Script-Blocking)** — Script management details
- **[Framework Adapters](Framework-Adapters)** — Framework-specific APIs
