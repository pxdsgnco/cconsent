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

    // Scan for scripts with data-cookie-category
    this._scanScripts();

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
   * Show the cookie consent modal
   */
  show() {
    // Store the currently focused element for restoration on close
    this.triggerElement = document.activeElement;

    this.overlay.classList.add('cc-visible');
    this.modal.classList.add('cc-visible');

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
    this.settingsView.classList.add('cc-active');

    // Sync toggle states with current categories
    this._syncToggles();

    // Focus the first toggle
    const firstToggle = this.settingsView.querySelector('.cc-toggle-input:not(:disabled)');
    if (firstToggle) firstToggle.focus();
  }

  /**
   * Switch back to the initial view
   */
  showInitial() {
    this.settingsView.classList.remove('cc-active');
    this.initialView.classList.add('cc-active');
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
   * Accept all cookies
   */
  acceptAll() {
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
    this.hide();

    if (this.onAccept) {
      this.onAccept(this.categories);
    }
  }

  /**
   * Reject all non-essential cookies
   */
  rejectAll() {
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
    this.hide();

    if (this.onReject) {
      this.onReject(this.categories);
    }
  }

  /**
   * Save current preferences
   */
  savePreferences() {
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
    this.hide();

    if (this.onSave) {
      this.onSave(this.categories);
    }
  }

  /**
   * Save consent to localStorage
   */
  _saveToStorage() {
    const consent = {
      necessary: this.categories.necessary,
      analytics: this.categories.analytics,
      marketing: this.categories.marketing,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(consent));
    } catch (e) {
      console.warn('Cookie consent: Unable to save to localStorage', e);
    }
  }

  /**
   * Get current consent from localStorage
   * @returns {Object|null} Consent object or null if not found
   */
  getConsent() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Cookie consent: Unable to read from localStorage', e);
      return null;
    }
  }

  /**
   * Clear consent and show dialog again
   */
  resetConsent() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Cookie consent: Unable to clear localStorage', e);
    }

    this.categories = {
      necessary: true,
      analytics: false,
      marketing: false
    };

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
