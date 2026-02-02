import type { ManagedScriptInfo, ManagedIframeInfo } from '../types';

interface ManagedScript {
  element: HTMLScriptElement;
  category: string;
  originalSrc: string | null;
  inlineContent: string | null;
  blocked: boolean;
  executed: boolean;
}

interface ManagedIframe {
  element: HTMLIFrameElement;
  category: string;
  originalSrc: string | null;
  blocked: boolean;
  placeholder: HTMLElement | null;
}

/**
 * Script and iframe blocking manager
 */
export class ScriptManager {
  private managedScripts: ManagedScript[] = [];
  private managedIframes: ManagedIframe[] = [];
  private observer: MutationObserver | null = null;
  private isAllowedFn: (category: string) => boolean;

  constructor(isAllowedFn: (category: string) => boolean) {
    this.isAllowedFn = isAllowedFn;
  }

  /**
   * Parse category attribute (supports multiple categories and negation)
   */
  private parseCategories(categoryAttr: string): { required: string[]; excluded: string[] } {
    const categories = categoryAttr.trim().split(/\s+/);
    const required: string[] = [];
    const excluded: string[] = [];

    categories.forEach((cat) => {
      if (cat.startsWith('!')) {
        excluded.push(cat.slice(1));
      } else {
        required.push(cat);
      }
    });

    return { required, excluded };
  }

  /**
   * Check if an element should be allowed
   */
  shouldAllow(categoryAttr: string): boolean {
    const { required, excluded } = this.parseCategories(categoryAttr);

    for (const cat of excluded) {
      if (this.isAllowedFn(cat)) return false;
    }

    for (const cat of required) {
      if (this.isAllowedFn(cat)) return true;
    }

    return required.length === 0;
  }

  /**
   * Scan for scripts
   */
  scanScripts(): void {
    const scripts = document.querySelectorAll('script[data-cookie-category]');
    this.managedScripts = [];

    scripts.forEach((script) => {
      if (script.hasAttribute('data-cconsent-loaded')) return;

      const el = script as HTMLScriptElement;
      this.managedScripts.push({
        element: el,
        category: el.getAttribute('data-cookie-category') || '',
        originalSrc: el.getAttribute('src'),
        inlineContent: el.textContent,
        blocked: false,
        executed: false
      });
    });
  }

  /**
   * Scan for iframes
   */
  scanIframes(): void {
    const iframes = document.querySelectorAll('iframe[data-cookie-category]');
    this.managedIframes = [];

    iframes.forEach((iframe) => {
      if (iframe.hasAttribute('data-cconsent-processed')) return;

      const el = iframe as HTMLIFrameElement;
      el.setAttribute('data-cconsent-processed', 'true');

      this.managedIframes.push({
        element: el,
        category: el.getAttribute('data-cookie-category') || '',
        originalSrc: el.getAttribute('data-src') || el.getAttribute('src'),
        blocked: false,
        placeholder: null
      });
    });
  }

