/**
 * Cookie Consent Dialog
 * A vanilla JavaScript implementation for GDPR-compliant cookie consent
 */

class CookieConsent {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'cookie_consent';
    this.policyUrl = options.policyUrl || '#';
    this.onAccept = options.onAccept || null;
    this.onReject = options.onReject || null;
    this.onSave = options.onSave || null;

    // Debug mode
    this.debug = options.debug || false;
    this.managedScripts = []; // Track scripts with data-cookie-category
    this.debugBadge = null;

    // Floating button configuration
    this.floatingButtonConfig = this._mergeDeep({
      enabled: false,
      position: 'bottom-right', // 'bottom-left' | 'bottom-right'
      icon: 'cookie', // 'cookie' | 'shield' | 'gear' | custom SVG string
      label: 'Cookie Settings',
      showIndicator: true,
      offset: { x: 20, y: 20 }
    }, options.floatingButton || {});
    this.floatingButton = null;

    // Storage configuration
    this.storageMethod = options.storageMethod || 'localStorage';
    this.cookieOptions = this._mergeDeep({
      sameSite: 'Strict',
      secure: true,
      httpOnly: false, // Note: Cannot be set via JavaScript
      domain: null,
      path: '/',
      expires: 365 // Days
    }, options.cookieOptions || {});
    this.encryption = options.encryption || false;
    this.generateConsentId = options.generateConsentId || false;
    this.consentId = null;

    // Default content for all text in the modal
    const defaultContent = {
      initialView: {
        heading: 'Cookie settings',
        description: {
          text: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. Read our ',
          linkText: 'Cookie Policy',
          suffix: ' to learn more.'
        },
        buttons: {
          customize: 'Customize Cookie Settings',
          rejectAll: 'Reject All Cookies',
          acceptAll: 'Accept All Cookies'
        }
      },
      settingsView: {
        heading: 'Cookie settings',
        description: 'Manage your cookie preferences below. Necessary cookies are required for the website to function and cannot be disabled.',
        buttons: {
          save: 'Save Preferences'
        }
      },
      categories: {
        necessary: 'Enables security and basic functionality.',
        analytics: 'Enables tracking of site performance.',
        marketing: 'Enables ads personalization and tracking.'
      }
    };

    // Deep merge user content with defaults
    this.content = this._mergeDeep(defaultContent, options.content || {});

    this.modal = null;
    this.overlay = null;
    this.initialView = null;
    this.settingsView = null;

    // Cookie category states
    this.categories = {
      necessary: true, // Always true, cannot be toggled
      analytics: false,
      marketing: false
    };

