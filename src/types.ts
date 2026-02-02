/**
 * Cookie consent category states (5-category model)
 */
export interface ConsentCategories {
  necessary: boolean;
  functional: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Stored consent state with metadata
 */
export interface ConsentState extends ConsentCategories {
  version: string;
  timestamp: string;
  consentId?: string;
}

/**
 * Cookie storage options
 */
export interface CookieOptions {
  sameSite: 'Strict' | 'Lax' | 'None';
  secure: boolean;
  httpOnly?: boolean;
  domain?: string;
  path: string;
  expires: number;
}

/**
 * Floating button configuration
 */
export interface FloatingButtonConfig {
  enabled: boolean;
  position: 'bottom-left' | 'bottom-right';
  icon: 'cookie' | 'shield' | 'gear' | string;
  label: string;
  showIndicator: boolean;
  offset: { x: number; y: number };
}

/**
 * Google Consent Mode v2 configuration
 */
export interface GoogleConsentModeConfig {
  enabled: boolean;
  waitForUpdate: number;
  mapping: {
    analytics: string[];
    marketing: string[];
    functional: string[];
    preferences: string[];
  };
  adsDataRedaction: boolean;
  urlPassthrough: boolean;
  regionDefaults?: Record<string, Record<string, 'granted' | 'denied'>>;
}

/**
 * Geolocation configuration
 */
export interface GeoConfig {
  enabled: boolean;
  method: 'timezone' | 'api' | 'header';
  apiEndpoint?: string;
  headerName?: string;
  timeout: number;
  cache: boolean;
  cacheDuration: number;
  regions: {
    gdpr: string[];
    ccpa: string[];
    lgpd: string[];
  };
  modeByRegion: Record<string, 'opt-in' | 'opt-out' | 'none'>;
}

/**
 * Content configuration for UI text
 */
export interface ContentConfig {
  initialView: {
    heading: string;
    description: {
      text: string;
      linkText: string;
      suffix: string;
    };
    buttons: {
      customize: string;
      rejectAll: string;
      acceptAll: string;
    };
  };
  settingsView: {
    heading: string;
    description: string;
    buttons: {
      save: string;
    };
  };
  categories: {
    necessary: string;
    functional: string;
    preferences: string;
    analytics: string;
    marketing: string;
  };
}

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Consent callback function type
 */
export type ConsentCallback = (categories: ConsentCategories) => void | Promise<void>;

/**
 * Main configuration options
 */
export interface CookieConsentConfig {
  storageKey?: string;
  storageMethod?: 'localStorage' | 'cookie';
  cookieOptions?: Partial<CookieOptions>;
  encryption?: boolean;
  generateConsentId?: boolean;
  policyUrl?: string;
  debug?: boolean;
  legacyMode?: boolean;
  floatingButton?: Partial<FloatingButtonConfig>;
  googleConsentMode?: Partial<GoogleConsentModeConfig>;
  geo?: Partial<GeoConfig>;
  content?: DeepPartial<ContentConfig>;
  onAccept?: ConsentCallback;
  onReject?: ConsentCallback;
  onSave?: ConsentCallback;
}

/**
 * Consent status type
 */
export type ConsentStatus = 'all' | 'partial' | 'essential';

/**
 * Consent mode type
 */
export type ConsentMode = 'opt-in' | 'opt-out' | 'none';

/**
 * Managed script info
 */
export interface ManagedScriptInfo {
  src: string;
  category: string;
  status: 'allowed' | 'blocked' | 'pending';
}

/**
 * Managed iframe info
 */
export interface ManagedIframeInfo {
  src: string;
  category: string;
  status: 'allowed' | 'blocked';
}

/**
 * Debug export data
 */
export interface DebugExport {
  consent: ConsentState | null;
  categories: ConsentCategories;
  scripts: ManagedScriptInfo[];
  iframes: ManagedIframeInfo[];
  geo: {
    enabled: boolean;
    detectedRegion: string | null;
    consentMode: ConsentMode;
  };
  googleConsentMode: boolean;
  timestamp: string;
  storageKey: string;
  storageMethod: string;
  encryption: boolean;
  consentId: string | null;
  debugEnabled: boolean;
}

/**
 * Global API interface
 */
export interface CookieConsentAPI {
  show: () => void;
  showSettings: () => void;
  hide: () => void;
  getConsent: () => ConsentState | null;
  isAllowed: (category: keyof ConsentCategories) => boolean;
  resetConsent: () => void;
  getStatus: () => ConsentStatus;
  scanScripts: () => void;
  wouldRunScript: (element: HTMLElement) => boolean;
  getManagedScripts: () => ManagedScriptInfo[];
  getManagedIframes: () => ManagedIframeInfo[];
}

declare global {
  interface Window {
    CookieConsent?: CookieConsentAPI;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
