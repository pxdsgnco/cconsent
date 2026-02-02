# Cookie Consent Dialog

A lightweight, GDPR-compliant cookie consent dialog built with vanilla HTML, CSS, and JavaScript. Now with Google Consent Mode v2, geolocation-based consent, and framework adapters.

## Features

- Clean, modern dark theme design
- **5-category consent model**: Necessary, Functional, Preferences, Analytics, Marketing
- Google Consent Mode v2 integration
- Geolocation-based consent modes (GDPR, CCPA, LGPD)
- Automatic script and iframe blocking with MutationObserver
- Multi-category support with OR logic and negation
- Customizable settings panel with toggle switches
- Fully customizable text content
- Flexible storage: localStorage or cookies
- Optional Base64 encoding for consent data
- Consent ID generation for server-side tracking
- Accessible (WCAG 2.1 AA compliant)
- Responsive design with mobile bottom sheet
- Framework adapters for React, Vue, and Svelte
- TypeScript support with full type definitions

## Installation

### Browser (CDN)

```html
<link rel="stylesheet" href="css/cookie-consent.css">
<script src="js/cookie-consent.js"></script>
```

### NPM

```bash
npm install cconsent
```

```javascript
import CookieConsent from 'cconsent';
import 'cconsent/style.css';

const consent = new CookieConsent({ policyUrl: '/privacy' });
consent.init();
```

## Quick Start

```javascript
const cookieConsent = new CookieConsent({
  policyUrl: 'https://yoursite.com/cookie-policy',
  googleConsentMode: { enabled: true },
  floatingButton: { enabled: true },
  onAccept: (categories) => console.log('Accepted:', categories),
  onReject: (categories) => console.log('Rejected:', categories),
  onSave: (categories) => console.log('Saved:', categories)
});

cookieConsent.init();
```

## Cookie Categories

The 5-category model provides granular control over consent:

| Category | Default | Toggleable | Description |
|----------|---------|------------|-------------|
| Necessary | ON | No | Required for security and basic functionality |
| Functional | OFF | Yes | Enhanced features like live chat and videos |
| Preferences | OFF | Yes | Remembers settings like language and theme |
| Analytics | OFF | Yes | Site usage and performance tracking |
| Marketing | OFF | Yes | Personalized ads and cross-site tracking |

### Consent Object

```javascript
{
  version: "2.0",
  necessary: true,
  functional: boolean,
  preferences: boolean,
  analytics: boolean,
  marketing: boolean,
  timestamp: string,
  consentId: string  // Only if generateConsentId: true
}
```

