# Framework Adapters

cconsent provides official adapters for popular JavaScript frameworks. Each adapter wraps the core library and provides idiomatic APIs for its framework.

## Available Adapters

| Framework | Package | Version |
|-----------|---------|---------|
| React | `cconsent-react` | 2.x |
| Vue 3 | `cconsent-vue` | 2.x |
| Svelte | `cconsent-svelte` | 2.x |

## Quick Comparison

| Feature | React | Vue 3 | Svelte |
|---------|-------|-------|--------|
| State Management | Context API | Plugin + Composables | Stores |
| Conditional Rendering | `<ConsentGate>` | `v-if` with `isAllowed()` | `{#if $consent}` |
| Script Loading | `<ConsentScript>` | Manual | Manual |
| SSR Support | ✅ | ✅ | ✅ (SvelteKit) |

## Installation

All adapters require the core `cconsent` package:

```bash
# React
npm install cconsent cconsent-react

# Vue 3
npm install cconsent cconsent-vue

# Svelte
npm install cconsent cconsent-svelte
```

## Detailed Guides

- **[React Adapter](React-Adapter)** — Context, hooks, and components
- **[Vue Adapter](Vue-Adapter)** — Plugin and composables
- **[Svelte Adapter](Svelte-Adapter)** — Stores and SvelteKit support

## Common Patterns

### Checking Consent

All adapters provide an `isAllowed()` function:

```javascript
// React
const { isAllowed } = useCookieConsent();
if (isAllowed('analytics')) { ... }

// Vue
const { isAllowed } = useCookieConsent();
if (isAllowed('analytics')) { ... }

// Svelte
import { isAllowed } from 'cconsent-svelte';
if (isAllowed('analytics')) { ... }
```

### Opening Settings

All adapters provide a `showSettings()` function:

```javascript
// React
const { showSettings } = useCookieConsent();
<button onClick={showSettings}>Cookie Settings</button>

// Vue
const { showSettings } = useCookieConsent();
<button @click="showSettings">Cookie Settings</button>

// Svelte
import { showSettings } from 'cconsent-svelte';
<button on:click={showSettings}>Cookie Settings</button>
```

### Accessing Consent State

Get the current consent state:

```javascript
// React
const { consent } = useCookieConsent();
console.log(consent.analytics); // true/false

// Vue
const { consent } = useCookieConsent();
console.log(consent.value.analytics);

// Svelte
import { consent } from 'cconsent-svelte';
console.log($consent?.analytics);
```

## TypeScript Support

All adapters include TypeScript definitions:

```typescript
import type { ConsentCategories, ConsentStatus } from 'cconsent';
```

## Server-Side Rendering

All adapters support SSR by:

1. Not rendering consent UI on server
2. Hydrating state from stored consent on client
3. Providing safe fallbacks during SSR

## Related Pages

- **[React Adapter](React-Adapter)** — Full React documentation
- **[Vue Adapter](Vue-Adapter)** — Full Vue 3 documentation
- **[Svelte Adapter](Svelte-Adapter)** — Full Svelte documentation
- **[Configuration](Configuration)** — Core configuration options
