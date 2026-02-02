# Script Blocking

cconsent can automatically block scripts and iframes until the user grants consent for the appropriate category. This is essential for GDPR compliance, where tracking scripts should not execute before consent.

## How It Works

1. **Initial Scan**: On initialization, cconsent scans the DOM for elements with `data-cookie-category`
2. **Blocking**: Scripts are converted to `type="text/plain"`, iframes have their `src` replaced
3. **Observation**: MutationObserver watches for dynamically added elements
4. **Unblocking**: When consent is granted, scripts execute and iframes load

## Basic Usage

Add `data-cookie-category` to any script or iframe:

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

## Inline Scripts

For inline scripts, you **must** add `type="text/plain"` from the start:

```html
<!-- ✅ Correct: Will be blocked -->
<script type="text/plain" data-cookie-category="analytics">
  console.log('This runs only after analytics consent');
  gtag('event', 'page_view');
</script>

<!-- ❌ Wrong: Will execute immediately, then cconsent tries to block (too late!) -->
<script data-cookie-category="analytics">
  console.log('This runs immediately!');
</script>
```

> **Why?** The browser executes inline scripts immediately when parsing HTML. By the time cconsent scans the DOM, the script has already run. Using `type="text/plain"` prevents execution.

## Categories

Use any of the 5 consent categories:

| Category | Attribute Value |
|----------|-----------------|
| Necessary | `necessary` (always allowed) |
| Functional | `functional` |
| Preferences | `preferences` |
| Analytics | `analytics` |
| Marketing | `marketing` |

## Multi-Category Support

### OR Logic (Any Category)

Scripts can require any of multiple categories (OR logic):

```html
<!-- Loads if EITHER analytics OR marketing is consented -->
<script 
  data-cookie-category="analytics marketing" 
  src="https://example.com/combo-script.js">
</script>
```

### Negation

Block scripts when a category is **not** consented:

```html
<!-- Loads only if marketing is NOT consented -->
<script 
  data-cookie-category="!marketing" 
  src="https://privacy-focused-analytics.com/script.js">
</script>
```

### Complex Rules

Combine multiple conditions:

```html
<!-- Loads if (analytics OR marketing) AND NOT preferences -->
<script data-cookie-category="analytics marketing !preferences" src="..."></script>
```

## Blocked Iframe Placeholders

When an iframe is blocked, cconsent displays a placeholder:

```html
<!-- Original -->
<iframe 
  data-cookie-category="marketing" 
  src="https://youtube.com/embed/VIDEO_ID"
  width="560" 
  height="315">
</iframe>

<!-- Becomes (when blocked) -->
<div class="cc-blocked-placeholder" style="width: 560px; height: 315px;">
  <p>This content is blocked because you haven't accepted marketing cookies.</p>
  <a href="#" data-cc-open>Change settings</a>
</div>
```

### Styling Placeholders

```css
.cc-blocked-placeholder {
  background: #1a1a1a;
  border: 1px dashed #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #888;
}

.cc-blocked-placeholder a {
  color: #00d4aa;
  margin-top: 10px;
}
```

## Dynamic Script Detection

cconsent uses MutationObserver to detect scripts and iframes added dynamically:

```javascript
// This script will be automatically blocked
const script = document.createElement('script');
script.src = 'https://analytics.example.com/track.js';
script.setAttribute('data-cookie-category', 'analytics');
document.body.appendChild(script);

// Later, when analytics consent is granted, it will execute
```

## Script Management API

### Re-scan DOM

Force a re-scan for new scripts/iframes:

```javascript
window.CookieConsent.scanScripts();
```

### Check Element Status

Check if an element would be allowed to run:

```javascript
const element = document.querySelector('[data-cookie-category="analytics"]');
const wouldRun = window.CookieConsent.wouldRunScript(element);
console.log(wouldRun); // true or false
```

### Get Managed Scripts

List all scripts being managed:

```javascript
const scripts = window.CookieConsent.getManagedScripts();
console.log(scripts);
// [
//   { src: 'https://analytics.example.com/script.js', category: 'analytics', status: 'blocked' },
//   { src: 'https://cdn.example.com/lib.js', category: 'functional', status: 'executed' }
// ]
```

