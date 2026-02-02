# Svelte Adapter

The `cconsent-svelte` package provides Svelte-specific integration with stores, context, and SvelteKit support.

## Installation

```bash
npm install cconsent cconsent-svelte
```

## Setup

Initialize in your root component or layout:

```svelte
<!-- +layout.svelte or App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { initCookieConsent } from 'cconsent-svelte';
  import 'cconsent/style.css';

  onMount(() => {
    initCookieConsent({
      policyUrl: '/privacy',
      googleConsentMode: { enabled: true },
      floatingButton: { enabled: true }
    });
  });
</script>

<slot />
```

## Stores

The adapter provides reactive Svelte stores:

```svelte
<script>
  import { consent, status, instance } from 'cconsent-svelte';
  
  // $consent - ConsentCategories | null
  // $status - ConsentStatus
  // $instance - CookieConsent instance
</script>

<p>Analytics: {$consent?.analytics ? 'Enabled' : 'Disabled'}</p>
<p>Status: {$status}</p>
```

### Available Stores

| Store | Type | Description |
|-------|------|-------------|
| `consent` | `Readable<ConsentCategories \| null>` | Current consent state |
| `status` | `Readable<ConsentStatus>` | Overall consent status |
| `instance` | `Readable<CookieConsent \| null>` | Raw cconsent instance |

## Functions

### isAllowed

Check if a category is allowed:

```svelte
<script>
  import { isAllowed } from 'cconsent-svelte';
</script>

{#if isAllowed('analytics')}
  <AnalyticsComponent />
{:else}
  <p>Analytics disabled</p>
{/if}
```

### showSettings / show / hide

Control the consent modal:

```svelte
<script>
  import { showSettings, show, hide } from 'cconsent-svelte';
</script>

<button on:click={showSettings}>Cookie Settings</button>
<button on:click={show}>Show Consent</button>
<button on:click={hide}>Hide Modal</button>
```

### resetConsent

Clear stored consent:

```svelte
<script>
  import { resetConsent } from 'cconsent-svelte';
</script>

<button on:click={resetConsent}>Reset Cookie Preferences</button>
```

## Patterns

### Conditional Rendering

```svelte
<script>
  import { consent, showSettings } from 'cconsent-svelte';
</script>

{#if $consent?.analytics}
  <AnalyticsComponent />
{:else}
  <div class="consent-placeholder">
    <p>Analytics tracking is disabled.</p>
    <button on:click={showSettings}>Enable Analytics</button>
  </div>
{/if}
```

### ConsentGate Component

Create a reusable gate component:

```svelte
<!-- ConsentGate.svelte -->
<script>
  import { consent, showSettings } from 'cconsent-svelte';
  
  export let category;
  export let fallbackText = `This content requires ${category} cookies.`;
  
  $: allowed = $consent?.[category] ?? false;
</script>

{#if allowed}
  <slot />
{:else}
  <slot name="fallback">
    <div class="consent-gate-fallback">
      <p>{fallbackText}</p>
      <button on:click={showSettings}>Change Settings</button>
    </div>
  </slot>
{/if}
```

Usage:

```svelte
<ConsentGate category="marketing">
  <YouTubeEmbed videoId="..." />
  
  <svelte:fragment slot="fallback">
    <p>Video blocked. Please accept marketing cookies.</p>
  </svelte:fragment>
</ConsentGate>
```

### Watch Consent Changes

```svelte
<script>
  import { consent } from 'cconsent-svelte';
  
  $: if ($consent?.analytics) {
    // Analytics consent just became true
    initializeAnalytics();
  }
  
  // Or with reactive statement
  $: analyticsEnabled = $consent?.analytics ?? false;
  $: {
    if (analyticsEnabled) {
      console.log('Analytics enabled!');
    }
  }
</script>
```

### Dynamic Script Loading

