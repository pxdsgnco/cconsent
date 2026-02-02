# Vue Adapter

The `cconsent-vue` package provides Vue 3-specific integration with plugin architecture and composables.

## Installation

Download from [GitHub Releases](https://github.com/pxdsgnco/cconsent/releases) or include from the `packages/cconsent-vue` directory.

## Setup

Register the plugin in your Vue app:

```typescript
import { createApp } from 'vue';
import { createCookieConsent } from 'cconsent-vue';
import 'cconsent/style.css';
import App from './App.vue';

const app = createApp(App);

app.use(createCookieConsent({
  policyUrl: '/privacy',
  googleConsentMode: { enabled: true },
  floatingButton: { enabled: true }
}));

app.mount('#app');
```

## Plugin Options

The plugin accepts all options documented in [Configuration](Configuration).

## Composables

### useCookieConsent

Access consent state and methods in any component:

```vue
<script setup>
import { useCookieConsent } from 'cconsent-vue';

const {
  consent,        // Ref<ConsentCategories | null>
  status,         // Ref<ConsentStatus>
  isAllowed,      // (category: string) => boolean
  show,           // () => void
  showSettings,   // () => void
  hide,           // () => void
  resetConsent,   // () => void
  instance        // CookieConsent instance
} = useCookieConsent();
</script>

<template>
  <div>
    <p>Analytics: {{ isAllowed('analytics') ? 'Enabled' : 'Disabled' }}</p>
    <button @click="showSettings">Cookie Settings</button>
  </div>
</template>
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `consent` | `Ref<ConsentCategories \| null>` | Reactive consent state |
| `status` | `Ref<ConsentStatus>` | Overall consent status |
| `isAllowed` | `(category: string) => boolean` | Check if category is allowed |
| `show` | `() => void` | Show consent modal |
| `showSettings` | `() => void` | Show settings view |
| `hide` | `() => void` | Hide modal |
| `resetConsent` | `() => void` | Clear and reset consent |
| `instance` | `CookieConsent` | Raw cconsent instance |

## Global Property

The cconsent instance is available as a global property:

```vue
<script>
export default {
  mounted() {
    // Access via Options API
    this.$cookieConsent.showSettings();
    console.log(this.$cookieConsent.getConsent());
  }
}
</script>
```

## Patterns

### Conditional Rendering

Use `v-if` with `isAllowed()`:

```vue
<script setup>
import { useCookieConsent } from 'cconsent-vue';

const { isAllowed } = useCookieConsent();
</script>

<template>
  <div v-if="isAllowed('analytics')">
    <AnalyticsComponent />
  </div>
  <div v-else>
    <p>Analytics is disabled. 
      <a href="#" @click.prevent="showSettings">Enable it</a>
    </p>
  </div>
</template>
```

### ConsentGate Component

Create a reusable gate component:

```vue
<!-- components/ConsentGate.vue -->
<script setup>
import { useCookieConsent } from 'cconsent-vue';

const props = defineProps({
  category: {
    type: String,
    required: true
  }
});

const { isAllowed, showSettings } = useCookieConsent();
</script>

<template>
  <slot v-if="isAllowed(category)" />
  <slot v-else name="fallback">
    <p>This content requires {{ category }} cookies.</p>
    <button @click="showSettings">Change Settings</button>
  </slot>
</template>
```

Usage:

```vue
<ConsentGate category="marketing">
  <YouTubeEmbed videoId="..." />
  
  <template #fallback>
    <p>Video unavailable. Please accept marketing cookies.</p>
  </template>
</ConsentGate>
```

### Watch Consent Changes

```vue
<script setup>
import { watch } from 'vue';
import { useCookieConsent } from 'cconsent-vue';

const { consent, isAllowed } = useCookieConsent();

// Watch for analytics consent changes
watch(
  () => consent.value?.analytics,
  (newValue, oldValue) => {
    if (newValue && !oldValue) {
      // Analytics just got enabled
      initializeAnalytics();
    }
  }
);
</script>
```

### Dynamic Script Loading

```vue
<script setup>
import { watchEffect, ref } from 'vue';
import { useCookieConsent } from 'cconsent-vue';

const { isAllowed } = useCookieConsent();
const analyticsLoaded = ref(false);

watchEffect(() => {
  if (isAllowed('analytics') && !analyticsLoaded.value) {
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXX';
    script.async = true;
    script.onload = () => {
      analyticsLoaded.value = true;
      gtag('config', 'G-XXXXX');
    };
    document.head.appendChild(script);
  }
});
</script>
```

### Footer Settings Link

```vue
<script setup>
import { useCookieConsent } from 'cconsent-vue';

const { showSettings } = useCookieConsent();
</script>

<template>
  <footer>
    <nav>
      <a href="/privacy">Privacy Policy</a>
      <a href="#" @click.prevent="showSettings">Cookie Settings</a>
    </nav>
  </footer>
</template>
```

### Consent Status Badge

```vue
<script setup>
import { computed } from 'vue';
import { useCookieConsent } from 'cconsent-vue';

const { status } = useCookieConsent();

const statusConfig = {
  all: { color: 'green', label: 'All Accepted' },
  partial: { color: 'yellow', label: 'Partial Consent' },
  essential: { color: 'red', label: 'Essential Only' }
};

const currentStatus = computed(() => statusConfig[status.value]);
</script>

<template>
  <span :class="`status-${status}`">
    {{ currentStatus.label }}
  </span>
</template>

<style scoped>
.status-all { color: green; }
.status-partial { color: orange; }
.status-essential { color: red; }
</style>
```

## TypeScript

The adapter includes full TypeScript support:

```typescript
import { createCookieConsent, useCookieConsent } from 'cconsent-vue';
import type { CookieConsentConfig } from 'cconsent';

const config: CookieConsentConfig = {
  policyUrl: '/privacy',
  googleConsentMode: { enabled: true }
};

app.use(createCookieConsent(config));
```

## Nuxt 3 Integration

Create a plugin for Nuxt 3:

```typescript
// plugins/cookie-consent.client.ts
import { createCookieConsent } from 'cconsent-vue';
import 'cconsent/style.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createCookieConsent({
    policyUrl: '/privacy'
  }));
});
```

Note the `.client.ts` suffix to ensure client-only execution.

## Server-Side Rendering

The adapter handles SSR gracefully:

- Plugin skips initialization on server
- `consent` ref is `null` until hydration
- Use `v-if="consent"` to prevent SSR mismatches

```vue
<script setup>
import { useCookieConsent } from 'cconsent-vue';

const { consent, isAllowed } = useCookieConsent();
</script>

<template>
  <!-- Safe for SSR -->
  <div v-if="consent">
    <p v-if="isAllowed('analytics')">Analytics enabled</p>
  </div>
  <div v-else>
    Loading...
  </div>
</template>
```

## Related Pages

- **[Framework Adapters](Framework-Adapters)** — Overview
- **[React Adapter](React-Adapter)** — React documentation
- **[Svelte Adapter](Svelte-Adapter)** — Svelte documentation
- **[Configuration](Configuration)** — Core options
