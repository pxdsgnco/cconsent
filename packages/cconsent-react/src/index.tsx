import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';
import type {
  ConsentCategories,
  ConsentStatus,
  CookieConsentConfig
} from 'cconsent';

// Extend Window for CookieConsent class
declare global {
  interface Window {
    CookieConsent?: {
      show: () => void;
      showSettings: () => void;
      hide: () => void;
      getConsent: () => ConsentState | null;
      isAllowed: (category: string) => boolean;
      resetConsent: () => void;
      getStatus: () => ConsentStatus;
    };
  }
  // CookieConsent class constructor
  const CookieConsent: new (config: CookieConsentConfig) => CookieConsentInstance;
}

interface ConsentState extends ConsentCategories {
  timestamp?: string;
  consentId?: string;
}

interface CookieConsentInstance {
  init: () => Promise<void>;
  show: () => void;
  hide: () => void;
  showSettings: () => void;
  getConsent: () => ConsentState | null;
  isAllowed: (category: string) => boolean;
  resetConsent: () => void;
  _getConsentStatus: () => ConsentStatus;
}

interface CookieConsentContextValue {
  consent: ConsentCategories | null;
  status: ConsentStatus;
  isAllowed: (category: keyof ConsentCategories) => boolean;
  showDialog: () => void;
  showSettings: () => void;
  hideDialog: () => void;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

interface CookieConsentProviderProps {
  children: ReactNode;
  config: CookieConsentConfig;
}

/**
 * React provider for cookie consent
 *
 * @example
 * ```tsx
 * import { CookieConsentProvider } from 'cconsent-react';
 * import 'cconsent/style.css';
 *
 * function App() {
 *   return (
 *     <CookieConsentProvider config={{ policyUrl: '/privacy' }}>
 *       <MyApp />
 *     </CookieConsentProvider>
 *   );
 * }
 * ```
 */
export function CookieConsentProvider({ children, config }: CookieConsentProviderProps) {
  const [instance, setInstance] = useState<CookieConsentInstance | null>(null);
  const [consent, setConsent] = useState<ConsentCategories | null>(null);
  const [status, setStatus] = useState<ConsentStatus>('essential');

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Dynamically import CookieConsent class
    const initConsent = async () => {
      // Wait for CookieConsent to be available (from script or import)
      const CookieConsentClass = (window as unknown as { CookieConsent: new (config: CookieConsentConfig) => CookieConsentInstance }).CookieConsent;

      if (!CookieConsentClass) {
        console.warn('[cconsent-react] CookieConsent class not found. Make sure cconsent is loaded.');
        return;
      }

      const cc = new CookieConsentClass({
        ...config,
        onAccept: (categories) => {
          setConsent(categories);
          setStatus(cc._getConsentStatus());
          config.onAccept?.(categories);
        },
        onReject: (categories) => {
          setConsent(categories);
          setStatus(cc._getConsentStatus());
          config.onReject?.(categories);
        },
        onSave: (categories) => {
          setConsent(categories);
          setStatus(cc._getConsentStatus());
          config.onSave?.(categories);
        }
      });

      await cc.init();
      setInstance(cc);

      const existingConsent = cc.getConsent();
      if (existingConsent) {
        setConsent({
          necessary: true,
          functional: existingConsent.functional ?? false,
          preferences: existingConsent.preferences ?? false,
          analytics: existingConsent.analytics ?? false,
          marketing: existingConsent.marketing ?? false
        });
        setStatus(cc._getConsentStatus());
      }
    };

    initConsent();
  }, []);

  const isAllowed = useCallback(
    (category: keyof ConsentCategories): boolean => {
      return instance?.isAllowed(category) ?? false;
    },
    [instance]
  );

  const showDialog = useCallback(() => {
    instance?.show();
  }, [instance]);

  const showSettings = useCallback(() => {
    instance?.show();
    instance?.showSettings();
  }, [instance]);

  const hideDialog = useCallback(() => {
    instance?.hide();
  }, [instance]);

  const resetConsent = useCallback(() => {
    instance?.resetConsent();
    setConsent(null);
    setStatus('essential');
  }, [instance]);

  const value: CookieConsentContextValue = {
    consent,
    status,
    isAllowed,
    showDialog,
    showSettings,
    hideDialog,
    resetConsent
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

/**
 * Hook to access cookie consent state and methods
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { consent, isAllowed, showSettings } = useCookieConsent();
 *
 *   if (!isAllowed('analytics')) {
 *     return <button onClick={showSettings}>Enable analytics</button>;
 *   }
 *
 *   return <AnalyticsScript />;
 * }
 * ```
 */
export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

interface ConsentScriptProps {
  /** Cookie category required for this script */
  category: keyof ConsentCategories;
  /** External script URL */
  src?: string;
  /** Inline script content */
  children?: string;
  /** Additional script attributes */
  async?: boolean;
  defer?: boolean;
  id?: string;
}

/**
 * Conditionally render a script based on consent
 *
 * @example
 * ```tsx
 * <ConsentScript category="analytics" src="https://www.googletagmanager.com/gtag/js" />
 * <ConsentScript category="marketing">
 *   {`fbq('init', 'YOUR_PIXEL_ID');`}
 * </ConsentScript>
 * ```
 */
export function ConsentScript({
  category,
  src,
  children,
  async: isAsync,
  defer,
  id
}: ConsentScriptProps) {
  const { isAllowed } = useCookieConsent();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAllowed(category) || loaded) return;

    const script = document.createElement('script');

    if (src) {
      script.src = src;
    } else if (children) {
      script.textContent = children;
    }

    if (isAsync) script.async = true;
    if (defer) script.defer = true;
    if (id) script.id = id;

    script.setAttribute('data-cookie-category', category);
    document.body.appendChild(script);
    setLoaded(true);

    return () => {
      if (src) {
        script.remove();
        setLoaded(false);
      }
    };
  }, [isAllowed(category), category, src, children, loaded, isAsync, defer, id]);

  return null;
}

interface ConsentGateProps {
  /** Cookie category required to show content */
  category: keyof ConsentCategories;
  /** Content to show when consent is granted */
  children: ReactNode;
  /** Fallback content when consent is not granted */
  fallback?: ReactNode;
}

/**
 * Conditionally render content based on consent
 *
 * @example
 * ```tsx
 * <ConsentGate category="marketing" fallback={<MarketingOptIn />}>
 *   <MarketingContent />
 * </ConsentGate>
 * ```
 */
export function ConsentGate({ category, children, fallback }: ConsentGateProps) {
  const { isAllowed } = useCookieConsent();

  if (!isAllowed(category)) {
    return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
}

// Export types
export type {
  CookieConsentContextValue,
  CookieConsentProviderProps,
  ConsentScriptProps,
  ConsentGateProps
};
