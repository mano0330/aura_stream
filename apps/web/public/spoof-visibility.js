// Spoof Page Visibility and Focus APIs to allow background audio streaming when minimized or tab-switched
(function() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Force document visibility properties to always return active/visible state
    Object.defineProperty(document, 'hidden', {
      get: function() { return false; },
      configurable: true
    });
    
    Object.defineProperty(document, 'visibilityState', {
      get: function() { return 'visible'; },
      configurable: true
    });

    Object.defineProperty(document, 'webkitHidden', {
      get: function() { return false; },
      configurable: true
    });

    Object.defineProperty(document, 'webkitVisibilityState', {
      get: function() { return 'visible'; },
      configurable: true
    });
  } catch (e) {
    console.warn('Failed to define visibility overrides:', e);
  }

  // 2. Intercept addEventListener on document/window to block page visibility and focus-loss listeners
  const originalDocAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'visibilitychange' || type === 'webkitvisibilitychange' || type === 'blur') {
      // Discard event registration so players never receive hidden/blur notifications
      return;
    }
    return originalDocAddEventListener.apply(this, arguments);
  };

  const originalWinAddEventListener = window.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (type === 'visibilitychange' || type === 'webkitvisibilitychange' || type === 'blur') {
      return;
    }
    return originalWinAddEventListener.apply(this, arguments);
  };

  // 3. Prevent focus-loss events from dispatching to keep iframe players active
  const originalDispatchEvent = window.dispatchEvent;
  window.dispatchEvent = function(event) {
    if (event && (event.type === 'blur' || event.type === 'visibilitychange')) {
      return true;
    }
    return originalDispatchEvent.apply(this, arguments);
  };
})();
