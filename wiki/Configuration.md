# Configuration

Complete reference for all cconsent configuration options.

## Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storageKey` | string | `'cookie_consent'` | Storage key name |
| `storageMethod` | string | `'localStorage'` | `'localStorage'` or `'cookie'` |
| `cookieOptions` | object | See below | Cookie storage configuration |
| `encryption` | boolean | `false` | Enable Base64 encoding of consent data |
| `generateConsentId` | boolean | `false` | Generate unique UUID for each consent |
| `policyUrl` | string | `'#'` | URL to your cookie/privacy policy |
| `debug` | boolean | `false` | Enable debug mode with badge and logging |
| `legacyMode` | boolean | `false` | Use 3-category callbacks for v1 compatibility |
| `floatingButton` | object | See below | Floating settings button configuration |
| `googleConsentMode` | object | See below | Google Consent Mode v2 settings |
| `geo` | object | See below | Geolocation detection settings |
| `content` | object | See below | UI text customization |
| `onAccept` | function | `null` | Callback when user accepts all |
| `onReject` | function | `null` | Callback when user rejects all |
| `onSave` | function | `null` | Callback when user saves preferences |

## Storage Options

### localStorage (Default)

```javascript
const consent = new CookieConsent({
  storageMethod: 'localStorage',
  storageKey: 'my_consent_key'
});
```

### Cookie Storage

```javascript
const consent = new CookieConsent({
  storageMethod: 'cookie',
  cookieOptions: {
    sameSite: 'Strict',  // 'Strict', 'Lax', or 'None'
    secure: true,        // Require HTTPS
    domain: null,        // Cookie domain (null = current domain)
    path: '/',           // Cookie path
    expires: 365         // Expiry in days
  }
});
```

> **Note**: If `sameSite: 'None'`, the `secure` option is automatically set to `true`.

## Consent ID Generation

Generate a unique identifier for each consent record (useful for server-side tracking):

```javascript
const consent = new CookieConsent({
  generateConsentId: true
});

// After consent is given:
const { consentId } = consent.getConsent();
// consentId: "550e8400-e29b-41d4-a716-446655440000"
```

## Base64 Encoding

Optionally encode consent data in Base64:

```javascript
const consent = new CookieConsent({
  encryption: true  // Actually Base64 encoding, not encryption
});
```

> **Note**: This is encoding, not encryption. It obfuscates data but doesn't secure it.

## Floating Button

GDPR Article 7(3) requires that withdrawing consent be as easy as giving it. The floating button provides this:

```javascript
const consent = new CookieConsent({
  floatingButton: {
    enabled: true,
    position: 'bottom-right',  // 'bottom-left' | 'bottom-right'
    icon: 'cookie',            // 'cookie' | 'shield' | 'gear' | custom SVG
    label: 'Cookie Settings',  // Accessible label
    showIndicator: true,       // Show consent status indicator
    offset: { x: 20, y: 20 }   // Position offset in pixels
  }
});
```

### Status Indicator

When `showIndicator: true`, the button shows a colored dot:

- 🟢 **Green**: All 5 categories accepted
- 🟡 **Yellow**: Partial consent (some categories)
- 🔴 **Red**: Essential only (all non-necessary rejected)

### Custom Icon

```javascript
floatingButton: {
  icon: '<svg viewBox="0 0 24 24">...</svg>'
}
```

## Content Customization

Customize all UI text:

```javascript
const consent = new CookieConsent({
  content: {
    initialView: {
      heading: 'Cookie settings',
      description: {
        text: 'We use cookies to enhance your experience. Read our ',
        linkText: 'Cookie Policy',
        suffix: ' to learn more.'
      },
      buttons: {
        customize: 'Customize Cookie Settings',
        rejectAll: 'Reject All Cookies',
        acceptAll: 'Accept All Cookies'
      }
    },
    settingsView: {
      heading: 'Cookie settings',
      description: 'Manage your preferences below.',
      buttons: {
        save: 'Save Preferences'
      }
    },
    categories: {
      necessary: 'Required for security and basic functionality.',
      functional: 'Enables enhanced features like live chat and videos.',
      preferences: 'Remembers your settings like language and theme.',
      analytics: 'Helps us understand how visitors use our site.',
      marketing: 'Enables personalized ads and tracking.'
    }
  }
});
```

## Callbacks

### Callback Signatures

```javascript
const consent = new CookieConsent({
  onAccept: (categories) => {
    // Called when user clicks "Accept All"
    console.log(categories);
    // { necessary: true, functional: true, preferences: true, 
    //   analytics: true, marketing: true }
  },
  
  onReject: (categories) => {
    // Called when user clicks "Reject All"
    console.log(categories);
    // { necessary: true, functional: false, preferences: false,
    //   analytics: false, marketing: false }
  },
  
  onSave: (categories) => {
    // Called when user clicks "Save Preferences"
    console.log(categories);
    // { necessary: true, functional: true, preferences: false,
    //   analytics: true, marketing: false }
  }
});
```

### Legacy Mode

For backward compatibility with v1 (3-category model):

```javascript
const consent = new CookieConsent({
  legacyMode: true,
  onAccept: (categories) => {
    // Only receives: { necessary, analytics, marketing }
  }
});
```

## Debug Mode

Enable comprehensive debugging:

```javascript
const consent = new CookieConsent({
  debug: true
});
```

### Debug Badge

Shows a floating badge with:
- Current state of all 5 categories
- List of managed scripts with status
- List of managed iframes with status
- "Clear Consent" button
- "Randomize" button (sets random consent)
- "Export" button (copies state to clipboard)

### Console Logging

All actions are logged with the `[cconsent]` prefix:

```
[cconsent] Initializing with config: {...}
[cconsent] Geo detection: GDPR region detected
[cconsent] Script blocked: analytics.js (analytics)
[cconsent] User accepted all categories
```

### Export Debug State

```javascript
const state = consent.exportDebug();
console.log(state);
// {
//   consent: { necessary: true, ... },
//   scripts: [{ src: '...', category: 'analytics', status: 'blocked' }],
//   iframes: [...],
//   geo: { region: 'EU', mode: 'opt-in' },
//   googleConsentMode: { ... }
// }
```

## Complete Example

```javascript
const consent = new CookieConsent({
  // Storage
  storageKey: 'my_site_consent',
  storageMethod: 'cookie',
  cookieOptions: {
    sameSite: 'Lax',
    secure: true,
    expires: 365
  },
  
  // Features
  generateConsentId: true,
  policyUrl: '/privacy-policy',
  debug: false,
  
  // Floating button
  floatingButton: {
    enabled: true,
    position: 'bottom-right',
    showIndicator: true
  },
  
  // Google Consent Mode
  googleConsentMode: {
    enabled: true,
    waitForUpdate: 500
  },
  
  // Geolocation
  geo: {
    enabled: true,
    method: 'timezone'
  },
  
  // Callbacks
  onAccept: (categories) => {
    loadAnalytics();
    loadMarketing();
  },
  onReject: (categories) => {
    // Handle rejection
  },
  onSave: (categories) => {
    if (categories.analytics) loadAnalytics();
    if (categories.marketing) loadMarketing();
  }
});

consent.init();
```

## Related Pages

- **[Google Consent Mode v2](Google-Consent-Mode-v2)** — Detailed Google integration
- **[Geolocation](Geolocation)** — Region detection configuration
- **[API Reference](API-Reference)** — Runtime methods and properties