    // Focus management
    this.triggerElement = null;
    this.liveRegion = null;
  }

  /**
   * Deep merge two objects
   * @param {Object} target - The target object
   * @param {Object} source - The source object to merge
   * @returns {Object} The merged object
   */
  _mergeDeep(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = this._mergeDeep(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Generate a UUID v4 for consent tracking
   * @returns {string} UUID v4 string
   */
  _generateConsentId() {
    // Use crypto.randomUUID if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Encode data for storage (Base64 encoding when encryption is enabled)
   * @param {Object} data - Data to encode
   * @returns {string} Encoded string
   */
  _encodeData(data) {
    const jsonString = JSON.stringify(data);
    if (this.encryption) {
      // Use Base64 encoding for light obfuscation
      try {
        return btoa(unescape(encodeURIComponent(jsonString)));
      } catch (e) {
        this._log('Failed to encode data', e, 'error');
        return jsonString;
      }
    }
    return jsonString;
  }

  /**
   * Decode data from storage (with backward compatibility)
   * @param {string} encodedData - Encoded string
   * @returns {Object|null} Decoded data or null on failure
   */
  _decodeData(encodedData) {
    if (!encodedData) return null;

    // Try to parse as JSON first (backward compatibility with unencoded data)
    try {
      return JSON.parse(encodedData);
    } catch (e) {
      // Not plain JSON, try Base64 decoding
    }

    // Try Base64 decoding
    try {
      const decoded = decodeURIComponent(escape(atob(encodedData)));
      return JSON.parse(decoded);
    } catch (e) {
      this._log('Failed to decode data', e, 'error');
      return null;
    }
  }

  /**
   * Set a cookie with specified options
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   */
  _setCookie(name, value, options = {}) {
    const opts = { ...this.cookieOptions, ...options };
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (opts.expires) {
      const date = new Date();
      date.setTime(date.getTime() + (opts.expires * 24 * 60 * 60 * 1000));
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (opts.path) {
      cookieString += `; path=${opts.path}`;
    }

    if (opts.domain) {
      cookieString += `; domain=${opts.domain}`;
    }

    if (opts.sameSite) {
      cookieString += `; SameSite=${opts.sameSite}`;
    }

    if (opts.secure) {
      cookieString += '; Secure';
    }

    document.cookie = cookieString;
    this._log(`Cookie set: ${name}`, { value: value.substring(0, 50) + '...' });
  }

  /**
   * Get a cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  _getCookie(name) {
    const cookies = document.cookie.split(';');
    const encodedName = encodeURIComponent(name);

    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
      if (cookieName === encodedName) {
        return decodeURIComponent(cookieValueParts.join('='));
      }
    }
    return null;
  }

  /**
   * Delete a cookie
   * @param {string} name - Cookie name
   * @param {Object} options - Cookie options (path, domain)
   */
  _deleteCookie(name, options = {}) {
    const opts = { ...this.cookieOptions, ...options, expires: -1 };
    this._setCookie(name, '', opts);
    this._log(`Cookie deleted: ${name}`);
  }

  /**
   * Migrate consent from localStorage to cookies (or vice versa)
   */
  _migrateStorage() {
    if (this.storageMethod === 'cookie') {
      // Check if there's existing localStorage data to migrate
      try {
        const localData = localStorage.getItem(this.storageKey);
        if (localData && !this._getCookie(this.storageKey)) {
          this._log('Migrating consent from localStorage to cookies');
          const consent = this._decodeData(localData);
          if (consent) {
            // Save to cookie
            this._setCookie(this.storageKey, this._encodeData(consent));
            // Remove from localStorage
            localStorage.removeItem(this.storageKey);
            this._log('Migration complete', null, 'success');
          }
        }
      } catch (e) {
        this._log('Migration failed', e, 'error');
      }
    }
  }

  /**
   * Debug logging helper - only outputs when debug mode is enabled
   * @param {string} message - The log message
   * @param {*} data - Optional data to log
   * @param {string} type - Log type: 'info', 'warn', 'error', 'success'
   */
  _log(message, data = null, type = 'info') {
    if (!this.debug) return;

    const prefix = '%c[cconsent]';
    const styles = {
      info: 'color: #60a5fa; font-weight: bold;',
      warn: 'color: #fbbf24; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      success: 'color: #22c55e; font-weight: bold;'
    };

    const style = styles[type] || styles.info;

    if (data !== null) {
      console.log(prefix, style, message, data);
    } else {
      console.log(prefix, style, message);
    }
  }

  /**
   * Scan the document for scripts with data-cookie-category attribute
   */
  _scanScripts() {
    const scripts = document.querySelectorAll('script[data-cookie-category]');
    this.managedScripts = [];

    scripts.forEach((script) => {
      const category = script.getAttribute('data-cookie-category');
      const originalSrc = script.getAttribute('src') || null;
      const inlineContent = script.textContent || null;

      const managedScript = {
        element: script,
        category: category,
        originalSrc: originalSrc,
        inlineContent: inlineContent,
        blocked: false,
        executed: false
      };

      this.managedScripts.push(managedScript);
      this._log(`Found script: ${originalSrc || '[inline]'} (category: ${category})`);
    });

    this._log(`Total managed scripts: ${this.managedScripts.length}`);
  }

  /**
   * Evaluate all managed scripts based on current consent
   */
  _evaluateScripts() {
    this.managedScripts.forEach((script) => {
      const isAllowed = this.isAllowed(script.category);

      if (isAllowed && !script.executed) {
        this._allowScript(script);
      } else if (!isAllowed && !script.blocked) {
        this._blockScript(script);
      }
    });

    this._updateDebugBadge();
  }

  /**
   * Block a script from executing
   * @param {Object} script - Managed script object
   */
  _blockScript(script) {
    if (script.originalSrc) {
      // Remove src to prevent loading
      script.element.removeAttribute('src');
      // Set type to prevent execution
      script.element.setAttribute('type', 'text/plain');
    }
    script.blocked = true;
    this._log(`Script blocked: ${script.originalSrc || '[inline]'} (${script.category})`, null, 'warn');
  }

  /**
   * Allow a script to execute
   * @param {Object} script - Managed script object
   */
  _allowScript(script) {
    if (script.executed) return;

    if (script.originalSrc) {
      // Create a new script element to ensure it loads
      const newScript = document.createElement('script');
      newScript.src = script.originalSrc;
      newScript.setAttribute('data-cookie-category', script.category);
      newScript.setAttribute('data-cconsent-loaded', 'true');

      // Copy other attributes
      Array.from(script.element.attributes).forEach((attr) => {
        if (attr.name !== 'src' && attr.name !== 'type' && attr.name !== 'data-cookie-category') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });

      // Replace the old script
      script.element.parentNode.replaceChild(newScript, script.element);
      script.element = newScript;
    } else if (script.inlineContent) {
      // For inline scripts, create and execute
      const newScript = document.createElement('script');
      newScript.textContent = script.inlineContent;
      newScript.setAttribute('data-cookie-category', script.category);
      newScript.setAttribute('data-cconsent-loaded', 'true');

      script.element.parentNode.replaceChild(newScript, script.element);
      script.element = newScript;
    }

    script.blocked = false;
    script.executed = true;
    this._log(`Script allowed: ${script.originalSrc || '[inline]'} (${script.category})`, null, 'success');
  }

  /**
   * Export debug information
   * @returns {Object} Debug state snapshot
   */
  exportDebug() {
    return {
      consent: this.getConsent(),
      categories: { ...this.categories },
      scripts: this.managedScripts.map((s) => ({
        src: s.originalSrc || '[inline]',
        category: s.category,
        status: s.executed ? 'allowed' : (s.blocked ? 'blocked' : 'pending')
      })),
      timestamp: new Date().toISOString(),
      storageKey: this.storageKey,
      storageMethod: this.storageMethod,
      encryption: this.encryption,
      consentId: this.consentId,
      debugEnabled: this.debug
    };
  }

  /**
   * Get all focusable elements within the modal (visible and enabled only)
   * @returns {Array} Array of visible, enabled focusable elements
   */
  _getFocusableElements() {
    const elements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // Filter to only visible, enabled elements (not in hidden views, not disabled)
    return Array.from(elements).filter(el => {
      const isVisible = el.offsetParent !== null || el.closest('.cc-active');
      const isEnabled = !el.disabled;
      return isVisible && isEnabled;
    });
  }

  /**
   * Announce a message to screen readers via ARIA live region
   * @param {string} message - The message to announce
   */
  _announce(message) {
    if (this.liveRegion) {
      // Clear first to ensure re-announcement of identical messages
      this.liveRegion.textContent = '';
      requestAnimationFrame(() => {
        this.liveRegion.textContent = message;
      });
    }
  }

  /**
   * Initialize the cookie consent dialog
   * Shows the dialog if no consent has been given
   */
  init() {
    this._log('Initializing cookie consent...');
    this._log('Storage method: ' + this.storageMethod);

    // Migrate storage if needed (localStorage -> cookies)
    this._migrateStorage();

    // Scan for scripts with data-cookie-category
    this._scanScripts();

    // Expose global API
    this._exposeGlobalAPI();

    // Bind auto-open elements (data-cc-open)
    this._bindAutoOpenElements();

    // Check if consent already exists
    const existingConsent = this.getConsent();
    if (existingConsent) {
      // Load existing preferences
      this.categories = {
        necessary: true,
        analytics: existingConsent.analytics || false,
        marketing: existingConsent.marketing || false
      };
      this._log('Existing consent found:', this.categories, 'success');

      // Evaluate scripts based on existing consent
      this._evaluateScripts();

      // Create debug badge if debug mode enabled
      if (this.debug) {
        this._createDebugBadge();
      }

      // Create floating button (only after initial consent)
      this._createFloatingButton();

      return;
    }

    this._log('No consent found, showing dialog');

    // Block all non-necessary scripts until consent is given
    this._evaluateScripts();

    // Create debug badge if debug mode enabled
    if (this.debug) {
      this._createDebugBadge();
    }

    // Create and show the dialog
    this._createModal();
    this.show();
  }

  /**
   * Helper to create an element with attributes and children
   */
  _createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'textContent') {
        el.textContent = value;
      } else if (key.startsWith('data')) {
        el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child) {
        el.appendChild(child);
      }
    });

    return el;
  }

  /**
   * Create a toggle switch component
   */
  _createToggle(id, category, isRequired = false) {
    const toggle = this._createElement('div', { className: 'cc-toggle' });

    const status = this._createElement('span', {
      className: 'cc-toggle-status',
      textContent: isRequired ? 'Required' : 'Off'
    });
    if (!isRequired) {
      status.setAttribute('data-status', category);
    }

    const input = this._createElement('input', {
      type: 'checkbox',
      className: 'cc-toggle-input',
      id: id
    });
    input.setAttribute('role', 'switch');
    input.setAttribute('aria-checked', isRequired ? 'true' : 'false');
    if (isRequired) {
      input.checked = true;
      input.disabled = true;
    }
    if (!isRequired) {
      input.setAttribute('data-category', category);
    }

    const label = this._createElement('label', {
      for: id,
      className: 'cc-toggle-slider',
      'aria-label': isRequired
        ? 'Necessary cookies (always enabled)'
        : `Toggle ${category} cookies`
    });

    toggle.appendChild(status);
    toggle.appendChild(input);
    toggle.appendChild(label);

    return toggle;
  }

  /**
   * Create a cookie category card
   */
  _createCategoryCard(labelText, description, id, category, isRequired = false) {
    const card = this._createElement('div', { className: 'cc-category' });

    const info = this._createElement('div', { className: 'cc-category-info' });
    info.appendChild(this._createElement('span', {
      className: 'cc-category-label',
      textContent: labelText
    }));
    info.appendChild(this._createElement('span', {
      className: 'cc-category-description',
      textContent: description
    }));

    card.appendChild(info);
    card.appendChild(this._createToggle(id, category, isRequired));

    return card;
  }

  /**
   * Create a button element
   */
  _createButton(text, action, classes) {
    const btn = this._createElement('button', {
      type: 'button',
      className: `cc-btn ${classes}`,
      textContent: text
    });
    btn.setAttribute('data-action', action);
    return btn;
  }

  /**
   * Create the initial view
   */
  _createInitialView() {
    const view = this._createElement('div', { className: 'cc-view cc-active' });
    view.setAttribute('data-view', 'initial');

    // Heading
    const heading = this._createElement('h2', {
      className: 'cc-heading',
      id: 'cc-heading',
      textContent: this.content.initialView.heading
    });

    // Description with link
    const description = this._createElement('p', { className: 'cc-description' });
    description.appendChild(document.createTextNode(
      this.content.initialView.description.text
    ));

    const link = this._createElement('a', {
      href: this.policyUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      textContent: this.content.initialView.description.linkText
    });
    description.appendChild(link);
    description.appendChild(document.createTextNode(this.content.initialView.description.suffix));

    // Buttons container
    const buttons = this._createElement('div', { className: 'cc-buttons' });

    // Customize button
    buttons.appendChild(this._createButton(
      this.content.initialView.buttons.customize,
      'customize',
      'cc-btn-outline cc-btn-full'
    ));

    // Button row
    const buttonRow = this._createElement('div', { className: 'cc-buttons-row' });
    buttonRow.appendChild(this._createButton(
      this.content.initialView.buttons.rejectAll,
      'reject',
      'cc-btn-outline'
    ));
    buttonRow.appendChild(this._createButton(
      this.content.initialView.buttons.acceptAll,
      'accept',
      'cc-btn-primary'
    ));
    buttons.appendChild(buttonRow);

    view.appendChild(heading);
    view.appendChild(description);
    view.appendChild(buttons);

    return view;
  }

  /**
   * Create the settings view
   */
  _createSettingsView() {
    const view = this._createElement('div', { className: 'cc-view' });
    view.setAttribute('data-view', 'settings');

    // Heading
    view.appendChild(this._createElement('h2', {
      className: 'cc-heading',
      textContent: this.content.settingsView.heading
    }));

    // Description
    view.appendChild(this._createElement('p', {
      className: 'cc-description',
      textContent: this.content.settingsView.description
    }));

    // Categories
    const categories = this._createElement('div', { className: 'cc-categories' });
    categories.appendChild(this._createCategoryCard(
      'Necessary',
      this.content.categories.necessary,
      'cc-necessary',
      'necessary',
      true
    ));
    categories.appendChild(this._createCategoryCard(
      'Analytics',
      this.content.categories.analytics,
      'cc-analytics',
      'analytics',
      false
    ));
    categories.appendChild(this._createCategoryCard(
      'Marketing',
      this.content.categories.marketing,
      'cc-marketing',
      'marketing',
      false
    ));
    view.appendChild(categories);

    // Save button
    view.appendChild(this._createButton(
      this.content.settingsView.buttons.save,
      'save',
      'cc-btn-primary cc-btn-full'
    ));

    return view;
  }

  /**
   * Create the modal HTML structure
   */
  _createModal() {
    // Create overlay
    this.overlay = this._createElement('div', { className: 'cc-overlay' });
    this.overlay.setAttribute('aria-hidden', 'true');

    // Create modal
    this.modal = this._createElement('div', { className: 'cc-modal' });
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-labelledby', 'cc-heading');

    // Create views
    this.initialView = this._createInitialView();
    this.settingsView = this._createSettingsView();

    this.modal.appendChild(this.initialView);
    this.modal.appendChild(this.settingsView);

    // Append to body
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.modal);

    // Create ARIA live region for screen reader announcements
    this.liveRegion = this._createElement('div', {
      className: 'cc-sr-only',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });
    document.body.appendChild(this.liveRegion);

    // Bind events
    this._bindEvents();
  }

  /**
   * Bind all event listeners
   */
  _bindEvents() {
    // Button clicks
    this.modal.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      switch (action) {
        case 'customize':
          this.showSettings();
          break;
        case 'accept':
          this.acceptAll();
          break;
        case 'reject':
          this.rejectAll();
          break;
        case 'save':
          this.savePreferences();
          break;
      }
    });

    // Toggle switches
    this.modal.querySelectorAll('.cc-toggle-input[data-category]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const category = e.target.dataset.category;
        const isChecked = e.target.checked;
        this.categories[category] = isChecked;

        // Update aria-checked for screen readers
        e.target.setAttribute('aria-checked', isChecked ? 'true' : 'false');

        // Update status text
        const statusEl = this.modal.querySelector(`[data-status="${category}"]`);
        if (statusEl) {
          statusEl.textContent = isChecked ? 'On' : 'Off';
        }

        // Add bounce animation to the slider
        const slider = e.target.nextElementSibling;
        if (slider && slider.classList.contains('cc-toggle-slider')) {
          slider.classList.add('cc-toggle-animating');
          slider.addEventListener('animationend', () => {
            slider.classList.remove('cc-toggle-animating');
          }, { once: true });
        }
      });
    });

    // Keyboard navigation
    this.modal.addEventListener('keydown', (e) => {
      // ESC closes modal and rejects non-essential cookies
      if (e.key === 'Escape') {
        e.preventDefault();
        this.rejectAll();
        return;
      }

      // Focus trap: cycle through focusable elements
      if (e.key === 'Tab') {
        const focusable = this._getFocusableElements();
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /**
   * Create the debug badge UI
   */
  _createDebugBadge() {
    if (this.debugBadge) {
      this.debugBadge.remove();
    }

    const badge = this._createElement('div', { className: 'cc-debug-badge' });

    // Header (collapsible)
    const header = this._createElement('div', { className: 'cc-debug-header' });
    const headerIcon = this._createElement('span', {
      className: 'cc-debug-icon',
      textContent: '🍪'
    });
    const headerText = document.createTextNode(' Cookie Consent Debug');
    header.appendChild(headerIcon);
    header.appendChild(headerText);
    header.addEventListener('click', () => {
      badge.classList.toggle('cc-debug-collapsed');
    });

    // Content container
    const content = this._createElement('div', { className: 'cc-debug-content' });

    // Consent status rows
    const statusContainer = this._createElement('div', { className: 'cc-debug-status' });

    ['necessary', 'analytics', 'marketing'].forEach((category) => {
      const row = this._createElement('div', { className: 'cc-debug-row' });
      const label = this._createElement('span', {
        className: 'cc-debug-label',
        textContent: category.charAt(0).toUpperCase() + category.slice(1)
      });
      const value = this._createElement('span', {
        className: 'cc-debug-value'
      });
      value.setAttribute('data-debug-category', category);
      row.appendChild(label);
      row.appendChild(value);
      statusContainer.appendChild(row);
    });

    content.appendChild(statusContainer);

    // Scripts section
    const scriptsSection = this._createElement('div', { className: 'cc-debug-scripts' });
    const scriptsHeader = this._createElement('div', {
      className: 'cc-debug-scripts-header',
      textContent: 'Managed Scripts'
    });
    const scriptsCount = this._createElement('span', { className: 'cc-debug-scripts-count' });
    scriptsHeader.appendChild(scriptsCount);
    scriptsSection.appendChild(scriptsHeader);

    const scriptsTable = this._createElement('div', { className: 'cc-debug-table' });
    scriptsSection.appendChild(scriptsTable);
    content.appendChild(scriptsSection);

    // Simulation buttons
    const buttons = this._createElement('div', { className: 'cc-debug-buttons' });

    const clearBtn = this._createElement('button', {
      className: 'cc-debug-btn',
      textContent: 'Clear Consent'
    });
    clearBtn.addEventListener('click', () => {
      this._log('Debug: Clearing consent');
      this.resetConsent();
    });

    const randomBtn = this._createElement('button', {
      className: 'cc-debug-btn',
      textContent: 'Randomize'
    });
    randomBtn.addEventListener('click', () => {
      this._log('Debug: Randomizing consent');
      this.categories = {
        necessary: true,
        analytics: Math.random() > 0.5,
        marketing: Math.random() > 0.5
      };
      this._saveToStorage();
      this._evaluateScripts();
      this._updateDebugBadge();
      this._log('Randomized consent:', this.categories);
    });

    const exportBtn = this._createElement('button', {
      className: 'cc-debug-btn',
      textContent: 'Export'
    });
    exportBtn.addEventListener('click', () => {
      const debugData = this.exportDebug();
      console.log('%c[cconsent] Debug Export:', 'color: #60a5fa; font-weight: bold;', debugData);
      // Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(debugData, null, 2)).then(() => {
        exportBtn.textContent = 'Copied!';
        setTimeout(() => {
          exportBtn.textContent = 'Export';
        }, 1500);
      });
    });

    buttons.appendChild(clearBtn);
    buttons.appendChild(randomBtn);
    buttons.appendChild(exportBtn);
    content.appendChild(buttons);

    badge.appendChild(header);
    badge.appendChild(content);

    document.body.appendChild(badge);
    this.debugBadge = badge;

    this._updateDebugBadge();
  }

  /**
   * Update the debug badge with current state
   */
  _updateDebugBadge() {
    if (!this.debugBadge) return;

    const consent = this.getConsent();

    // Update category status
    ['necessary', 'analytics', 'marketing'].forEach((category) => {
      const el = this.debugBadge.querySelector(`[data-debug-category="${category}"]`);
      if (el) {
        const isAllowed = consent ? consent[category] : (category === 'necessary');
        el.textContent = isAllowed ? '🟢 ON' : '🔴 OFF';
        el.className = 'cc-debug-value ' + (isAllowed ? 'cc-debug-allowed' : 'cc-debug-denied');
      }
    });

    // Update scripts table
    const table = this.debugBadge.querySelector('.cc-debug-table');
    const count = this.debugBadge.querySelector('.cc-debug-scripts-count');

    if (table) {
      // Clear existing rows safely
      while (table.firstChild) {
        table.removeChild(table.firstChild);
      }

      if (this.managedScripts.length === 0) {
        const emptyRow = this._createElement('div', {
          className: 'cc-debug-table-empty',
          textContent: 'No managed scripts found'
        });
        table.appendChild(emptyRow);
      } else {
        this.managedScripts.forEach((script) => {
          const row = this._createElement('div', { className: 'cc-debug-table-row' });

          const srcCell = this._createElement('span', {
            className: 'cc-debug-table-src',
            textContent: script.originalSrc ? script.originalSrc.split('/').pop() : '[inline]'
          });
          srcCell.title = script.originalSrc || 'Inline script';

          const categoryCell = this._createElement('span', {
            className: 'cc-debug-table-category',
            textContent: script.category
          });

          const statusCell = this._createElement('span', {
            className: 'cc-debug-table-status'
          });

          if (script.executed) {
            statusCell.textContent = '🟢 Loaded';
            statusCell.classList.add('cc-debug-allowed');
          } else if (script.blocked) {
            statusCell.textContent = '🔴 Blocked';
            statusCell.classList.add('cc-debug-denied');
          } else {
            statusCell.textContent = '⏳ Pending';
          }

          row.appendChild(srcCell);
          row.appendChild(categoryCell);
          row.appendChild(statusCell);
          table.appendChild(row);
        });
      }
    }

    if (count) {
      const blockedCount = this.managedScripts.filter((s) => s.blocked && !s.executed).length;
      count.textContent = blockedCount > 0 ? ` (${blockedCount} blocked)` : '';
    }
  }

  /**
   * Get current consent status for visual indicators
   * @returns {string} 'all' | 'partial' | 'essential'
   */
  _getConsentStatus() {
    const consent = this.getConsent();
    if (!consent) return 'essential';

    const analytics = consent.analytics === true;
    const marketing = consent.marketing === true;

    if (analytics && marketing) return 'all';
    if (analytics || marketing) return 'partial';
    return 'essential';
  }

  /**
   * Get the count of active cookie categories
   * @returns {number} Number of active categories (1-3)
   */
  _getActiveCategoryCount() {
    const consent = this.getConsent();
    if (!consent) return 1; // Only necessary

    let count = 1; // Necessary is always active
    if (consent.analytics) count++;
    if (consent.marketing) count++;
    return count;
  }

  /**
   * Get SVG icon for floating button
   * @param {string} iconType - Icon type or custom SVG
   * @returns {string} SVG markup
   */
  _getFloatingButtonIcon(iconType) {
    const icons = {
      cookie: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-.34-.017-.676-.05-1.008a3.5 3.5 0 0 1-3.95-3.95A10.018 10.018 0 0 0 12 2zm-1 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
      shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2L4 6v6c0 5.25 3.4 10.2 8 12 4.6-1.8 8-6.75 8-12V6l-8-4zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>',
      gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'
    };

    // Return custom SVG if provided, otherwise return predefined icon
    if (iconType.startsWith('<svg')) {
      return iconType;
    }
    return icons[iconType] || icons.cookie;
  }

  /**
   * Create the floating settings button
   */
  _createFloatingButton() {
    if (!this.floatingButtonConfig.enabled) return;
    if (this.floatingButton) {
      this.floatingButton.remove();
    }

    const config = this.floatingButtonConfig;
    const status = this._getConsentStatus();
    const activeCount = this._getActiveCategoryCount();

    // Create button container
    const button = this._createElement('button', {
      type: 'button',
      className: `cc-floating-btn cc-floating-${config.position}`
    });

    // Set positioning via CSS custom properties
    button.style.setProperty('--cc-floating-offset-x', `${config.offset.x}px`);
    button.style.setProperty('--cc-floating-offset-y', `${config.offset.y}px`);

    // Accessibility attributes
    button.setAttribute('aria-label', `${config.label}, currently accepting ${activeCount} of 3 categories`);
    button.setAttribute('title', config.label);

    // Icon container
    const iconWrapper = this._createElement('span', { className: 'cc-floating-icon' });
    iconWrapper.innerHTML = this._getFloatingButtonIcon(config.icon);
    button.appendChild(iconWrapper);

    // Status indicator
    if (config.showIndicator) {
      const indicator = this._createElement('span', {
        className: `cc-floating-indicator cc-floating-indicator-${status}`
      });
      indicator.setAttribute('data-count', activeCount);
      button.appendChild(indicator);
    }

    // Click handler
    button.addEventListener('click', () => {
      this.triggerElement = button; // Store for focus restoration
      if (!this.modal) {
        this._createModal();
      }
      this.show();
    });

    document.body.appendChild(button);
    this.floatingButton = button;

    this._log('Floating button created', { position: config.position, status });
  }

  /**
   * Update the floating button's status indicator
   */
  _updateFloatingButton() {
    if (!this.floatingButton || !this.floatingButtonConfig.showIndicator) return;

    const status = this._getConsentStatus();
    const activeCount = this._getActiveCategoryCount();
    const indicator = this.floatingButton.querySelector('.cc-floating-indicator');

    if (indicator) {
      // Update status class
      indicator.className = `cc-floating-indicator cc-floating-indicator-${status}`;
      indicator.setAttribute('data-count', activeCount);
    }

    // Update aria-label
    this.floatingButton.setAttribute(
      'aria-label',
      `${this.floatingButtonConfig.label}, currently accepting ${activeCount} of 3 categories`
    );

    this._log('Floating button updated', { status, activeCount });
  }

  /**
   * Bind click handlers to elements with data-cc-open attribute
   */
  _bindAutoOpenElements() {
    const elements = document.querySelectorAll('[data-cc-open]');

    elements.forEach((el) => {
      // Avoid binding multiple times
      if (el.hasAttribute('data-cc-bound')) return;

      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerElement = el; // Store for focus restoration
        if (!this.modal) {
          this._createModal();
        }
        this.show();
      });

      el.setAttribute('data-cc-bound', 'true');
      this._log(`Auto-bound element: ${el.tagName}`, { text: el.textContent?.trim() });
    });

    if (elements.length > 0) {
      this._log(`Bound ${elements.length} element(s) with data-cc-open`);
    }
  }

  /**
   * Expose global API on window object
   */
  _exposeGlobalAPI() {
    const self = this;

    window.CookieConsent = {
      /**
       * Show the consent dialog
       */
      show: () => {
        if (!self.modal) {
          self._createModal();
        }
        self.show();
      },

      /**
       * Show the settings view directly
       */
      showSettings: () => {
        if (!self.modal) {
          self._createModal();
        }
        self.show();
        // Small delay to ensure modal is visible before switching views
        requestAnimationFrame(() => {
          self.showSettings();
        });
      },

      /**
       * Hide the consent dialog
       */
      hide: () => {
        self.hide();
      },

      /**
       * Get current consent object
       * @returns {Object|null}
       */
      getConsent: () => {
        return self.getConsent();
      },

      /**
       * Check if a category is allowed
       * @param {string} category
       * @returns {boolean}
       */
      isAllowed: (category) => {
        return self.isAllowed(category);
      },

      /**
       * Reset consent and show dialog
       */
      resetConsent: () => {
        self.resetConsent();
      },

      /**
       * Get consent status ('all', 'partial', 'essential')
       * @returns {string}
       */
      getStatus: () => {
        return self._getConsentStatus();
      }
    };

    this._log('Global API exposed on window.CookieConsent');
  }

  /**
   * Show the cookie consent modal
   */
  show() {
    // Store the currently focused element for restoration on close
    this.triggerElement = document.activeElement;

    this.overlay.classList.add('cc-visible');
    this.modal.classList.add('cc-visible');

    // Hide floating button while modal is open
    if (this.floatingButton) {
      this.floatingButton.classList.add('cc-floating-hidden');
    }

    // Focus the first button for accessibility
    requestAnimationFrame(() => {
      const firstButton = this.modal.querySelector('button');
      if (firstButton) firstButton.focus();
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide the cookie consent modal
   */
  hide() {
    this.overlay.classList.remove('cc-visible');
    this.modal.classList.remove('cc-visible');

    // Show floating button again
    if (this.floatingButton) {
      this.floatingButton.classList.remove('cc-floating-hidden');
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus to the element that triggered the modal
    if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
      this.triggerElement.focus();
    }
  }

  /**
   * Switch to the settings view
   */
  showSettings() {
    this.initialView.classList.remove('cc-active');

    // Use requestAnimationFrame for smooth transition sequencing
    requestAnimationFrame(() => {
      this.settingsView.classList.add('cc-active');

      // Sync toggle states with current categories
      this._syncToggles();

      // Focus the first toggle after transition starts
      requestAnimationFrame(() => {
        const firstToggle = this.settingsView.querySelector('.cc-toggle-input:not(:disabled)');
        if (firstToggle) firstToggle.focus();
      });
    });
  }

  /**
   * Switch back to the initial view
   */
  showInitial() {
    this.settingsView.classList.remove('cc-active');

    requestAnimationFrame(() => {
      this.initialView.classList.add('cc-active');
    });
  }

  /**
   * Sync toggle UI with category states
   */
  _syncToggles() {
    Object.keys(this.categories).forEach((category) => {
      const input = this.modal.querySelector(`#cc-${category}`);
      const statusEl = this.modal.querySelector(`[data-status="${category}"]`);

      if (input && !input.disabled) {
        input.checked = this.categories[category];
        input.setAttribute('aria-checked', this.categories[category] ? 'true' : 'false');
      }
      if (statusEl) {
        statusEl.textContent = this.categories[category] ? 'On' : 'Off';
      }
    });
  }

  /**
   * Set loading state on a button
   * @param {HTMLElement} button - The button element
   * @param {boolean} loading - Whether to show loading state
   */
  _setButtonLoading(button, loading) {
    if (!button) return;
    if (loading) {
      button.classList.add('cc-btn-loading');
      button.setAttribute('aria-busy', 'true');
    } else {
      button.classList.remove('cc-btn-loading');
      button.removeAttribute('aria-busy');
    }
  }

  /**
   * Execute a callback and wait for it if it returns a Promise
   * @param {Function} callback - The callback to execute
   * @param {Object} data - Data to pass to the callback
   * @returns {Promise}
   */
  async _executeCallback(callback, data) {
    if (!callback) return;
    const result = callback(data);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Accept all cookies
   */
  async acceptAll() {
    const button = this.modal?.querySelector('[data-action="accept"]');
    this._setButtonLoading(button, true);

    this.categories = {
      necessary: true,
      analytics: true,
      marketing: true
    };

    this._log('All cookies accepted', this.categories, 'success');
    this._saveToStorage();
    this._evaluateScripts();
    this._updateDebugBadge();
    this._announce('Cookie preferences saved. All cookies accepted.');

    // Create floating button on first consent, or update existing
    if (!this.floatingButton) {
      this._createFloatingButton();
    } else {
      this._updateFloatingButton();
    }

    await this._executeCallback(this.onAccept, this.categories);

    this._setButtonLoading(button, false);
    this.hide();
  }

  /**
   * Reject all non-essential cookies
   */
  async rejectAll() {
    const button = this.modal?.querySelector('[data-action="reject"]');
    this._setButtonLoading(button, true);

    this.categories = {
      necessary: true,
      analytics: false,
      marketing: false
    };

    this._log('Non-essential cookies rejected', this.categories, 'warn');
    this._saveToStorage();
    this._evaluateScripts();
    this._updateDebugBadge();
    this._announce('Cookie preferences saved. Non-essential cookies rejected.');

    // Create floating button on first consent, or update existing
    if (!this.floatingButton) {
      this._createFloatingButton();
    } else {
      this._updateFloatingButton();
    }

    await this._executeCallback(this.onReject, this.categories);

    this._setButtonLoading(button, false);
    this.hide();
  }

  /**
   * Save current preferences
   */
  async savePreferences() {
    const button = this.modal?.querySelector('[data-action="save"]');
    this._setButtonLoading(button, true);

    // Read current toggle states
    this.modal.querySelectorAll('.cc-toggle-input[data-category]').forEach((input) => {
      const category = input.dataset.category;
      this.categories[category] = input.checked;
    });

    this._log('Preferences saved', this.categories, 'success');
    this._saveToStorage();
    this._evaluateScripts();
    this._updateDebugBadge();
    this._announce('Cookie preferences saved.');

    // Create floating button on first consent, or update existing
    if (!this.floatingButton) {
      this._createFloatingButton();
    } else {
      this._updateFloatingButton();
    }

    await this._executeCallback(this.onSave, this.categories);

    this._setButtonLoading(button, false);
    this.hide();
  }

  /**
   * Save consent to storage (localStorage or cookie)
   */
  _saveToStorage() {
    // Generate consent ID if enabled and not already set
    if (this.generateConsentId && !this.consentId) {
      this.consentId = this._generateConsentId();
    }

    const consent = {
      necessary: this.categories.necessary,
      analytics: this.categories.analytics,
      marketing: this.categories.marketing,
      timestamp: new Date().toISOString()
    };

    // Add consent ID if generated
    if (this.consentId) {
      consent.consentId = this.consentId;
    }

    const encodedData = this._encodeData(consent);

    try {
      if (this.storageMethod === 'cookie') {
        this._setCookie(this.storageKey, encodedData);
      } else {
        localStorage.setItem(this.storageKey, encodedData);
      }
      this._log('Consent saved to ' + this.storageMethod, consent);
    } catch (e) {
      console.warn('Cookie consent: Unable to save to ' + this.storageMethod, e);
    }
  }

  /**
   * Get current consent from storage (localStorage or cookie)
   * @returns {Object|null} Consent object or null if not found
   */
  getConsent() {
    try {
      let stored;
      if (this.storageMethod === 'cookie') {
        stored = this._getCookie(this.storageKey);
      } else {
        stored = localStorage.getItem(this.storageKey);
      }

      if (!stored) return null;

      const consent = this._decodeData(stored);

      // Store consent ID if present
      if (consent && consent.consentId) {
        this.consentId = consent.consentId;
      }

      return consent;
    } catch (e) {
      console.warn('Cookie consent: Unable to read from ' + this.storageMethod, e);
      return null;
    }
  }

  /**
   * Clear consent and show dialog again
   */
  resetConsent() {
    try {
      if (this.storageMethod === 'cookie') {
        this._deleteCookie(this.storageKey);
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {
      console.warn('Cookie consent: Unable to clear ' + this.storageMethod, e);
    }

    this.categories = {
      necessary: true,
      analytics: false,
      marketing: false
    };

    // Reset consent ID
    this.consentId = null;

    this._log('Consent reset', null, 'warn');

    // Remove existing modal if present
    if (this.modal) {
      this.modal.remove();
      this.overlay.remove();
    }

    // Rescan scripts (they may have been replaced)
    this._scanScripts();
    this._evaluateScripts();
    this._updateDebugBadge();

    // Recreate and show
    this._createModal();
    this.showInitial();
    this.show();
  }

  /**
   * Check if a specific cookie category is allowed
   * @param {string} category - The category to check
   * @returns {boolean}
   */
  isAllowed(category) {
    const consent = this.getConsent();
    const allowed = consent ? consent[category] === true : category === 'necessary';
    this._log(`Category '${category}' checked: ${allowed ? 'allowed' : 'denied'}`);
    return allowed;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieConsent;
}
