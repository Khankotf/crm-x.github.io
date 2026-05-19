(function initCrmStorage(global) {
  const storage = {
    getJson(key, fallback) {
      try {
        const raw = global.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
      } catch {
        return fallback;
      }
    },
    setJson(key, value) {
      global.localStorage.setItem(key, JSON.stringify(value));
    },
    getText(key, fallback = "") {
      try {
        return global.localStorage.getItem(key) || fallback;
      } catch {
        return fallback;
      }
    },
    setText(key, value) {
      global.localStorage.setItem(key, value);
    },
    remove(key) {
      global.localStorage.removeItem(key);
    },
  };

  global.crmStorage = storage;
})(window);
