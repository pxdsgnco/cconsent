# cconsent Documentation

Welcome to the cconsent wiki! This documentation covers everything you need to implement GDPR-compliant cookie consent on your website.

## What is cconsent?

cconsent is a lightweight, zero-dependency cookie consent library that helps you:

- ✅ Comply with GDPR, CCPA, and LGPD regulations
- ✅ Integrate with Google Consent Mode v2 for GA4 and Google Ads
- ✅ Automatically block scripts and iframes until consent is given
- ✅ Detect user location and apply region-specific consent modes
- ✅ Provide a beautiful, accessible consent UI

## Quick Navigation

### Getting Started
- **[Getting Started](Getting-Started)** — Installation, basic setup, and first steps

### Core Features
- **[Configuration](Configuration)** — Full reference of all configuration options
- **[Google Consent Mode v2](Google-Consent-Mode-v2)** — Integrate with Google Analytics 4 and Google Ads
- **[Geolocation](Geolocation)** — Auto-detect user regions and apply consent modes
- **[Script Blocking](Script-Blocking)** — Block scripts/iframes based on consent

### Framework Integration
- **[Framework Adapters](Framework-Adapters)** — Overview of React, Vue, and Svelte support
  - [React Adapter](React-Adapter)
  - [Vue Adapter](Vue-Adapter)
  - [Svelte Adapter](Svelte-Adapter)

### Reference
- **[API Reference](API-Reference)** — Complete API documentation
- **[Migration Guide](Migration-Guide)** — Upgrading from v1 to v2
- **[Troubleshooting](Troubleshooting)** — Common issues and solutions

## Consent Categories

cconsent uses a 5-category consent model:

| Category | Default | Toggleable | Description |
|----------|---------|------------|-------------|
| **Necessary** | ON | No | Required for security and basic functionality |
| **Functional** | OFF | Yes | Enhanced features like live chat and videos |
| **Preferences** | OFF | Yes | Remembers settings like language and theme |
| **Analytics** | OFF | Yes | Site usage and performance tracking |
| **Marketing** | OFF | Yes | Personalized ads and cross-site tracking |

## Browser Support

cconsent works in all modern browsers:
- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

## Need Help?

- 📖 Check the [Troubleshooting](Troubleshooting) guide
- 🐛 Report issues on [GitHub Issues](https://github.com/pxdsgnco/cconsent/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/pxdsgnco/cconsent/discussions)