  /**
   * Initialize mutation observer
   */
  initObserver(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          const el = node as Element;

          if (el.nodeName === 'SCRIPT' && el.hasAttribute('data-cookie-category')) {
            this.processNewScript(el as HTMLScriptElement);
          }
          if (el.nodeName === 'IFRAME' && el.hasAttribute('data-cookie-category')) {
            this.processNewIframe(el as HTMLIFrameElement);
          }

          // Check children
          el.querySelectorAll?.('script[data-cookie-category]').forEach((s) => {
            this.processNewScript(s as HTMLScriptElement);
          });
          el.querySelectorAll?.('iframe[data-cookie-category]').forEach((i) => {
            this.processNewIframe(i as HTMLIFrameElement);
          });
        });
      });
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Process a new script
   */
  private processNewScript(script: HTMLScriptElement): void {
    if (script.hasAttribute('data-cconsent-loaded')) return;

    const managed: ManagedScript = {
      element: script,
      category: script.getAttribute('data-cookie-category') || '',
      originalSrc: script.getAttribute('src'),
      inlineContent: script.textContent,
      blocked: false,
      executed: false
    };

    this.managedScripts.push(managed);

    if (this.shouldAllow(managed.category)) {
      this.allowScript(managed);
    } else {
      this.blockScript(managed);
    }
  }

  /**
   * Process a new iframe
   */
  private processNewIframe(iframe: HTMLIFrameElement): void {
    if (iframe.hasAttribute('data-cconsent-processed')) return;

    iframe.setAttribute('data-cconsent-processed', 'true');

    const managed: ManagedIframe = {
      element: iframe,
      category: iframe.getAttribute('data-cookie-category') || '',
      originalSrc: iframe.getAttribute('data-src') || iframe.getAttribute('src'),
      blocked: false,
      placeholder: null
    };

    this.managedIframes.push(managed);

    if (this.shouldAllow(managed.category)) {
      this.allowIframe(managed);
    } else {
      this.blockIframe(managed);
    }
  }

  /**
   * Block a script
   */
  private blockScript(script: ManagedScript): void {
    if (script.originalSrc) {
      script.element.removeAttribute('src');
      script.element.setAttribute('type', 'text/plain');
    } else if (script.inlineContent) {
      // For inline scripts, set type to text/plain
      // Note: Inline scripts must use type="text/plain" from the start to be truly blocked
      script.element.setAttribute('type', 'text/plain');
      script.element.textContent = ''; // Clear to prevent potential re-parsing
    }
    script.blocked = true;
  }

  /**
   * Allow a script
   */
  private allowScript(script: ManagedScript): void {
    if (script.executed) return;

    const newScript = document.createElement('script');

    if (script.originalSrc) {
      newScript.src = script.originalSrc;
    } else if (script.inlineContent) {
      newScript.textContent = script.inlineContent;
    }

    newScript.setAttribute('data-cookie-category', script.category);
    newScript.setAttribute('data-cconsent-loaded', 'true');

    Array.from(script.element.attributes).forEach((attr) => {
      if (!['src', 'type', 'data-cookie-category'].includes(attr.name)) {
        newScript.setAttribute(attr.name, attr.value);
      }
    });

    script.element.parentNode?.replaceChild(newScript, script.element);
    script.element = newScript;
    script.blocked = false;
    script.executed = true;
  }

  /**
   * Block an iframe
   */
  private blockIframe(iframe: ManagedIframe): void {
    if (!iframe.element.hasAttribute('data-src') && iframe.originalSrc) {
      iframe.element.setAttribute('data-src', iframe.originalSrc);
    }

    iframe.element.removeAttribute('src');
    iframe.element.classList.add('cc-blocked');
    iframe.element.style.display = 'none';
    iframe.blocked = true;
  }

  /**
   * Allow an iframe
   */
  private allowIframe(iframe: ManagedIframe): void {
    if (iframe.originalSrc) {
      iframe.element.setAttribute('src', iframe.originalSrc);
    }

    iframe.element.classList.remove('cc-blocked');
    iframe.element.style.display = '';

    if (iframe.placeholder) {
      iframe.placeholder.remove();
      iframe.placeholder = null;
    }

    iframe.blocked = false;
  }

  /**
   * Evaluate all scripts and iframes
   */
  evaluate(): void {
    this.managedScripts.forEach((script) => {
      const allowed = this.shouldAllow(script.category);
      if (allowed && !script.executed) {
        this.allowScript(script);
      } else if (!allowed && !script.blocked) {
        this.blockScript(script);
      }
    });

    this.managedIframes.forEach((iframe) => {
      const allowed = this.shouldAllow(iframe.category);
      if (allowed && iframe.blocked) {
        this.allowIframe(iframe);
      } else if (!allowed && !iframe.blocked) {
        this.blockIframe(iframe);
      }
    });
  }

  /**
   * Get managed scripts info
   */
  getManagedScripts(): ManagedScriptInfo[] {
    return this.managedScripts.map((s) => ({
      src: s.originalSrc || '[inline]',
      category: s.category,
      status: s.executed ? 'allowed' : s.blocked ? 'blocked' : 'pending'
    }));
  }

  /**
   * Get managed iframes info
   */
  getManagedIframes(): ManagedIframeInfo[] {
    return this.managedIframes.map((i) => ({
      src: i.originalSrc || '[no src]',
      category: i.category,
      status: i.blocked ? 'blocked' : 'allowed'
    }));
  }

  /**
   * Destroy observer
   */
  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
