# Cookie Consent Dialog

A lightweight, GDPR-compliant cookie consent dialog built with vanilla HTML, CSS, and JavaScript.

## Features

- Clean, modern dark theme design
- Three cookie categories: Necessary, Analytics, and Marketing
- Customizable settings panel with toggle switches
- Fully customizable text content (headings, descriptions, buttons)
- localStorage persistence across sessions
- Accessible (ARIA attributes, keyboard navigation, focus management)
- Responsive design for mobile devices
- Callback hooks for integration with your application

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
| `storageKey` | string | `'cookie_consent'` | localStorage key for storing consent |
| `policyUrl` | string | `'#'` | URL to your cookie policy page |
| `onAccept` | function | `null` | Callback when user accepts all cookies |
| `onReject` | function | `null` | Callback when user rejects non-essential cookies |
| `onSave` | function | `null` | Callback when user saves custom preferences |
| `content` | object | See below | Customize all text content in the modal |

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
| `getConsent()` | Get current consent object from localStorage |
| `resetConsent()` | Clear consent and show dialog again |
| `isAllowed(category)` | Check if a category is allowed |

### Consent Object

The consent object stored in localStorage has this structure:

```javascript
{
  necessary: true,      // Always true
  analytics: boolean,
  marketing: boolean,
  timestamp: string     // ISO date string
}
```

## Cookie Categories

| Category | Default | Toggleable | Description |
|----------|---------|------------|-------------|
| Necessary | ON | No | Required for security and basic functionality |
| Analytics | OFF | Yes | Site usage and performance tracking |
| Marketing | OFF | Yes | Personalized ads and cross-site tracking |

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
