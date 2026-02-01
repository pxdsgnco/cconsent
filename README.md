# Cookie Consent Dialog

A lightweight, GDPR-compliant cookie consent dialog built with vanilla HTML, CSS, and JavaScript.

## Features

- Clean, modern dark theme design
- Three cookie categories: Necessary, Analytics, and Marketing
- Customizable settings panel with toggle switches
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
