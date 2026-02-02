# Troubleshooting

Common issues and solutions when using cconsent.

## Installation Issues

### Module Not Found

**Error:**
```
Cannot find module 'cconsent' or its corresponding type declarations
```

**Solutions:**
1. Download the package from [GitHub Releases](https://github.com/pxdsgnco/cconsent/releases)

2. Check your import path:
   ```javascript
   // Correct
   import CookieConsent from 'cconsent';
   
   // Wrong
   import CookieConsent from 'cconsent/dist/index';
   ```

3. For TypeScript, ensure `moduleResolution` is set correctly:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node"
     }
   }
   ```

### CSS Not Loading

**Issue:** Modal appears unstyled or invisible.

**Solutions:**
1. Link the CSS in HTML:
   ```html
   <link rel="stylesheet" href="css/cookie-consent.css">
   ```

2. Check for CSS conflicts:
   ```css
   /* Your styles might override cconsent */
   .cc-modal { display: block !important; }
   ```

---

## Consent Modal Issues

### Modal Doesn't Show

**Possible causes:**

1. **Consent already stored:**
   ```javascript
   // Check if consent exists
   console.log(localStorage.getItem('cookie_consent'));
   
   // Clear to test
   localStorage.removeItem('cookie_consent');
   ```

2. **init() not called:**
   ```javascript
   const consent = new CookieConsent({ policyUrl: '/privacy' });
   consent.init();  // Don't forget this!
   ```

3. **Geolocation mode is "none":**
   ```javascript
   // If user is in a region with modeByRegion: 'none', no modal shows
   geo: {
     enabled: true,
     modeByRegion: {
       default: 'opt-in'  // Change from 'none' to show modal everywhere
     }
   }
   ```

### Modal Shows on Every Page Load

**Cause:** Consent not being saved properly.

**Solutions:**
1. Check storage method:
   ```javascript
   // localStorage (default)
   console.log(localStorage.getItem('cookie_consent'));
   
   // or cookie storage
   console.log(document.cookie);
   ```

2. Ensure no code is calling `resetConsent()` on load.

3. Check for storage quota errors in console.

### Modal Flashes Then Disappears

**Cause:** Geolocation detecting a "none" mode region.

**Solution:**
```javascript
geo: {
  enabled: true,
  modeByRegion: {
    gdpr: 'opt-in',
    ccpa: 'opt-out',
    default: 'opt-in'  // Don't use 'none' if you always want a modal
  }
}
```

---

## Script Blocking Issues

### Script Executes Before Consent

**Cause:** Inline script without `type="text/plain"`.

**Wrong:**
```html
<script data-cookie-category="analytics">
  // This executes immediately!
  trackPageView();
</script>
```

**Correct:**
```html
<script type="text/plain" data-cookie-category="analytics">
  // Now this is blocked until consent
  trackPageView();
</script>
```

### Script Never Executes After Consent

**Possible causes:**

1. **Script not re-scanned:**
   ```javascript
   // Force re-scan
   window.CookieConsent.scanScripts();
   ```

2. **Category mismatch:**
   ```html
   <!-- Make sure category matches what user consented to -->
   <script data-cookie-category="analytics">  <!-- not "analytic" -->
   ```

3. **Script error after loading:**
   ```javascript
   // Check console for errors after consent
   // The script might load but fail to execute due to other issues
   ```

### Dynamically Added Scripts Not Blocked

**Cause:** Script added without `data-cookie-category`.

**Solution:**
```javascript
const script = document.createElement('script');
script.setAttribute('data-cookie-category', 'analytics');  // Add this!
script.src = 'https://analytics.example.com/script.js';
document.body.appendChild(script);
```

---

## Google Consent Mode Issues

### gtag Not Defined

**Error:**
```
ReferenceError: gtag is not defined
```

**Solution:** Load gtag.js before cconsent:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>

<!-- Then cconsent -->
<script src="cookie-consent.js"></script>
```

### Consent Not Updating in Google

**Solutions:**

1. Ensure Google Consent Mode is enabled:
   ```javascript
   googleConsentMode: {
     enabled: true  // Must be true
   }
   ```

2. Check dataLayer events:
   ```javascript
   // After consent
   console.log(window.dataLayer);
   // Should see gtag consent update events
   ```

3. Verify in Google Tag Assistant or Analytics debugger.

