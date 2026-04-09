/**
 * Remove Tawk.to Branding
 *
 * What it hides:
 *   - Footer branding links (tawk.to, utm_source=tawk-messenger)
 *   - "Add Chat to your website" link
 *   - Popout button/icon
 *   - Branding container classes
 *
 * Key design decisions:
 *   - CSS injection over DOM removal (less disruptive, survives re-renders)
 *   - MutationObserver over setInterval (reacts to changes, no wasted cycles)
 *   - Debounced re-scans (Tawk rebuilds its widget DOM sometimes)
 *   - iframe `load` listener stays active (catches SPA navigations)
 *   - JS fallback for popout buttons (`:has()` unsupported in older browsers)
 */
;(function removeTawkBranding() {
  "use strict";

  // ── Config ────────────────────────────────────────────────────────────

  var STYLE_ID = "hide-tawk-branding";

  // NOTE: No `:contains()` (jQuery-only, invalid in browsers).
  //       No `:has()` in CSS (Firefox < 121, older Safari/Chrome).
  //       Popout buttons handled via JS fallback below.
  var BRANDING_CSS = [
    "a[href*='tawk.to'] { display: none !important; }",
    "a[href*='utm_source=tawk-messenger'] { display: none !important; }",
    "a[title*='Add Chat to your website'] { display: none !important; }",
    ".tawk-branding { display: none !important; }",
    "[class*='tawk-branding'] { display: none !important; }",
    ".tawk-padding-small { display: none !important; }",
    ".tawk-icon-popout { display: none !important; }",
  ].join("\n");

  var RETRY_DELAY_MS = 1500;

  // ── State ─────────────────────────────────────────────────────────────

  var processedIframes = new WeakSet();
  var pendingRetries = new Map();
  var debounceTimer = null;

  // ── Core ──────────────────────────────────────────────────────────────

  /**
   * Inject a <style> into a document. Returns true on success.
   */
  function injectStyle(doc) {
    try {
      if (!doc || !doc.createElement) return false;
      if (doc.getElementById(STYLE_ID)) return true;

      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = BRANDING_CSS;

      var target = doc.head || doc.documentElement;
      if (target) {
        target.appendChild(style);
        return true;
      }
    } catch (_) {
      // Cross-origin — expected.
    }
    return false;
  }

  /**
   * JS fallback: hide popout buttons for browsers without CSS `:has()`.
   */
  function hidePopoutButtons(doc) {
    try {
      if (!doc || !doc.querySelectorAll) return;
      var icons = doc.querySelectorAll(".tawk-icon-popout");
      for (var i = 0; i < icons.length; i++) {
        var btn = icons[i].closest("button");
        if (btn) btn.style.setProperty("display", "none", "important");
      }
    } catch (_) {}
  }

  /**
   * Inject styles into an iframe. Retries once if contentDocument isn't ready.
   */
  function injectIntoIframe(iframe) {
    try {
      var doc = iframe.contentDocument;
      if (!doc) {
        // Schedule a single retry if iframe not ready yet
        if (!pendingRetries.has(iframe)) {
          var timeout = setTimeout(function () {
            pendingRetries.delete(iframe);
            injectIntoIframe(iframe);
          }, RETRY_DELAY_MS);
          pendingRetries.set(iframe, timeout);
        }
        return;
      }

      injectStyle(doc);
      hidePopoutButtons(doc);
    } catch (_) {
      // Cross-origin — expected.
    }
  }

  /**
   * Process a chat iframe: mark as processed, inject now, re-inject on reload.
   */
  function handleIframe(iframe) {
    if (processedIframes.has(iframe)) return;

    var title = (iframe.title || "").toLowerCase();
    if (title.indexOf("chat") === -1) return;

    processedIframes.add(iframe);

    // Inject immediately (may already be loaded)
    injectIntoIframe(iframe);

    // Re-inject on subsequent loads (SPA navigation, widget rebuild).
    // Intentionally NOT `{ once: true }` — Tawk can reload iframe content.
    iframe.addEventListener("load", function () {
      injectIntoIframe(iframe);
    });
  }

  /**
   * Scan a root document for all chat iframes.
   */
  function scanIframes(root) {
    try {
      var iframes = (root || document).querySelectorAll("iframe");
      for (var i = 0; i < iframes.length; i++) {
        handleIframe(iframes[i]);
      }
    } catch (_) {}
  }

  // ── Observer ──────────────────────────────────────────────────────────

  function onMutations(mutations) {
    var foundNewIframe = false;

    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeName === "IFRAME") {
          handleIframe(node);
          foundNewIframe = true;
        } else if (node.nodeType === 1 && node.querySelectorAll) {
          var nested = node.querySelectorAll("iframe");
          if (nested.length) {
            for (var k = 0; k < nested.length; k++) {
              handleIframe(nested[k]);
            }
            foundNewIframe = true;
          }
        }
      }
    }

    // Debounced re-scan: Tawk sometimes rebuilds its widget DOM entirely,
    // so existing iframes may get new content without a new IFRAME node.
    if (foundNewIframe && !debounceTimer) {
      debounceTimer = setTimeout(function () {
        debounceTimer = null;
        scanIframes();
        hidePopoutButtons(document);
      }, 500);
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────

  function start() {
    // Main document branding (outside iframes)
    injectStyle(document);
    hidePopoutButtons(document);

    // Initial iframe scan
    scanIframes();

    // Watch for dynamically added iframes
    if (typeof MutationObserver !== "undefined" && document.body) {
      var observer = new MutationObserver(onMutations);
      observer.observe(document.body, { childList: true, subtree: true });

      // Cleanup
      window.addEventListener("beforeunload", function () {
        observer.disconnect();
        pendingRetries.forEach(clearTimeout);
        pendingRetries.clear();
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
      });
    }
  }

  // Guard: script may be in <head> before document.body exists
  if (document.body) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }
})();
