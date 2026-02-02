# Product Context: cconsent

## Problem Statement
Websites need to comply with privacy regulations (GDPR, CCPA, LGPD) that require explicit user consent before setting non-essential cookies. Implementing this correctly is complex:
- Different regions have different requirements
- Google has specific Consent Mode v2 requirements
- Scripts must be blocked until consent is given
- Users must be able to easily change their preferences

## Solution
cconsent provides a complete, turnkey solution that:
1. Shows a consent dialog on first visit
2. Blocks scripts/iframes with `data-cookie-category` attributes
3. Integrates with Google Consent Mode v2 automatically
4. Persists consent in localStorage or cookies
5. Provides a floating button for easy preference management

## User Experience Goals
- **Non-intrusive**: Clean modal that doesn't annoy users
- **Clear choices**: Accept All, Reject All, or Customize
- **Accessible**: Full keyboard navigation, screen reader support
- **Mobile-friendly**: Bottom sheet pattern on mobile devices
- **Persistent**: Remember user's choice across sessions

## Key Differentiators
- Zero dependencies (vanilla JS)
- Built-in Google Consent Mode v2 support
- Automatic script/iframe blocking via MutationObserver
- Framework adapters for React/Vue/Svelte
- Geolocation-based consent modes