```svelte
<script>
  import { onMount } from 'svelte';
  import { consent } from 'cconsent-svelte';
  
  let scriptLoaded = false;
  
  $: if ($consent?.analytics && !scriptLoaded) {
    loadAnalyticsScript();
  }
  
  function loadAnalyticsScript() {
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXX';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      window.gtag('config', 'G-XXXXX');
    };
    document.head.appendChild(script);
  }
</script>
```

### ConsentScript Component

Create a component for consent-aware script loading:

```svelte
<!-- ConsentScript.svelte -->
<script>
  import { consent } from 'cconsent-svelte';
  import { onMount } from 'svelte';
  
  export let category;
  export let src;
  export let async = true;
  
  let loaded = false;
  
  $: if ($consent?.[category] && !loaded) {
    loadScript();
  }
  
  function loadScript() {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.onload = () => {
      loaded = true;
      dispatch('load');
    };
    document.head.appendChild(script);
  }
</script>
```

Usage:

```svelte
<ConsentScript 
  category="analytics" 
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
  on:load={() => console.log('Loaded!')}
/>
```

### Consent Status Badge

```svelte
<script>
  import { status } from 'cconsent-svelte';
  
  const statusLabels = {
    all: 'All Accepted',
    partial: 'Partial',
    essential: 'Essential Only'
  };
</script>

<span class="status-badge status-{$status}">
  {statusLabels[$status]}
</span>

<style>
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
  }
  .status-all { background: #22c55e; color: white; }
  .status-partial { background: #eab308; color: black; }
  .status-essential { background: #ef4444; color: white; }
</style>
```

## Context API

For components that need access without importing stores:

```svelte
<!-- Parent.svelte -->
<script>
  import { setContext } from 'svelte';
  import { consent, showSettings } from 'cconsent-svelte';
  
  setContext('cookieConsent', { consent, showSettings });
</script>

<Child />
```

```svelte
<!-- Child.svelte -->
<script>
  import { getContext } from 'svelte';
  
  const { consent, showSettings } = getContext('cookieConsent');
</script>

{#if $consent?.marketing}
  <MarketingWidget />
{/if}
```

## TypeScript

The adapter includes full TypeScript support:

```typescript
// +layout.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { initCookieConsent, consent, status } from 'cconsent-svelte';
  import type { CookieConsentConfig } from 'cconsent';
  import 'cconsent/style.css';

  const config: CookieConsentConfig = {
    policyUrl: '/privacy',
    googleConsentMode: { enabled: true }
  };

  onMount(() => {
    initCookieConsent(config);
  });
</script>
```

## SvelteKit Integration

### Layout Setup

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { initCookieConsent } from 'cconsent-svelte';
  import 'cconsent/style.css';

  onMount(() => {
    if (browser) {
      initCookieConsent({
        policyUrl: '/privacy'
      });
    }
  });
</script>

<slot />
```

### Server-Side Rendering

The adapter handles SSR gracefully:

- `initCookieConsent` only runs on client
- Stores return `null` during SSR
- Use `{#if $consent}` to prevent hydration mismatches

```svelte
<script>
  import { consent } from 'cconsent-svelte';
</script>

{#if $consent}
  <!-- Only renders after hydration -->
  {#if $consent.analytics}
    <AnalyticsComponent />
  {/if}
{:else}
  <p>Loading...</p>
{/if}
```

### Page-Specific Consent Checks

```svelte
<!-- src/routes/analytics/+page.svelte -->
<script>
  import { consent, showSettings } from 'cconsent-svelte';
  import { goto } from '$app/navigation';
  
  $: if ($consent && !$consent.analytics) {
    // Redirect if analytics not consented
    goto('/');
  }
</script>

{#if $consent?.analytics}
  <AnalyticsDashboard />
{:else}
  <p>Please accept analytics cookies to view this page.</p>
  <button on:click={showSettings}>Cookie Settings</button>
{/if}
```

## Related Pages

- **[Framework Adapters](Framework-Adapters)** — Overview
- **[React Adapter](React-Adapter)** — React documentation
- **[Vue Adapter](Vue-Adapter)** — Vue 3 documentation
- **[Configuration](Configuration)** — Core options
