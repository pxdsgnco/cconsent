# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cconsent is a lightweight, GDPR-compliant cookie consent dialog built with vanilla HTML, CSS, and JavaScript. No build tools, bundlers, or external dependencies.

## Development

Open `index.html` directly in a browser to test. The demo page includes real-time consent status display and test controls.

Enable debug mode during development:
```javascript
const cookieConsent = new CookieConsent({ debug: true });
```

Debug mode provides:
- Visual badge showing consent state and managed scripts
- Console logging with `[cconsent]` prefix
- Simulation buttons (Clear Consent, Randomize, Export)

## Architecture

### Single-Class Design

The entire implementation is a single `CookieConsent` class in `js/cookie-consent.js`. Key architectural decisions:

- **No framework dependencies** - Pure DOM manipulation using a helper `_createElement()` method
- **Two-view modal** - `initialView` (accept/reject/customize) and `settingsView` (category toggles)
- **Script blocking** - Scripts with `data-cookie-category` attribute are intercepted and blocked until consent is given

### Storage Layer

The class supports two storage methods with automatic migration:
- `localStorage` (default)
- HTTP cookies with configurable attributes (sameSite, secure, domain, path, expires)

Optional Base64 encoding (`encryption: true`) and UUID consent ID generation (`generateConsentId: true`).

### Floating Button & Global API

For GDPR Article 7(3) compliance (easy consent withdrawal):
- Floating button appears after initial consent (`floatingButton.enabled: true`)
- Status indicator shows green/yellow/red based on consent state
- Global API exposed on `window.CookieConsent` with `show()`, `showSettings()`, `getConsent()`, `isAllowed()`, `getStatus()`
- Auto-binding for elements with `data-cc-open` attribute

### Script Management Flow

1. `_scanScripts()` - Finds all `<script data-cookie-category="...">` tags on page load
2. `_blockScript()` - Removes `src` and sets `type="text/plain"` to prevent execution
3. `_allowScript()` - Creates new script element to trigger load when consent is given
4. `_evaluateScripts()` - Re-evaluates all managed scripts when consent changes

### Accessibility Implementation

Focus management uses `_getFocusableElements()` to filter only visible/enabled elements for the focus trap. ARIA live region (`this.liveRegion`) announces preference changes to screen readers.

## Key Methods

| Method | Purpose |
|--------|---------|
| `init()` | Entry point - checks existing consent, blocks scripts, shows modal if needed |
| `_saveToStorage()` | Persists consent with optional encoding and consent ID |
| `getConsent()` | Retrieves and decodes consent from storage |
| `isAllowed(category)` | Checks if a specific category is permitted |
| `exportDebug()` | Returns complete state snapshot for debugging |

## Cookie Categories

- **Necessary** - Always enabled, toggle disabled
- **Analytics** - Off by default, user-toggleable
- **Marketing** - Off by default, user-toggleable