## Configuration

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storageKey` | string | `'cookie_consent'` | Storage key name |
| `storageMethod` | string | `'localStorage'` | `'localStorage'` or `'cookie'` |
| `cookieOptions` | object | See below | Cookie configuration |
| `encryption` | boolean | `false` | Enable Base64 encoding |
| `generateConsentId` | boolean | `false` | Generate unique UUID |
| `policyUrl` | string | `'#'` | Cookie policy URL |
| `debug` | boolean | `false` | Enable debug mode |
| `legacyMode` | boolean | `false` | Use 3-category callbacks |
| `floatingButton` | object | See below | Floating button config |
| `googleConsentMode` | object | See below | Google Consent Mode v2 |
| `geo` | object | See below | Geolocation detection |
| `content` | object | See below | UI text customization |
| `onAccept` | function | `null` | Callback on accept all |
| `onReject` | function | `null` | Callback on reject all |
| `onSave` | function | `null` | Callback on save preferences |

### Cookie Storage Options

```javascript
cookieOptions: {
  sameSite: 'Strict',  // 'Strict', 'Lax', or 'None'
  secure: true,
  domain: null,
  path: '/',
  expires: 365  // Days
}
```

## Google Consent Mode v2

Integrate with Google Analytics 4 and Google Ads:

```javascript
const cookieConsent = new CookieConsent({
  googleConsentMode: {
    enabled: true,
    waitForUpdate: 500,
    mapping: {
      analytics: ['analytics_storage'],
      marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
      functional: [],
      preferences: []
    },
    adsDataRedaction: true,
    urlPassthrough: false,
    regionDefaults: {
      'US': { ad_storage: 'granted', analytics_storage: 'granted' },
      'EU': { ad_storage: 'denied', analytics_storage: 'denied' }
    }
  }
});
```

### Consent Signals

| Signal | Category | Description |
|--------|----------|-------------|
| `analytics_storage` | analytics | Google Analytics cookies |
| `ad_storage` | marketing | Advertising cookies |
| `ad_user_data` | marketing | User data for ads |
| `ad_personalization` | marketing | Personalized advertising |

### DataLayer Events

When consent changes, an event is pushed to the dataLayer:

```javascript
{
  event: 'cookie_consent_update',
  cookie_consent: {
    necessary: true,
    functional: boolean,
    preferences: boolean,
    analytics: boolean,
    marketing: boolean
  }
}
```

## Geolocation Detection

Automatically adjust consent requirements based on user location:

```javascript
const cookieConsent = new CookieConsent({
  geo: {
    enabled: true,
    method: 'timezone',  // 'timezone', 'api', or 'header'
    apiEndpoint: null,   // For 'api' method
    headerName: 'CF-IPCountry',  // For 'header' method
    timeout: 500,
    cache: true,
    cacheDuration: 86400000,  // 24 hours
    regions: {
      gdpr: ['AT', 'BE', 'BG', ...],  // EU countries
      ccpa: ['US-CA'],
      lgpd: ['BR']
    },
    modeByRegion: {
      gdpr: 'opt-in',   // Must consent before tracking
      ccpa: 'opt-out',  // Can track until rejected
      lgpd: 'opt-in',
      default: 'none'   // No consent UI needed
    }
  }
});
```

### Detection Methods

| Method | Description |
|--------|-------------|
| `timezone` | Uses `Intl.DateTimeFormat` to detect country from timezone |
| `api` | Calls external geolocation API endpoint |
| `header` | Reads country from `<meta name="user-country">` tag |

### CCPA Mode

When `geo.modeByRegion.ccpa: 'opt-out'` is active, the reject button shows "Do Not Sell My Info" instead of "Reject All Cookies".

## Script & Iframe Blocking

### Basic Usage

```html
<!-- Blocked until analytics consent -->
<script data-cookie-category="analytics" src="https://analytics.example.com/script.js"></script>

<!-- Blocked until marketing consent -->
<iframe data-cookie-category="marketing" src="https://ads.example.com/widget"></iframe>
```

### Multi-Category Support

```html
<!-- Allowed if EITHER analytics OR marketing is consented (OR logic) -->
<script data-cookie-category="analytics marketing" src="script.js"></script>

<!-- Allowed only if marketing is NOT consented (negation) -->
<script data-cookie-category="!marketing" src="privacy-focused.js"></script>
```

### Dynamic Script Detection

Scripts and iframes added dynamically via JavaScript are automatically detected and blocked using MutationObserver:

```javascript
// This script will be automatically blocked if analytics not consented
const script = document.createElement('script');
script.src = 'https://analytics.example.com/track.js';
script.setAttribute('data-cookie-category', 'analytics');
document.body.appendChild(script);
```

### Blocked Content Placeholders

Blocked iframes display a placeholder with a "Change settings" link:

```css
.cc-blocked-placeholder {
  /* Customizable via CSS variables */
}
```

### Script Management API

```javascript
// Re-scan DOM for new scripts/iframes
window.CookieConsent.scanScripts();

// Check if an element would be allowed
window.CookieConsent.wouldRunScript(element);

// Get managed scripts info
window.CookieConsent.getManagedScripts();
// [{ src: "analytics.js", category: "analytics", status: "blocked" }]

// Get managed iframes info
window.CookieConsent.getManagedIframes();
// [{ src: "widget.html", category: "marketing", status: "blocked" }]
```

## Floating Settings Button

GDPR Article 7(3) requires consent withdrawal to be as easy as giving consent:

```javascript
floatingButton: {
  enabled: true,
  position: 'bottom-right',  // 'bottom-left' | 'bottom-right'
  icon: 'cookie',            // 'cookie' | 'shield' | 'gear' | custom SVG
  label: 'Cookie Settings',
  showIndicator: true,
  offset: { x: 20, y: 20 }
}
```

**Status Indicator:**
- 🟢 Green: All 5 categories accepted
- 🟡 Yellow: Partial consent
- 🔴 Red: Essential only

## Global API

```javascript
window.CookieConsent.show();
window.CookieConsent.showSettings();
window.CookieConsent.hide();
window.CookieConsent.getConsent();
window.CookieConsent.isAllowed('analytics');
window.CookieConsent.getStatus();  // 'all' | 'partial' | 'essential'
window.CookieConsent.resetConsent();
window.CookieConsent.scanScripts();
window.CookieConsent.wouldRunScript(element);
window.CookieConsent.getManagedScripts();
window.CookieConsent.getManagedIframes();
```

## Auto-binding Elements

```html
<a href="#" data-cc-open>Manage Cookie Preferences</a>
```

## Framework Adapters

### React

```bash
npm install cconsent cconsent-react
```

```tsx
import { CookieConsentProvider, useCookieConsent, ConsentScript, ConsentGate } from 'cconsent-react';
import 'cconsent/style.css';

