// localStorage can throw (private mode, blocked site data), so every access is guarded

export const read = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // nothing to do: the app keeps working for this session only
  }
};
