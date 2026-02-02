import type { GeoConfig, ConsentMode } from '../types';

/**
 * Geolocation detection for region-based consent modes
 */
export class GeoDetector {
  private config: GeoConfig;
  public detectedRegion: string | null = null;
  public consentMode: ConsentMode = 'opt-in';

  constructor(config: Partial<GeoConfig> = {}) {
    this.config = {
      enabled: false,
      method: 'timezone',
      timeout: 500,
      cache: true,
      cacheDuration: 86400000,
      regions: {
        gdpr: [
          'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
          'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL',
          'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB'
        ],
        ccpa: ['US-CA'],
        lgpd: ['BR']
      },
      modeByRegion: {
        gdpr: 'opt-in',
        ccpa: 'opt-out',
        lgpd: 'opt-in',
        default: 'none'
      },
      ...config
    };
  }

  /**
   * Detect region by timezone
   */
  private detectByTimezone(): string | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const tzToCountry: Record<string, string> = {
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT',
        'Europe/Amsterdam': 'NL',
        'Europe/Brussels': 'BE',
        'Europe/Vienna': 'AT',
        'Europe/Warsaw': 'PL',
        'Europe/Prague': 'CZ',
        'Europe/Stockholm': 'SE',
        'Europe/Oslo': 'NO',
        'Europe/Helsinki': 'FI',
        'Europe/Dublin': 'IE',
        'Europe/Lisbon': 'PT',
        'Europe/Athens': 'GR',
        'Europe/Budapest': 'HU',
        'Europe/Bucharest': 'RO',
        'Europe/Sofia': 'BG',
        'Europe/Copenhagen': 'DK',
        'Europe/Zurich': 'CH',
        'America/Los_Angeles': 'US-CA',
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Sao_Paulo': 'BR',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Australia/Sydney': 'AU'
      };

      return tzToCountry[timezone] || null;
    } catch {
      return null;
    }
  }

  /**
   * Detect region by API
   */
  private async detectByAPI(): Promise<string | null> {
    if (!this.config.apiEndpoint) return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(this.config.apiEndpoint, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return data.country || data.countryCode || data.country_code || null;
    } catch {
      return null;
    }
  }

  /**
   * Detect region by header (meta tag)
   */
  private detectByHeader(): string | null {
    const meta = document.querySelector('meta[name="user-country"]');
    return meta?.getAttribute('content') || null;
  }

  /**
   * Get cached geo data
   */
  private getCached(): string | null {
    if (!this.config.cache) return null;

    try {
      const cached = localStorage.getItem('cc_geo_cache');
      if (!cached) return null;

      const { country, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.config.cacheDuration) {
        localStorage.removeItem('cc_geo_cache');
        return null;
      }

      return country;
    } catch {
      return null;
    }
  }

  /**
   * Set cached geo data
   */
  private setCache(country: string): void {
    if (!this.config.cache) return;

    try {
      localStorage.setItem(
        'cc_geo_cache',
        JSON.stringify({ country, timestamp: Date.now() })
      );
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Classify country into region type
   */
  private classifyRegion(countryCode: string | null): string {
    if (!countryCode) return 'default';

    const { regions } = this.config;

    if (regions.gdpr.includes(countryCode)) return 'gdpr';
    if (regions.ccpa.includes(countryCode)) return 'ccpa';
    if (regions.lgpd.includes(countryCode)) return 'lgpd';

    return 'default';
  }

  /**
   * Detect region and set consent mode
   */
  async detect(): Promise<void> {
    if (!this.config.enabled) return;

    let country = this.getCached();

    if (!country) {
      switch (this.config.method) {
        case 'timezone':
          country = this.detectByTimezone();
          break;
        case 'api':
          country = await this.detectByAPI();
          break;
        case 'header':
          country = this.detectByHeader();
          break;
      }

      if (country) {
        this.setCache(country);
      }
    }

    this.detectedRegion = country;
    const regionType = this.classifyRegion(country);
    this.consentMode = this.config.modeByRegion[regionType] || 'opt-in';
  }

  /**
   * Check if geo detection is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}
