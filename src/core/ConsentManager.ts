import type { ConsentCategories, ConsentState, ConsentCallback, ConsentStatus } from '../types';
import { StorageAdapter } from './StorageAdapter';

/**
 * Headless consent state management
 */
export class ConsentManager {
  private storage: StorageAdapter;
  private categories: ConsentCategories;
  private consentId: string | null = null;
  private generateConsentId: boolean;
  private legacyMode: boolean;

  public onAccept?: ConsentCallback;
  public onReject?: ConsentCallback;
  public onSave?: ConsentCallback;

  constructor(options: {
    storage: StorageAdapter;
    generateConsentId?: boolean;
    legacyMode?: boolean;
    onAccept?: ConsentCallback;
    onReject?: ConsentCallback;
    onSave?: ConsentCallback;
  }) {
    this.storage = options.storage;
    this.generateConsentId = options.generateConsentId ?? false;
    this.legacyMode = options.legacyMode ?? false;
    this.onAccept = options.onAccept;
    this.onReject = options.onReject;
    this.onSave = options.onSave;

    this.categories = {
      necessary: true,
      functional: false,
      preferences: false,
      analytics: false,
      marketing: false
    };
  }

  /**
   * Generate a UUID v4
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Migrate v1 consent to v2
   */
  private migrateV1toV2(oldConsent: Partial<ConsentState>): ConsentState {
    return {
      version: '2.0',
      necessary: true,
      functional: false,
      preferences: false,
      analytics: oldConsent.analytics ?? false,
      marketing: oldConsent.marketing ?? false,
      timestamp: oldConsent.timestamp ?? new Date().toISOString(),
      consentId: oldConsent.consentId
    };
  }

  /**
   * Get callback categories (with legacy mode support)
   */
  private getCallbackCategories(): ConsentCategories {
    if (this.legacyMode) {
      return {
        necessary: this.categories.necessary,
        functional: false,
        preferences: false,
        analytics:
          this.categories.functional ||
          this.categories.preferences ||
          this.categories.analytics,
        marketing: this.categories.marketing
      };
    }
    return { ...this.categories };
  }

  /**
   * Load existing consent
   */
  load(): ConsentState | null {
    let consent = this.storage.load();

    if (consent && !consent.version) {
      // Migrate from v1
      consent = this.migrateV1toV2(consent);
      this.storage.save(consent);
    }

    if (consent) {
      this.categories = {
        necessary: true,
        functional: consent.functional ?? false,
        preferences: consent.preferences ?? false,
        analytics: consent.analytics ?? false,
        marketing: consent.marketing ?? false
      };
      this.consentId = consent.consentId ?? null;
    }

    return consent;
  }

  /**
   * Save current consent
   */
  private save(): void {
    if (this.generateConsentId && !this.consentId) {
      this.consentId = this.generateUUID();
    }

    const consent: ConsentState = {
      version: '2.0',
      ...this.categories,
      timestamp: new Date().toISOString(),
      consentId: this.consentId ?? undefined
    };

    this.storage.save(consent);
  }

  /**
   * Execute callback
   */
  private async executeCallback(callback?: ConsentCallback): Promise<void> {
    if (!callback) return;
    const result = callback(this.getCallbackCategories());
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Accept all cookies
   */
  async acceptAll(): Promise<void> {
    this.categories = {
      necessary: true,
      functional: true,
      preferences: true,
      analytics: true,
      marketing: true
    };
    this.save();
    await this.executeCallback(this.onAccept);
  }

  /**
   * Reject all non-essential cookies
   */
  async rejectAll(): Promise<void> {
    this.categories = {
      necessary: true,
      functional: false,
      preferences: false,
      analytics: false,
      marketing: false
    };
    this.save();
    await this.executeCallback(this.onReject);
  }

  /**
   * Save specific preferences
   */
  async savePreferences(categories: Partial<ConsentCategories>): Promise<void> {
    this.categories = {
      necessary: true,
      functional: categories.functional ?? this.categories.functional,
      preferences: categories.preferences ?? this.categories.preferences,
      analytics: categories.analytics ?? this.categories.analytics,
      marketing: categories.marketing ?? this.categories.marketing
    };
    this.save();
    await this.executeCallback(this.onSave);
  }

  /**
   * Reset consent
   */
  reset(): void {
    this.storage.clear();
    this.categories = {
      necessary: true,
      functional: false,
      preferences: false,
      analytics: false,
      marketing: false
    };
    this.consentId = null;
  }

  /**
   * Get current categories
   */
  getCategories(): ConsentCategories {
    return { ...this.categories };
  }

  /**
   * Check if a category is allowed
   */
  isAllowed(category: keyof ConsentCategories): boolean {
    return this.categories[category] ?? false;
  }

  /**
   * Get consent status
   */
  getStatus(): ConsentStatus {
    const optional = ['functional', 'preferences', 'analytics', 'marketing'] as const;
    const allowed = optional.filter((cat) => this.categories[cat]);

    if (allowed.length === optional.length) return 'all';
    if (allowed.length > 0) return 'partial';
    return 'essential';
  }

  /**
   * Get active category count
   */
  getActiveCategoryCount(): number {
    let count = 1; // Necessary is always active
    if (this.categories.functional) count++;
    if (this.categories.preferences) count++;
    if (this.categories.analytics) count++;
    if (this.categories.marketing) count++;
    return count;
  }

  /**
   * Get consent ID
   */
  getConsentId(): string | null {
    return this.consentId;
  }
}