### Get Managed Iframes

List all iframes being managed:

```javascript
const iframes = window.CookieConsent.getManagedIframes();
console.log(iframes);
// [
//   { src: 'https://youtube.com/embed/...', category: 'marketing', status: 'blocked' },
//   { src: 'https://maps.google.com/...', category: 'functional', status: 'loaded' }
// ]
```

## Integration with Tag Managers

### Google Tag Manager

For GTM, use Google Consent Mode instead of direct blocking:

```javascript
const consent = new CookieConsent({
  googleConsentMode: { enabled: true }
});
```

GTM will respect the consent signals automatically.

### Other Tag Managers

For other tag managers, block the main script:

```html
<script 
  type="text/plain" 
  data-cookie-category="analytics marketing"
  src="https://other-tag-manager.com/script.js">
</script>
```

## Best Practices

### 1. Always Use `type="text/plain"` for Inline Scripts

```html
<!-- ✅ Correct -->
<script type="text/plain" data-cookie-category="analytics">
  trackPageView();
</script>
```

### 2. Place cconsent Before Other Scripts

```html
<head>
  <!-- Load cconsent first -->
  <link rel="stylesheet" href="cookie-consent.css">
  <script src="cookie-consent.js"></script>
  
  <!-- Then other scripts (they'll be caught by the scanner) -->
  <script data-cookie-category="analytics" src="analytics.js"></script>
</head>
```

### 3. Use Appropriate Categories

| Script Type | Recommended Category |
|-------------|---------------------|
| Google Analytics | `analytics` |
| Google Ads | `marketing` |
| Facebook Pixel | `marketing` |
| YouTube Embeds | `marketing` or `functional` |
| Chat Widgets | `functional` |
| Language Detection | `preferences` |
| A/B Testing | `analytics` or `functional` |

### 4. Test in Debug Mode

```javascript
const consent = new CookieConsent({
  debug: true
});
```

This shows all managed scripts and their status in the debug badge.

## Common Issues

### Script Still Executes Before Consent

**Cause**: Inline script without `type="text/plain"`

**Solution**:
```html
<!-- Add type="text/plain" -->
<script type="text/plain" data-cookie-category="analytics">
  // ...
</script>
```

### External Script Loads but Doesn't Execute

**Cause**: Script loaded but inline callback not blocked

**Solution**: Block both the external script and its callback:
```html
<script data-cookie-category="analytics" src="https://analytics.js"></script>
<script type="text/plain" data-cookie-category="analytics">
  initAnalytics();
</script>
```

### Dynamically Added Scripts Not Blocked

**Cause**: Script added without `data-cookie-category`

**Solution**: Always add the attribute:
```javascript
const script = document.createElement('script');
script.setAttribute('data-cookie-category', 'analytics');
script.src = 'https://analytics.example.com/script.js';
document.body.appendChild(script);
```

### Iframe Placeholder Sizing Wrong

**Cause**: Original iframe dimensions not preserved

**Solution**: Explicitly set width/height on the iframe:
```html
<iframe 
  data-cookie-category="marketing"
  src="https://youtube.com/embed/..."
  width="560"
  height="315">
</iframe>
```

## Debugging

### Debug Badge

In debug mode, the badge shows:
- List of all managed scripts
- List of all managed iframes
- Status of each (blocked/executed/loaded)

### Console Logging

```
[cconsent] Script blocked: https://analytics.example.com/script.js (analytics)
[cconsent] Iframe blocked: https://youtube.com/embed/... (marketing)
[cconsent] Script executed: https://analytics.example.com/script.js (analytics consent granted)
```

### Export Script State

```javascript
const state = consent.exportDebug();
console.log(state.scripts);
console.log(state.iframes);
```

## Related Pages

- **[Getting Started](Getting-Started)** — Initial setup
- **[Configuration](Configuration)** — All options
- **[Google Consent Mode v2](Google-Consent-Mode-v2)** — Alternative for Google scripts
