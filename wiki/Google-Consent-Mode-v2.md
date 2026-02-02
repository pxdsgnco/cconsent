# Google Consent Mode v2

cconsent provides native integration with Google Consent Mode v2, enabling proper consent signaling to Google Analytics 4 (GA4), Google Ads, and other Google services.

## What is Google Consent Mode v2?

Google Consent Mode v2 is an API that allows you to communicate your users' consent choices to Google services. It supports:

- **analytics_storage** — Google Analytics cookies
- **ad_storage** — Advertising cookies
- **ad_user_data** — User data for advertising purposes
- **ad_personalization** — Personalized advertising

## Basic Setup

Enable Google Consent Mode with minimal configuration:

```javascript
const consent = new CookieConsent({
  policyUrl: '/privacy',
  googleConsentMode: {
    enabled: true
  }
});

consent.init();
```

This will:
1. Initialize all consent signals as `denied` on page load
2. Update signals based on user consent choices
3. Push events to `dataLayer` when consent changes

## How It Works

### Default State

When the page loads, cconsent immediately sets default denied state:

```javascript
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});
```

### On Consent Update

When the user makes a choice, cconsent updates the consent state:

```javascript
gtag('consent', 'update', {
  'ad_storage': 'granted',      // if marketing accepted
  'ad_user_data': 'granted',    // if marketing accepted
  'ad_personalization': 'granted', // if marketing accepted
  'analytics_storage': 'granted'   // if analytics accepted
});
```

## Configuration Options

```javascript
const consent = new CookieConsent({
  googleConsentMode: {
    enabled: true,
    
    // Milliseconds to wait before allowing Google tags to fire
    waitForUpdate: 500,
    
    // Map cconsent categories to Google consent signals
    mapping: {
      analytics: ['analytics_storage'],
      marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
      functional: [],
      preferences: []
    },
    
    // Redact ad data when ad_storage is denied
    adsDataRedaction: true,
    
    // Pass ad click info in URLs when ad_storage is denied
    urlPassthrough: false,
    
    // Region-specific defaults
    regionDefaults: {
      'US': { 
        ad_storage: 'granted', 
        analytics_storage: 'granted' 
      },
      'EU': { 
        ad_storage: 'denied', 
        analytics_storage: 'denied' 
      }
    }
  }
});
```

## Category-to-Signal Mapping

By default, cconsent maps categories to Google signals as follows:

| cconsent Category | Google Signals |
|-------------------|----------------|
| **analytics** | `analytics_storage` |
| **marketing** | `ad_storage`, `ad_user_data`, `ad_personalization` |
| **functional** | (none) |
| **preferences** | (none) |
| **necessary** | (always granted) |

### Custom Mapping

You can customize this mapping:

```javascript
googleConsentMode: {
  mapping: {
    analytics: ['analytics_storage'],
    marketing: ['ad_storage'],
    functional: ['ad_user_data'],  // Move to functional
    preferences: ['ad_personalization']  // Move to preferences
  }
}
```

## Ads Data Redaction

When `adsDataRedaction: true` and `ad_storage` is denied, Google will:

- Remove ad click identifiers from URLs
- Redact user data in ad requests
- Use first-party cookies with shorter lifespans

```javascript
googleConsentMode: {
  enabled: true,
  adsDataRedaction: true  // Recommended for GDPR
}
```

## URL Passthrough

When `urlPassthrough: true` and `ad_storage` is denied, Google will pass ad click information (gclid, dclid, etc.) through URL parameters instead of cookies:

```javascript
googleConsentMode: {
  enabled: true,
  urlPassthrough: true  // Enable for better conversion tracking
}
```

This helps maintain conversion tracking without setting advertising cookies.

## Region-Specific Defaults

Set different default consent states based on user region:

```javascript
googleConsentMode: {
  enabled: true,
  regionDefaults: {
    // EU: Default to denied (GDPR opt-in)
    'EU': {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    },
    
    // US: Default to granted (opt-out model)
    'US': {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    },
    
    // California: Specific rules
    'US-CA': {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    }
  }
}
```

> **Note**: Region-specific defaults require [Geolocation](Geolocation) to be enabled.

## DataLayer Events

When consent changes, cconsent pushes an event to `dataLayer`:

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

You can use this event in Google Tag Manager to trigger tags based on consent.

## Integration with Google Tag Manager

### gtag.js Setup

Make sure you load gtag.js before initializing cconsent:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  // Don't configure yet - cconsent will handle consent
</script>

<!-- Cookie Consent -->
<script src="cookie-consent.js"></script>
<script>
  const consent = new CookieConsent({
    policyUrl: '/privacy',
    googleConsentMode: { enabled: true }
  });
  consent.init();
  
  // Now configure GA4
  gtag('config', 'G-XXXXX');
</script>
```

### Google Tag Manager Setup

1. In GTM, go to **Admin → Container Settings**
2. Enable **"Enable consent overview"**
3. Configure your tags to require appropriate consent:
   - GA4 tags: Require `analytics_storage`
   - Ads tags: Require `ad_storage`

cconsent will automatically signal consent state to GTM via the `dataLayer`.

## Debugging

Enable debug mode to see Google Consent Mode activity:

```javascript
const consent = new CookieConsent({
  debug: true,
  googleConsentMode: { enabled: true }
});
```

Console output:
```
[cconsent] Google Consent Mode initialized: { ad_storage: 'denied', ... }
[cconsent] Google Consent Mode updated: { ad_storage: 'granted', ... }
```

You can also check the current state:

```javascript
const state = consent.exportDebug();
console.log(state.googleConsentMode);
```

## Common Issues

### Consent Not Updating

If consent signals aren't updating:

1. Ensure `gtag()` function is defined before cconsent loads
2. Check that `window.dataLayer` exists
3. Verify `googleConsentMode.enabled` is `true`

### Tags Firing Before Consent

If tags fire before the user makes a choice:

1. Increase `waitForUpdate` value (default: 500ms)
2. Ensure cconsent initializes before GA4 config
3. Check that default state is being set

### Region Defaults Not Working

Region-specific defaults require geolocation to be enabled:

```javascript
const consent = new CookieConsent({
  geo: {
    enabled: true,
    method: 'timezone'
  },
  googleConsentMode: {
    enabled: true,
    regionDefaults: { ... }
  }
});
```

## Related Pages

- **[Geolocation](Geolocation)** — Enable region detection
- **[Configuration](Configuration)** — Full configuration reference
- **[Script Blocking](Script-Blocking)** — Block Google scripts until consent
