# Cookie Consent Dialog

A lightweight, GDPR-compliant cookie consent dialog built with vanilla HTML, CSS, and JavaScript.

## Features

- Clean, modern dark theme design
- Three cookie categories: Necessary, Analytics, and Marketing
- Customizable settings panel with toggle switches
- Fully customizable text content (headings, descriptions, buttons)
- Flexible storage: localStorage or cookies with configurable options
- Optional Base64 encoding for consent data
- Consent ID generation for server-side tracking
- Accessible (WCAG 2.1 AA compliant - see Accessibility section)
- Responsive design for mobile devices
- Smooth animations and micro-interactions
- Callback hooks for integration with your application (supports async callbacks)

## Installation

1. Copy the `css/` and `js/` folders to your project
2. Include the stylesheet and script in your HTML:

```html
<link rel="stylesheet" href="css/cookie-consent.css">
<script src="js/cookie-consent.js"></script>
```

3. Initialize the consent dialog:

```javascript
const cookieConsent = new CookieConsent({
  policyUrl: 'https://yoursite.com/cookie-policy',
  onAccept: (categories) => {
    // User accepted all cookies
    console.log('Accepted:', categories);
  },
  onReject: (categories) => {
    // User rejected non-essential cookies
    console.log('Rejected:', categories);
  },
  onSave: (categories) => {
    // User saved custom preferences
    console.log('Saved:', categories);
  }
});

cookieConsent.init();
```

## API

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storageKey` | string | `'cookie_consent'` | Key for storing consent (localStorage or cookie name) |
| `storageMethod` | string | `'localStorage'` | Storage method: `'localStorage'` or `'cookie'` |
| `cookieOptions` | object | See below | Cookie configuration when using cookie storage |
| `encryption` | boolean | `false` | Enable Base64 encoding for stored consent data |
| `generateConsentId` | boolean | `false` | Generate unique UUID for each consent record |
| `policyUrl` | string | `'#'` | URL to your cookie policy page |
| `debug` | boolean | `false` | Enable debug mode with visual indicators |
| `onAccept` | function | `null` | Callback when user accepts all cookies (can be async) |
| `onReject` | function | `null` | Callback when user rejects non-essential cookies (can be async) |
| `onSave` | function | `null` | Callback when user saves custom preferences (can be async) |
| `content` | object | See below | Customize all text content in the modal |
| `floatingButton` | object | See below | Floating settings button configuration |

### Cookie Storage Options

When using `storageMethod: 'cookie'`, you can configure cookie attributes:

```javascript
const cookieConsent = new CookieConsent({
  storageMethod: 'cookie',
  cookieOptions: {
    sameSite: 'Strict',  // 'Strict', 'Lax', or 'None'
    secure: true,        // Only send over HTTPS
    domain: null,        // Cookie domain (null = current domain)
    path: '/',           // Cookie path
    expires: 365         // Days until expiration
  }
});
```

**Default cookie options:**

| Option | Default | Description |
|--------|---------|-------------|
| `sameSite` | `'Strict'` | SameSite attribute for CSRF protection |
| `secure` | `true` | Only transmit over HTTPS |
| `domain` | `null` | Cookie domain (current domain if null) |
| `path` | `'/'` | Cookie path |
| `expires` | `365` | Expiration in days |

### Encryption & Consent ID

Enable Base64 encoding and consent ID generation for enhanced tracking:

```javascript
const cookieConsent = new CookieConsent({
  storageMethod: 'cookie',
  encryption: true,         // Base64 encode the consent data
  generateConsentId: true,  // Generate unique UUID for each consent
  onSave: async (categories) => {
    // Send consent to your server with the consent ID
    const consent = cookieConsent.getConsent();
    await fetch('/api/consent', {
      method: 'POST',
      body: JSON.stringify({
        consentId: consent.consentId,
        categories
      })
    });
  }
});
```

**Security Notes:**
- `encryption: true` uses Base64 encoding for light obfuscation, not cryptographic security
- HttpOnly cookies cannot be set via JavaScript - use server-side for true HttpOnly cookies
- The consent ID is a UUID v4 suitable for server-side consent record keeping

### Floating Settings Button (GDPR Compliance)

GDPR Article 7(3) requires consent withdrawal to be as easy as giving consent. The floating button provides persistent access to cookie settings:

```javascript
const cookieConsent = new CookieConsent({
  floatingButton: {
    enabled: true,
    position: 'bottom-right', // 'bottom-left' | 'bottom-right'
    icon: 'cookie',           // 'cookie' | 'shield' | 'gear' | custom SVG
    label: 'Cookie Settings',
    showIndicator: true,      // Show status dot with active count
    offset: { x: 20, y: 20 }  // Distance from edges in pixels
  }
});
```

**Features:**
- Appears only after initial consent decision
- Status indicator shows current state:
  - 🟢 Green: All cookies accepted
  - 🟡 Yellow: Partial consent
  - 🔴 Red: Essential only
- Badge shows number of active categories (1-3)
- Automatically hides when modal is open

### Global API

After initialization, a global API is exposed on `window.CookieConsent`:

```javascript
// Show the consent dialog
window.CookieConsent.show();

