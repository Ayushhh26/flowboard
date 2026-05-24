import 'server-only'
import { createHash, randomBytes } from 'crypto'

const TOKEN_PREFIX = 'fb_'

export function generateApiTokenPlaintext(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`
}

export function hashApiToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

export function isApiTokenFormat(value: string): boolean {
  return value.startsWith(TOKEN_PREFIX) && value.length > TOKEN_PREFIX.length + 20
}
