# Geolocation

cconsent can automatically detect user location and apply region-specific consent requirements. This enables proper compliance with GDPR (Europe), CCPA (California), LGPD (Brazil), and other privacy regulations.

## Why Geolocation?

Different regions have different consent requirements:

| Region | Law | Model | Requirement |
|--------|-----|-------|-------------|
| EU/EEA | GDPR | Opt-in | Consent required before tracking |
| California | CCPA | Opt-out | Can track until user opts out |
| Brazil | LGPD | Opt-in | Consent required before tracking |
| Other | — | None | No consent UI required |

## Basic Setup

```javascript
const consent = new CookieConsent({
  policyUrl: '/privacy',
  geo: {
    enabled: true,
    method: 'timezone'
  }
});

consent.init();
```

## Detection Methods

### Timezone Detection (Recommended)

Uses the browser's `Intl.DateTimeFormat` API to detect the user's timezone, then maps it to a country:

```javascript
geo: {
  enabled: true,
  method: 'timezone'
}
```

**Pros:**
- No external API calls
- Works offline
- Fast and reliable
- GDPR-compliant (no data leaves browser)

**Cons:**
- Not 100% accurate (timezones can span multiple countries)
- Can be spoofed by changing system timezone

### API Detection

Calls an external geolocation API to get the user's country:

```javascript
geo: {
  enabled: true,
  method: 'api',
  apiEndpoint: 'https://api.example.com/geoip',
  timeout: 500
}
```

The API should return JSON with a `country` or `countryCode` field:

```json
{ "country": "DE" }
// or
{ "countryCode": "DE" }
```

**Pros:**
- More accurate than timezone
- Can detect specific regions (e.g., US-CA)

**Cons:**
- Requires external service
- Privacy considerations (IP is sent to third party)
- May fail or timeout

### Header Detection

Reads the country from HTTP headers set by your CDN/proxy:

```javascript
geo: {
  enabled: true,
  method: 'header',
  headerName: 'CF-IPCountry'  // Cloudflare
}
```

For client-side detection, the header value must be exposed via a meta tag:

```html
<!-- Set by server -->
<meta name="user-country" content="DE">
```

Then configure:

```javascript
geo: {
  enabled: true,
  method: 'header'
  // Uses <meta name="user-country"> by default
}
```

**Pros:**
- Very accurate (CDN-level detection)
- No client-side API calls

**Cons:**
- Requires CDN or server-side support
- Must expose header to client

## Full Configuration

```javascript
geo: {
  enabled: true,
  
  // Detection method
  method: 'timezone',  // 'timezone' | 'api' | 'header'
  
  // For 'api' method
  apiEndpoint: null,
  timeout: 500,
  
  // For 'header' method
  headerName: 'CF-IPCountry',
  
  // Caching
  cache: true,
  cacheDuration: 86400000,  // 24 hours in ms
  
  // Region definitions
  regions: {
    gdpr: [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 
      'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 
      'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
      'GB', 'IS', 'LI', 'NO', 'CH'  // EEA + UK + CH
    ],
    ccpa: ['US-CA'],
    lgpd: ['BR']
  },
  
  // Consent mode by region
  modeByRegion: {
    gdpr: 'opt-in',
    ccpa: 'opt-out',
    lgpd: 'opt-in',
    default: 'none'
  }
}
```

## Consent Modes

### Opt-In Mode (GDPR)

- Consent dialog shown on first visit
- Non-essential cookies blocked by default
- User must explicitly accept before tracking

### Opt-Out Mode (CCPA)

- Consent dialog shown on first visit
- Non-essential cookies allowed by default
- "Do Not Sell My Info" replaces "Reject All"
- User can opt out at any time

### None Mode

- No consent dialog shown
- All cookies allowed
- For regions with no consent requirements

## Region Classification

cconsent maps countries to regions:

```javascript
// Built-in EU/EEA countries
const gdprCountries = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
  'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GB', 'IS', 'LI', 'NO'  // Plus UK and EEA
];

// CCPA
const ccpaRegions = ['US-CA'];

// LGPD
const lgpdCountries = ['BR'];
```

### Custom Regions

Add your own regions:

```javascript
geo: {
  regions: {
    gdpr: [...],  // Override or extend
    ccpa: ['US-CA', 'US-VA', 'US-CO'],  // Add more US states
    lgpd: ['BR'],
    custom: ['JP', 'KR']  // Define custom region
  },
  modeByRegion: {
    gdpr: 'opt-in',
    ccpa: 'opt-out',
    lgpd: 'opt-in',
    custom: 'opt-in',  // Add mode for custom region
    default: 'none'
  }
}
```

## Caching

Geolocation results are cached to avoid repeated detection:

```javascript
geo: {
  cache: true,
  cacheDuration: 86400000  // 24 hours
}
```

Cache is stored in localStorage with key `cconsent_geo`.

To clear the cache:

```javascript
localStorage.removeItem('cconsent_geo');
```

## CCPA-Specific Behavior

When CCPA mode is active (`modeByRegion.ccpa: 'opt-out'`):

1. The reject button text changes:
   - Default: "Reject All Cookies"
   - CCPA: "Do Not Sell My Info"

2. All non-essential categories default to accepted

3. User can withdraw consent via floating button

## Integration with Google Consent Mode

Combine geolocation with Google Consent Mode for region-specific defaults:

```javascript
const consent = new CookieConsent({
  geo: {
    enabled: true,
    method: 'timezone',
    modeByRegion: {
      gdpr: 'opt-in',
      ccpa: 'opt-out',
      default: 'none'
    }
  },
  googleConsentMode: {
    enabled: true,
    regionDefaults: {
      'EU': {
        ad_storage: 'denied',
        analytics_storage: 'denied'
      },
      'US': {
        ad_storage: 'granted',
        analytics_storage: 'granted'
      }
    }
  }
});
```

## Debugging

Enable debug mode to see geolocation activity:

```javascript
const consent = new CookieConsent({
  debug: true,
  geo: { enabled: true }
});
```

Console output:
```
[cconsent] Geo detection started: method=timezone
[cconsent] Detected timezone: Europe/Berlin
[cconsent] Mapped to country: DE
[cconsent] Region: gdpr, Mode: opt-in
```

## API Reference

### Getting Current Geo State

```javascript
const state = consent.exportDebug();
console.log(state.geo);
// {
//   country: 'DE',
//   region: 'gdpr',
//   mode: 'opt-in'
// }
```

## Common Issues

### Detection Returns Wrong Country

- Timezone detection can be inaccurate for border regions
- VPN users may show different locations
- Consider using API method for higher accuracy

### CCPA Mode Not Activating

- CCPA requires specific US state detection (US-CA)
- Timezone detection only identifies country, not state
- Use API method or header detection for state-level accuracy

### Cache Showing Old Location

- User may have moved or be using VPN
- Clear cache: `localStorage.removeItem('cconsent_geo')`
- Consider shorter `cacheDuration` for dynamic use cases

## Related Pages

- **[Google Consent Mode v2](Google-Consent-Mode-v2)** — Region-specific consent signals
- **[Configuration](Configuration)** — Full configuration reference
