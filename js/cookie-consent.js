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
   * Initialize the cookie consent dialog
   * Shows the dialog if no consent has been given
   */
  init() {
    // Check if consent already exists
    const existingConsent = this.getConsent();
    if (existingConsent) {
      // Load existing preferences
      this.categories = {
        necessary: true,
        analytics: existingConsent.analytics || false,
        marketing: existingConsent.marketing || false
      };
      return;
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

        // Update status text
        const statusEl = this.modal.querySelector(`[data-status="${category}"]`);
        if (statusEl) {
          statusEl.textContent = isChecked ? 'On' : 'Off';
        }
      });
    });

    // Keyboard navigation
    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Don't allow escape to close - user must make a choice
        e.preventDefault();
      }
    });
  }

  /**
   * Show the cookie consent modal
   */
  show() {
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

    this._saveToStorage();
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

    this._saveToStorage();
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

    this._saveToStorage();
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

    // Remove existing modal if present
    if (this.modal) {
      this.modal.remove();
      this.overlay.remove();
    }

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
    if (!consent) return category === 'necessary';
    return consent[category] === true;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieConsent;
}
