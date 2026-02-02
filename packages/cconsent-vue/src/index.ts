import { ref, readonly, inject, provide, type App, type Ref, type InjectionKey } from 'vue';
import CookieConsentClass, {
  type ConsentCategories,
  type ConsentStatus,
  type ConsentState,
  type CookieConsentConfig,
  type CookieConsentInstance
} from 'cconsent';

interface CookieConsentState {
  consent: Readonly<Ref<ConsentCategories | null>>;
  status: Readonly<Ref<ConsentStatus>>;
  isAllowed: (category: keyof ConsentCategories) => boolean;
  showDialog: () => void;
  showSettings: () => void;
  hideDialog: () => void;
  resetConsent: () => void;
}

const COOKIE_CONSENT_KEY: InjectionKey<CookieConsentState> = Symbol('cookie-consent');

/**
 * Create a Vue plugin for cookie consent
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { createCookieConsent } from 'cconsent-vue';
 * import 'cconsent/style.css';
 *
 * const app = createApp(App);
 *
 * app.use(createCookieConsent({
 *   policyUrl: '/privacy',
 *   googleConsentMode: { enabled: true }
 * }));
 *
 * app.mount('#app');
 * ```
 */
export function createCookieConsent(config: CookieConsentConfig) {
  return {
    install(app: App) {
      const consent = ref<ConsentCategories | null>(null);
      const status = ref<ConsentStatus>('essential');
      let instance: CookieConsentInstance | null = null;

      // Only init on client
      if (typeof window !== 'undefined') {
        instance = new CookieConsentClass({
          ...config,
          onAccept: (categories) => {
            consent.value = categories;
            status.value = instance?._getConsentStatus() ?? 'essential';
            config.onAccept?.(categories);
          },
          onReject: (categories) => {
            consent.value = categories;
            status.value = instance?._getConsentStatus() ?? 'essential';
            config.onReject?.(categories);
          },
          onSave: (categories) => {
            consent.value = categories;
            status.value = instance?._getConsentStatus() ?? 'essential';
            config.onSave?.(categories);
          }
        });

        instance.init().then(() => {
          const existing = instance?.getConsent();
          if (existing) {
            consent.value = {
              necessary: true,
              functional: existing.functional ?? false,
              preferences: existing.preferences ?? false,
              analytics: existing.analytics ?? false,
              marketing: existing.marketing ?? false
            };
            status.value = instance?._getConsentStatus() ?? 'essential';
          }
        });
      }

      const state: CookieConsentState = {
        consent: readonly(consent),
        status: readonly(status),
        isAllowed: (cat: keyof ConsentCategories) => instance?.isAllowed(cat) ?? false,
        showDialog: () => instance?.show(),
        showSettings: () => {
          instance?.show();
          instance?.showSettings();
        },
        hideDialog: () => instance?.hide(),
        resetConsent: () => {
          instance?.resetConsent();
          consent.value = null;
          status.value = 'essential';
        }
      };

      app.provide(COOKIE_CONSENT_KEY, state);

      // Also provide as global property
      app.config.globalProperties.$cookieConsent = state;
    }
  };
}

/**
 * Composable to access cookie consent state and methods
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCookieConsent } from 'cconsent-vue';
 *
 * const { consent, isAllowed, showSettings } = useCookieConsent();
 * </script>
 *
 * <template>
 *   <div v-if="isAllowed('analytics')">
 *     <AnalyticsComponent />
 *   </div>
 *   <button v-else @click="showSettings">Enable Analytics</button>
 * </template>
 * ```
 */
export function useCookieConsent(): CookieConsentState {
  const state = inject<CookieConsentState>(COOKIE_CONSENT_KEY);
  if (!state) {
    throw new Error(
      'Cookie consent plugin not installed. ' +
      'Make sure to use app.use(createCookieConsent(config))'
    );
  }
  return state;
}

// Augment Vue's ComponentCustomProperties for global access
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $cookieConsent: CookieConsentState;
  }
}

// Export types
export type { CookieConsentState };
export { COOKIE_CONSENT_KEY };
