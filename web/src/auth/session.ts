import { authMode } from './config'
import { createSessionStore } from './session-store'

// Storage access is lazy because even reading window.localStorage may throw.
function browserStorage(kind: 'localStorage' | 'sessionStorage'): Storage {
  return {
    get length() { return window[kind].length },
    clear: () => window[kind].clear(),
    key: (index) => window[kind].key(index),
    getItem: (key) => window[kind].getItem(key),
    setItem: (key, value) => window[kind].setItem(key, value),
    removeItem: (key) => window[kind].removeItem(key),
  }
}

export const sessionStore = createSessionStore({
  local: browserStorage('localStorage'),
  session: browserStorage('sessionStorage'),
}, authMode)