function App() {
  return (
    <CookieConsentProvider config={{ policyUrl: '/privacy' }}>
      <MyApp />
    </CookieConsentProvider>
  );
}

function MyComponent() {
  const { consent, isAllowed, showSettings } = useCookieConsent();

  return (
    <>
      <ConsentGate category="analytics" fallback={<p>Analytics disabled</p>}>
        <AnalyticsComponent />
      </ConsentGate>

      <ConsentScript category="marketing" src="https://ads.example.com/pixel.js" />

      <button onClick={showSettings}>Cookie Settings</button>
    </>
  );
}
```

### Vue 3

```bash
npm install cconsent cconsent-vue
```

```typescript
import { createApp } from 'vue';
import { createCookieConsent } from 'cconsent-vue';
import 'cconsent/style.css';

const app = createApp(App);
app.use(createCookieConsent({ policyUrl: '/privacy' }));
app.mount('#app');
```

```vue
<script setup>
import { useCookieConsent } from 'cconsent-vue';

const { consent, isAllowed, showSettings } = useCookieConsent();
</script>

<template>
  <div v-if="isAllowed('analytics')">
    <AnalyticsComponent />
  </div>
  <button @click="showSettings">Cookie Settings</button>
</template>
```

### Svelte

```bash
npm install cconsent cconsent-svelte
```

```svelte
<script>
  import { onMount } from 'svelte';
  import { initCookieConsent, consent, isAllowed, showSettings } from 'cconsent-svelte';
  import 'cconsent/style.css';

  onMount(() => {
    initCookieConsent({ policyUrl: '/privacy' });
  });
</script>

{#if $consent?.analytics}
  <AnalyticsComponent />
{/if}

<button on:click={showSettings}>Cookie Settings</button>
```

## Content Customization

```javascript
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
    buttons: { save: 'Save Preferences' }
  },
  categories: {
    necessary: 'Required for security and basic functionality.',
    functional: 'Enables enhanced features like live chat and videos.',
    preferences: 'Remembers your settings like language and theme.',
    analytics: 'Helps us understand how visitors use our site.',
    marketing: 'Enables personalized ads and tracking.'
  }
}
```

## Debug Mode

```javascript
const cookieConsent = new CookieConsent({ debug: true });
```

**Debug Badge Features:**
- Shows all 5 category states
- Lists managed scripts and iframes with status
- Clear Consent, Randomize, and Export buttons
- Console logging with `[cconsent]` prefix

```javascript
const state = cookieConsent.exportDebug();
// Includes: consent, categories, scripts, iframes, geo, googleConsentMode, etc.
```

## Migration from v1

If upgrading from the 3-category model (v1), consent is automatically migrated:

- Existing `necessary`, `analytics`, `marketing` values are preserved
- New `functional` and `preferences` categories default to `false`
- Storage is updated to version `"2.0"`

For backward-compatible callbacks:

```javascript
const cookieConsent = new CookieConsent({
  legacyMode: true,  // Callbacks receive 3-category object
  onAccept: (categories) => {
    // categories: { necessary, analytics, marketing }
  }
});
```

## Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation with focus trap
- Screen reader support with ARIA live regions
- High contrast mode support
- Reduced motion support

## Mobile Behavior

- Bottom sheet pattern on viewports < 640px
- Swipe-to-dismiss (rejects non-essential cookies)
- Touch-optimized targets (48px minimum)
- Safe area support for notched devices

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  CookieConsentConfig,
  ConsentCategories,
  ConsentState,
  ConsentStatus,
  GoogleConsentModeConfig,
  GeoConfig
} from 'cconsent';
```

## License

MIT
