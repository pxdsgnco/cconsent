# Getting Started

This guide will help you install cconsent and get a basic cookie consent dialog working on your site.

## Installation

### Option 1: NPM (Recommended)

```bash
npm install cconsent
```

### Option 2: Yarn

```bash
yarn add cconsent
```

### Option 3: CDN

```html
<link rel="stylesheet" href="https://unpkg.com/cconsent/dist/style.css">
<script src="https://unpkg.com/cconsent/dist/index.umd.js"></script>
```

## Basic Setup

### ES Modules

```javascript
import CookieConsent from 'cconsent';
import 'cconsent/style.css';

const consent = new CookieConsent({
  policyUrl: '/cookie-policy'
});

consent.init();
```

### Browser (UMD)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/cookie-consent.css">
</head>
<body>
  <!-- Your content -->
  
  <script src="js/cookie-consent.js"></script>
  <script>
    const consent = new CookieConsent({
      policyUrl: '/cookie-policy'
    });
    consent.init();
  </script>
</body>
</html>
```

## Minimal Configuration

The only required option is `policyUrl`:

```javascript
const consent = new CookieConsent({
  policyUrl: 'https://yoursite.com/cookie-policy'
});

consent.init();
```

This gives you:
- A consent modal with Accept All / Reject All / Customize buttons
- 5-category consent management
- localStorage persistence
- Automatic script blocking for elements with `data-cookie-category`

## Recommended Configuration

For most production sites, we recommend enabling these additional features:

```javascript
const consent = new CookieConsent({
  policyUrl: '/cookie-policy',
  
  // Enable floating settings button (GDPR requirement)
  floatingButton: {
    enabled: true,
    position: 'bottom-right'
  },
  
  // Enable Google Consent Mode v2
  googleConsentMode: {
    enabled: true
  },
  
  // Enable geolocation detection
  geo: {
    enabled: true,
    method: 'timezone'
  },
  
  // Callbacks
  onAccept: (categories) => {
    console.log('User accepted:', categories);
  },
  onReject: (categories) => {
    console.log('User rejected:', categories);
  },
  onSave: (categories) => {
    console.log('User saved preferences:', categories);
  }
});

consent.init();
```

## Blocking Scripts

Add `data-cookie-category` to scripts and iframes that should be blocked until consent:

```html
<!-- Blocked until analytics consent -->
<script 
  data-cookie-category="analytics" 
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX">
</script>

<!-- Blocked until marketing consent -->
<iframe 
  data-cookie-category="marketing"
  src="https://www.youtube.com/embed/VIDEO_ID">
</iframe>
```

> **Important**: For inline scripts to be truly blocked, they should have `type="text/plain"` from the start. See [Script Blocking](Script-Blocking) for details.

## Testing Your Setup

Enable debug mode to see what's happening:

```javascript
const consent = new CookieConsent({
  policyUrl: '/cookie-policy',
  debug: true
});
```

This shows:
- A debug badge with category states
- Console logging with `[cconsent]` prefix
- Controls to clear, randomize, and export consent

## Next Steps

- **[Configuration](Configuration)** — Explore all configuration options
- **[Google Consent Mode v2](Google-Consent-Mode-v2)** — Integrate with GA4
- **[Script Blocking](Script-Blocking)** — Advanced blocking techniques
- **[Framework Adapters](Framework-Adapters)** — React, Vue, Svelte integration
