# Migration Guide

This guide helps you upgrade from cconsent v1 (3-category model) to v2 (5-category model).

## What's New in v2

### 5-Category Model

v1 had 3 categories:
- Necessary
- Analytics
- Marketing

v2 adds 2 new categories:
- **Functional** — Enhanced features like live chat, video embeds
- **Preferences** — User settings like language, theme

### Automatic Migration

cconsent automatically migrates stored consent from v1 to v2:

| v1 Value | v2 Value |
|----------|----------|
| `necessary: true` | `necessary: true` |
| `analytics: true/false` | `analytics: true/false` (preserved) |
| `marketing: true/false` | `marketing: true/false` (preserved) |
| — | `functional: false` (new, defaults to off) |
| — | `preferences: false` (new, defaults to off) |

The storage version is updated from `"1.0"` to `"2.0"`.

## Breaking Changes

### Consent Object Shape

**v1:**
```javascript
{
  version: "1.0",
  necessary: true,
  analytics: boolean,
  marketing: boolean,
  timestamp: string
}
```

**v2:**
```javascript
{
  version: "2.0",
  necessary: true,
  functional: boolean,   // NEW
  preferences: boolean,  // NEW
  analytics: boolean,
  marketing: boolean,
  timestamp: string,
  consentId?: string     // NEW (if enabled)
}
```

### Callback Parameters

Callbacks now receive 5 categories instead of 3:

**v1:**
```javascript
onAccept: (categories) => {
  // categories: { necessary, analytics, marketing }
}
```

**v2:**
```javascript
onAccept: (categories) => {
  // categories: { necessary, functional, preferences, analytics, marketing }
}
```

## Using Legacy Mode

If you need backward-compatible callbacks temporarily, enable legacy mode:

```javascript
const consent = new CookieConsent({
  policyUrl: '/privacy',
  legacyMode: true,
  
  onAccept: (categories) => {
    // Still receives 3-category object:
    // { necessary, analytics, marketing }
  }
});
```

> **Note:** Legacy mode only affects callback parameters. The stored consent and UI still use the 5-category model.

## Migration Checklist

### 1. Update Callbacks

If you process consent in callbacks, update them to handle new categories:

**Before:**
```javascript
onSave: (categories) => {
  if (categories.analytics) enableAnalytics();
  if (categories.marketing) enableMarketing();
}
```

**After:**
```javascript
onSave: (categories) => {
  if (categories.functional) enableFunctional();
  if (categories.preferences) enablePreferences();
  if (categories.analytics) enableAnalytics();
  if (categories.marketing) enableMarketing();
}
```

### 2. Update Script Categories

Review your blocked scripts and assign appropriate categories:

**Scripts that might be "Functional":**
- Chat widgets (Intercom, Zendesk)
- Video embeds (YouTube, Vimeo)
- Payment processors
- Social share buttons

**Scripts that might be "Preferences":**
- Language/locale detection
- Theme/dark mode persistence
- Accessibility settings

```html
<!-- Before: lumped into marketing -->
<script data-cookie-category="marketing" src="https://chat.example.com/widget.js"></script>

<!-- After: properly categorized -->
<script data-cookie-category="functional" src="https://chat.example.com/widget.js"></script>
```

### 3. Update isAllowed() Checks

If you check consent programmatically, add checks for new categories:

```javascript
// Add checks for new categories
if (consent.isAllowed('functional')) {
  loadChatWidget();
}

if (consent.isAllowed('preferences')) {
  loadLanguageDetection();
}
```

### 4. Update Server-Side Processing

If you store consent server-side, update your schema:

**Before:**
```sql
CREATE TABLE consent (
  id UUID PRIMARY KEY,
  necessary BOOLEAN,
  analytics BOOLEAN,
  marketing BOOLEAN,
  timestamp TIMESTAMP
);
```

**After:**
```sql
CREATE TABLE consent (
  id UUID PRIMARY KEY,
  necessary BOOLEAN,
  functional BOOLEAN,    -- NEW
  preferences BOOLEAN,   -- NEW
  analytics BOOLEAN,
  marketing BOOLEAN,
  timestamp TIMESTAMP,
  consent_id UUID        -- NEW (if using generateConsentId)
);
```

### 5. Update Analytics Events

If you track consent in analytics, add new events:

```javascript
onSave: (categories) => {
  gtag('event', 'consent_update', {
    functional: categories.functional,
    preferences: categories.preferences,
    analytics: categories.analytics,
    marketing: categories.marketing
  });
}
```

## New Features to Consider

### Generate Consent IDs

Track consent records with unique IDs:

```javascript
const consent = new CookieConsent({
  generateConsentId: true
});

// Access the ID
const { consentId } = consent.getConsent();
// "550e8400-e29b-41d4-a716-446655440000"
```

### Google Consent Mode v2

New in v2, native Google Consent Mode integration:

```javascript
const consent = new CookieConsent({
  googleConsentMode: {
    enabled: true,
    adsDataRedaction: true,
    urlPassthrough: true
  }
});
```

### Geolocation Detection

Automatically detect user region and apply appropriate consent mode:

```javascript
const consent = new CookieConsent({
  geo: {
    enabled: true,
    method: 'timezone',
    modeByRegion: {
      gdpr: 'opt-in',
      ccpa: 'opt-out'
    }
  }
});
```

### Floating Settings Button

GDPR-compliant settings button:

```javascript
const consent = new CookieConsent({
  floatingButton: {
    enabled: true,
    position: 'bottom-right',
    showIndicator: true
  }
});
```

## Gradual Migration

If you can't update everything at once:

### Phase 1: Enable v2 with Legacy Mode

```javascript
const consent = new CookieConsent({
  policyUrl: '/privacy',
  legacyMode: true  // Callbacks still receive 3 categories
});
```

### Phase 2: Update Callbacks

```javascript
const consent = new CookieConsent({
  policyUrl: '/privacy',
  legacyMode: false,  // Now receives 5 categories
  
  onSave: (categories) => {
    // Handle all 5 categories
  }
});
```

### Phase 3: Categorize Scripts

Update your `data-cookie-category` attributes to use `functional` and `preferences` where appropriate.

### Phase 4: Enable New Features

Add Google Consent Mode, geolocation, floating button, etc.

## Rollback

If you need to rollback to v1:

1. Install the previous version:
   ```bash
   npm install cconsent@1.x
   ```

2. Existing v2 consent will be ignored (version mismatch)
3. Users will be prompted for consent again

## Getting Help

- Check the [Troubleshooting](Troubleshooting) page
- Review the [API Reference](API-Reference)
- Open an issue on [GitHub](https://github.com/pxdsgnco/cconsent/issues)

## Related Pages

- **[Configuration](Configuration)** — Full options reference
- **[Getting Started](Getting-Started)** — Fresh installation guide
- **[API Reference](API-Reference)** — Complete API documentation