// Show settings view directly
window.CookieConsent.showSettings();

// Hide the dialog
window.CookieConsent.hide();

// Get current consent object
const consent = window.CookieConsent.getConsent();

// Check if a category is allowed
if (window.CookieConsent.isAllowed('analytics')) {
  // Load analytics...
}

// Get status: 'all' | 'partial' | 'essential'
const status = window.CookieConsent.getStatus();

// Reset consent and show dialog
window.CookieConsent.resetConsent();
```

### Auto-binding Elements

Any element with `data-cc-open` attribute will automatically open the consent dialog when clicked:

```html
<a href="#" data-cc-open>Manage Cookie Preferences</a>
<button data-cc-open>Privacy Settings</button>
```

This makes it easy to add "Cookie Settings" links in footers or privacy pages without writing JavaScript.

### Storage Migration

When switching from localStorage to cookies, existing consent is automatically migrated:

```javascript
// Previously used localStorage (default)
const oldConsent = new CookieConsent();

// Now switching to cookies - existing consent migrates automatically
const newConsent = new CookieConsent({
  storageMethod: 'cookie'
});
```

### Content Customization

You can customize all text in the modal by passing a `content` object. Any fields you don't specify will use the defaults. This uses deep merging, so you can override just the fields you need.

```javascript
const cookieConsent = new CookieConsent({
  policyUrl: 'https://yoursite.com/privacy',
  content: {
    // Initial view (first screen)
    initialView: {
      heading: 'Cookie settings',
      description: {
        text: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. Read our ',
        linkText: 'Cookie Policy',
        suffix: ' to learn more.'
      },
      buttons: {
        customize: 'Customize Cookie Settings',
        rejectAll: 'Reject All Cookies',
        acceptAll: 'Accept All Cookies'
      }
    },
    // Settings view (category toggles)
    settingsView: {
      heading: 'Cookie settings',
      description: 'Manage your cookie preferences below. Necessary cookies are required for the website to function and cannot be disabled.',
      buttons: {
        save: 'Save Preferences'
      }
    },
    // Category descriptions (names are not customizable)
    categories: {
      necessary: 'Enables security and basic functionality.',
      analytics: 'Enables tracking of site performance.',
      marketing: 'Enables ads personalization and tracking.'
    }
  }
});
```

**Partial overrides** - Only specify what you want to change:

```javascript
const cookieConsent = new CookieConsent({
  content: {
    initialView: {
      heading: 'Privacy Preferences'  // Only change the heading
    },
    categories: {
      analytics: 'Helps us understand how visitors use our site.'
    }
  }
});
```

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Initialize and show dialog if no consent exists |
| `show()` | Show the consent dialog |
| `hide()` | Hide the consent dialog |
| `showSettings()` | Switch to settings view |
| `showInitial()` | Switch to initial view |
| `acceptAll()` | Accept all cookies and close |
| `rejectAll()` | Reject non-essential cookies and close |
| `savePreferences()` | Save current toggle states and close |
| `getConsent()` | Get current consent object from storage |
| `resetConsent()` | Clear consent and show dialog again |
| `isAllowed(category)` | Check if a category is allowed |
| `exportDebug()` | Export debug state snapshot (debug mode) |

### Consent Object

The consent object stored in storage has this structure:

```javascript
{
  necessary: true,      // Always true
  analytics: boolean,
  marketing: boolean,
  timestamp: string,    // ISO date string
  consentId: string     // UUID (only if generateConsentId: true)
}
```

## Cookie Categories

| Category | Default | Toggleable | Description |
|----------|---------|------------|-------------|
| Necessary | ON | No | Required for security and basic functionality |
| Analytics | OFF | Yes | Site usage and performance tracking |
| Marketing | OFF | Yes | Personalized ads and cross-site tracking |

## Script Blocking

Scripts can be automatically blocked until the user gives consent. Add a `data-cookie-category` attribute to any script tag:

```html
<!-- These scripts will be blocked until consent is given -->
<script data-cookie-category="analytics" src="https://analytics.example.com/script.js"></script>
<script data-cookie-category="marketing" src="https://ads.example.com/pixel.js"></script>

