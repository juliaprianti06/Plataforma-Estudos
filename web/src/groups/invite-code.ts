const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

export function normalizeInviteCode(value: string): string {
  const code = value.trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('Informe um código de 6 letras ou números.')
  return code
}
