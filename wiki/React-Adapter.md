# React Adapter

The `cconsent-react` package provides React-specific components and hooks for managing cookie consent.

## Installation

Download from [GitHub Releases](https://github.com/pxdsgnco/cconsent/releases) or include from the `packages/cconsent-react` directory.

## Setup

Wrap your app with `CookieConsentProvider`:

```tsx
import { CookieConsentProvider } from 'cconsent-react';
import 'cconsent/style.css';

function App() {
  return (
    <CookieConsentProvider config={{
      policyUrl: '/privacy',
      googleConsentMode: { enabled: true },
      floatingButton: { enabled: true }
    }}>
      <YourApp />
    </CookieConsentProvider>
  );
}
```

## Provider Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | `CookieConsentConfig` | Core cconsent configuration |
| `children` | `ReactNode` | Child components |

The `config` prop accepts all options documented in [Configuration](Configuration).

## Hooks

### useCookieConsent

Access consent state and methods:

```tsx
import { useCookieConsent } from 'cconsent-react';

function MyComponent() {
  const {
    consent,        // Current consent state
    status,         // 'all' | 'partial' | 'essential'
    isAllowed,      // (category: string) => boolean
    show,           // () => void - Show initial modal
    showSettings,   // () => void - Show settings view
    hide,           // () => void - Hide modal
    resetConsent,   // () => void - Clear stored consent
    instance        // CookieConsent instance
  } = useCookieConsent();

  return (
    <div>
      <p>Analytics allowed: {isAllowed('analytics') ? 'Yes' : 'No'}</p>
      <button onClick={showSettings}>Cookie Settings</button>
    </div>
  );
}
```

### Hook Return Values

| Value | Type | Description |
|-------|------|-------------|
| `consent` | `ConsentCategories \| null` | Current consent state or null |
| `status` | `ConsentStatus` | Overall consent status |
| `isAllowed` | `(category: string) => boolean` | Check if category is allowed |
| `show` | `() => void` | Show consent modal |
| `showSettings` | `() => void` | Show settings view |
| `hide` | `() => void` | Hide modal |
| `resetConsent` | `() => void` | Clear and reset consent |
| `instance` | `CookieConsent` | Raw cconsent instance |

## Components

### ConsentGate

Conditionally render content based on consent:

```tsx
import { ConsentGate } from 'cconsent-react';

function Analytics() {
  return (
    <ConsentGate 
      category="analytics" 
      fallback={<p>Analytics tracking is disabled.</p>}
    >
      <AnalyticsComponent />
    </ConsentGate>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | `string` | required | Consent category to check |
| `fallback` | `ReactNode` | `null` | Content to show when not allowed |
| `children` | `ReactNode` | required | Content to show when allowed |

### ConsentScript

Load external scripts conditionally:

```tsx
import { ConsentScript } from 'cconsent-react';

function Tracking() {
  return (
    <>
      <ConsentScript
        category="analytics"
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
        onLoad={() => console.log('Analytics loaded')}
      />
      
      <ConsentScript
        category="marketing"
        src="https://connect.facebook.net/en_US/fbevents.js"
        async
        defer
      />
    </>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | `string` | required | Consent category required |
| `src` | `string` | required | Script URL |
| `onLoad` | `() => void` | - | Callback when loaded |
| `onError` | `(error: Error) => void` | - | Callback on error |
| `async` | `boolean` | `true` | Async attribute |
| `defer` | `boolean` | `false` | Defer attribute |

## Patterns

### Analytics Integration

```tsx
import { useCookieConsent, ConsentGate, ConsentScript } from 'cconsent-react';

function AnalyticsWrapper() {
  const { consent, isAllowed } = useCookieConsent();

  // Effect that runs when analytics consent is granted
  useEffect(() => {
    if (isAllowed('analytics')) {
      // Initialize analytics
      gtag('config', 'G-XXXXX');
    }
  }, [consent?.analytics, isAllowed]);

  return (
    <ConsentGate category="analytics">
      <ConsentScript
        category="analytics"
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
      />
    </ConsentGate>
  );
}
```

### Cookie Settings Link

```tsx
function Footer() {
  const { showSettings } = useCookieConsent();

  return (
    <footer>
      <button onClick={showSettings}>
        Manage Cookie Preferences
      </button>
    </footer>
  );
}
```

### Consent Status Display

```tsx
function ConsentBadge() {
  const { status } = useCookieConsent();

  const colors = {
    all: 'green',
    partial: 'yellow',
    essential: 'red'
  };

  return (
    <span style={{ color: colors[status] }}>
      Consent: {status}
    </span>
  );
}
```

### Marketing Pixels

```tsx
function MarketingPixels() {
  const { isAllowed } = useCookieConsent();

  if (!isAllowed('marketing')) {
    return null;
  }

  return (
    <>
      <ConsentScript 
        category="marketing" 
        src="https://connect.facebook.net/en_US/fbevents.js" 
      />
      <ConsentScript 
        category="marketing" 
        src="https://www.googleadservices.com/pagead/conversion_async.js" 
      />
    </>
  );
}
```

## TypeScript

The adapter is fully typed:

```tsx
import type { 
  CookieConsentConfig, 
  ConsentCategories, 
  ConsentStatus 
} from 'cconsent';

interface MyConsentProps {
  config: CookieConsentConfig;
}

function MyConsent({ config }: MyConsentProps) {
  return (
    <CookieConsentProvider config={config}>
      <App />
    </CookieConsentProvider>
  );
}
```

## Server-Side Rendering

The adapter handles SSR gracefully:

- Provider renders children immediately
- Consent state is `null` until hydration
- Modal only renders on client

```tsx
function SSRSafeComponent() {
  const { consent, isAllowed } = useCookieConsent();

  // consent is null during SSR
  if (consent === null) {
    return <p>Loading consent...</p>;
  }

  return (
    <div>
      Analytics: {isAllowed('analytics') ? 'Enabled' : 'Disabled'}
    </div>
  );
}
```

## Next.js Integration

For Next.js, use the `'use client'` directive:

```tsx
// components/CookieConsent.tsx
'use client';

import { CookieConsentProvider } from 'cconsent-react';
import 'cconsent/style.css';

export function CookieConsent({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider config={{ policyUrl: '/privacy' }}>
      {children}
    </CookieConsentProvider>
  );
}
```

```tsx
// app/layout.tsx
import { CookieConsent } from '@/components/CookieConsent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CookieConsent>
          {children}
        </CookieConsent>
      </body>
    </html>
  );
}
```

## Related Pages

- **[Framework Adapters](Framework-Adapters)** — Overview
- **[Vue Adapter](Vue-Adapter)** — Vue 3 documentation
- **[Svelte Adapter](Svelte-Adapter)** — Svelte documentation
- **[Configuration](Configuration)** — Core options
