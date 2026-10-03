/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_MODE?: 'mock' | 'api'
  readonly VITE_API_URL?: string
}
