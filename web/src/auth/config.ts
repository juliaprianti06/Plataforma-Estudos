const mode = import.meta.env.VITE_AUTH_MODE ?? 'api'

if (mode !== 'mock' && mode !== 'api') {
  throw new Error('VITE_AUTH_MODE deve ser mock ou api.')
}

export const authMode = mode
