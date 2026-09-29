/**
 * Global polyfills for React Native 0.87 / Expo SDK 57 compatibility
 */
(function (global) {
  if (!global.ErrorUtils) {
    var handler = function (e, isFatal) {
      if (typeof console !== 'undefined' && console.error) {
        console.error(e);
      }
    };
    global.ErrorUtils = {
      setGlobalHandler: function (h) {
        handler = h;
      },
      getGlobalHandler: function () {
        return handler;
      },
      reportError: function (e) {
        if (handler) handler(e, false);
      },
      reportFatalError: function (e) {
        if (handler) handler(e, true);
      },
      applyWithGuard: function (fn, context, args) {
        try {
          return fn.apply(context, args);
        } catch (e) {
          if (handler) handler(e, false);
          return null;
        }
      },
      applyWithGuardIfNeeded: function (fn, context, args) {
        return fn.apply(context, args);
      },
      inGuard: function () {
        return false;
      },
      guard: function (fn) {
        return fn;
      },
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : this);