### Region Defaults Not Working

**Cause:** Geolocation not enabled.

**Solution:**
```javascript
const consent = new CookieConsent({
  geo: {
    enabled: true,  // Required for regionDefaults
    method: 'timezone'
  },
  googleConsentMode: {
    enabled: true,
    regionDefaults: {
      'EU': { ad_storage: 'denied' }
    }
  }
});
```

---

## Geolocation Issues

### Wrong Country Detected

**Cause:** Timezone detection is approximate.

**Solutions:**

1. Use API detection for better accuracy:
   ```javascript
   geo: {
     method: 'api',
     apiEndpoint: 'https://your-geoip-api.com/json'
   }
   ```

2. Or use CDN headers:
   ```javascript
   geo: {
     method: 'header',
     headerName: 'CF-IPCountry'  // Cloudflare
   }
   ```

### CCPA Mode Not Activating

**Cause:** State-level detection required but using timezone.

**Solution:** Timezone only detects country. For US states, use API:
```javascript
geo: {
  method: 'api',
  apiEndpoint: 'https://api.example.com/geoip',
  regions: {
    ccpa: ['US-CA', 'US-VA', 'US-CO']
  }
}
```

### Geolocation Cache Stale

**Solution:**
```javascript
// Clear cache
localStorage.removeItem('cconsent_geo');

// Or disable caching
geo: {
  enabled: true,
  cache: false
}
```

---

## Framework Adapter Issues

### React: useCookieConsent Returns Undefined

**Cause:** Component not wrapped in provider.

**Solution:**
```tsx
// App.tsx
<CookieConsentProvider config={{ policyUrl: '/privacy' }}>
  <YourApp />  {/* useCookieConsent works here */}
</CookieConsentProvider>
```

### Vue: composable not working

**Cause:** Plugin not registered.

**Solution:**
```typescript
// main.ts
import { createCookieConsent } from 'cconsent-vue';

app.use(createCookieConsent({ policyUrl: '/privacy' }));
```

### Svelte: Stores are null

**Cause:** `initCookieConsent` not called.

**Solution:**
```svelte
<script>
  import { onMount } from 'svelte';
  import { initCookieConsent } from 'cconsent-svelte';

  onMount(() => {
    initCookieConsent({ policyUrl: '/privacy' });
  });
</script>
```

### SSR Hydration Mismatch

**Cause:** Consent state differs between server and client.

**Solution:** Wrap consent-dependent UI:
```jsx
// React
{consent !== null && (
  <div>Analytics: {isAllowed('analytics') ? 'Yes' : 'No'}</div>
)}
```

```vue
<!-- Vue -->
<div v-if="consent">
  Analytics: {{ isAllowed('analytics') ? 'Yes' : 'No' }}
</div>
```

---

## Styling Issues

### Modal Behind Other Elements

**Solution:**
```css
.cc-modal-overlay {
  z-index: 99999 !important;
}
```

### Mobile Bottom Sheet Not Working

**Cause:** Viewport meta tag missing.

**Solution:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Dark/Light Theme Conflict

**Solution:** Override CSS variables:
```css
/* Force dark theme */
.cc-modal {
  --cc-bg: #1a1a1a;
  --cc-text: #ffffff;
}

/* Force light theme */
.cc-modal {
  --cc-bg: #ffffff;
  --cc-text: #1a1a1a;
}
```

---

## Debug Mode

Enable debug mode to diagnose issues:

```javascript
const consent = new CookieConsent({
  debug: true,
  policyUrl: '/privacy'
});
```

This provides:
- Console logging with `[cconsent]` prefix
- Debug badge showing all states
- Export function for state inspection

### Export Debug State

```javascript
const state = consent.exportDebug();
console.log(JSON.stringify(state, null, 2));
```

---

## Getting Help

If you can't solve your issue:

1. **Check debug output** with `debug: true`
2. **Search existing issues** on [GitHub](https://github.com/pxdsgnco/cconsent/issues)
3. **Open a new issue** with:
   - cconsent version
   - Browser and version
   - Minimal reproduction code
   - Debug export output

## Related Pages

- **[Configuration](Configuration)** — Check your config options
- **[API Reference](API-Reference)** — Verify method usage
- **[Script Blocking](Script-Blocking)** — Script blocking details
- **[Migration Guide](Migration-Guide)** — v1 to v2 changes
