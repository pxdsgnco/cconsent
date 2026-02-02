# cconsent

A lightweight, GDPR-compliant cookie consent library with Google Consent Mode v2, geolocation-based consent, and framework adapters for React, Vue, and Svelte.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **5-Category Consent Model** — Necessary, Functional, Preferences, Analytics, Marketing
- **Google Consent Mode v2** — Native GA4 and Google Ads integration
- **Geolocation Detection** — Auto-detect GDPR, CCPA, LGPD regions
- **Script Blocking** — Automatic blocking via `data-cookie-category` attributes
- **Framework Adapters** — React, Vue 3, and Svelte support
- **Accessible** — WCAG 2.1 AA compliant with keyboard navigation
- **Mobile-First** — Bottom sheet pattern with swipe gestures
- **Zero Dependencies** — Vanilla JS, < 15KB gzipped
- **TypeScript Support** — Full type definitions included

## 📦 Installation

### Download

Download the latest release from [GitHub Releases](https://github.com/pxdsgnco/cconsent/releases).

### Direct Include

```html
<link rel="stylesheet" href="css/cookie-consent.css">
<script src="js/cookie-consent.js"></script>
```

## 🚀 Quick Start

```javascript
import CookieConsent from 'cconsent';
import 'cconsent/style.css';

const consent = new CookieConsent({
  policyUrl: '/cookie-policy',
  googleConsentMode: { enabled: true },
  floatingButton: { enabled: true },
  onAccept: (categories) => console.log('Accepted:', categories),
  onReject: (categories) => console.log('Rejected:', categories),
  onSave: (categories) => console.log('Saved:', categories)
});

consent.init();
```

### Block Scripts Until Consent

```html
<!-- Blocked until analytics consent is given -->
<script data-cookie-category="analytics" src="https://analytics.example.com/script.js"></script>

<!-- Blocked until marketing consent is given -->
<iframe data-cookie-category="marketing" src="https://ads.example.com/widget"></iframe>
```

## 🧩 Framework Adapters

Framework adapters for React, Vue, and Svelte are available. See the [Framework Adapters](../../wiki/Framework-Adapters) documentation for setup instructions.

## 📖 Documentation

For comprehensive documentation, visit the **[Wiki](../../wiki)**:

- **[Getting Started](../../wiki/Getting-Started)** — Installation and basic setup
- **[Configuration](../../wiki/Configuration)** — Full options reference
- **[Google Consent Mode v2](../../wiki/Google-Consent-Mode-v2)** — GA4 and Ads integration
- **[Geolocation](../../wiki/Geolocation)** — Region detection and consent modes
- **[Script Blocking](../../wiki/Script-Blocking)** — Multi-category, negation, placeholders
- **[Framework Adapters](../../wiki/Framework-Adapters)** — React, Vue, Svelte deep dives
- **[API Reference](../../wiki/API-Reference)** — Methods and properties
- **[Migration Guide](../../wiki/Migration-Guide)** — Upgrading from v1

## 🔧 Global API

```javascript
window.CookieConsent.show();           // Show consent modal
window.CookieConsent.showSettings();   // Open settings view
window.CookieConsent.hide();           // Hide modal
window.CookieConsent.getConsent();     // Get current consent state
window.CookieConsent.isAllowed('analytics');  // Check category
window.CookieConsent.resetConsent();   // Clear stored consent
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 📄 License

MIT © pxdsgnco