<!-- Necessary scripts load normally (no attribute needed) -->
<script src="https://example.com/essential.js"></script>
```

When the page loads:
1. Scripts with `data-cookie-category` are scanned and blocked (src removed)
2. When consent is given for a category, scripts are loaded dynamically
3. This works for both external scripts (with `src`) and inline scripts

## Debug Mode

Enable debug mode during development to visualize consent state and script blocking:

```javascript
const cookieConsent = new CookieConsent({
  debug: true,  // Enable debug mode
  // ... other options
});
```

### Debug Features

**Visual Debug Badge**
- Floating badge in bottom-left corner showing current consent state
- Real-time updates when consent changes
- Click header to collapse/expand

**Console Logging**
- Styled console logs for all state changes
- Logs when scripts are blocked/allowed
- Prefix: `[cconsent]`

**Scripts Table**
- Shows all managed scripts with their category and status
- Status indicators: 🟢 Loaded, 🔴 Blocked, ⏳ Pending

**Simulation Buttons**
- **Clear Consent**: Reset consent and show dialog again
- **Randomize**: Set random analytics/marketing values (for testing)
- **Export**: Copy debug state to clipboard as JSON

### exportDebug() Method

Get a complete state snapshot:

```javascript
const debugState = cookieConsent.exportDebug();
console.log(debugState);
// {
//   consent: { necessary: true, analytics: false, marketing: false, timestamp: "...", consentId: "..." },
//   categories: { necessary: true, analytics: false, marketing: false },
//   scripts: [
//     { src: "analytics.js", category: "analytics", status: "blocked" },
//     { src: "ads.js", category: "marketing", status: "blocked" }
//   ],
//   timestamp: "2024-01-15T10:30:00.000Z",
//   storageKey: "cookie_consent",
//   storageMethod: "localStorage",
//   encryption: false,
//   consentId: null,
//   debugEnabled: true
// }
```

## Accessibility

This component is built with WCAG 2.1 AA compliance in mind.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous interactive element |
| `Enter/Space` | Activate buttons and toggles |
| `Escape` | Close modal and reject non-essential cookies |

### Focus Management

- **Focus Trap**: When the modal is open, Tab/Shift+Tab cycles only through elements within the modal
- **Focus Restoration**: When the modal closes, focus returns to the element that triggered it
- **Initial Focus**: Focus is automatically set to the first interactive element when the modal opens

### Screen Reader Support

- Modal has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes
- Toggle switches have `role="switch"` and `aria-checked` attributes that update dynamically
- ARIA live region announces preference changes (e.g., "Cookie preferences saved")
- Descriptive labels on all interactive elements

### High Contrast Mode

The component supports Windows High Contrast Mode and other forced-colors environments:

- All borders use system color keywords (`CanvasText`, `ButtonText`)
- Toggle states are distinguishable in high contrast
- Links use `LinkText` color

### Reduced Motion

Animations are disabled when `prefers-reduced-motion: reduce` is set in the user's system preferences.

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
