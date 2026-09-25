export type ManufacturerRegistration = {
  manufacturerCode: string
  manufacturerUrl: string
  manufacturerApiKey?: string
  savedAt?: string
}

export type AuthSession = {
  isLoggedIn: boolean
  currentUser: string
}

const AUTH_STORAGE_KEY = 'webportal_auth_session'
const MANUFACTURER_STORAGE_KEY = 'manufacturer_registrations'
const MANUFACTURER_REGISTRATION_API = '/api/manufacturer-registrations'

export function readManufacturerRegistrations(): ManufacturerRegistration[] {
  try {
    const stored = localStorage.getItem(MANUFACTURER_STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored) as ManufacturerRegistration[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('Failed to read manufacturer registrations from localStorage', error)
    return []
  }
}

export function writeManufacturerRegistrations(registrations: ManufacturerRegistration[]) {
  localStorage.setItem(MANUFACTURER_STORAGE_KEY, JSON.stringify(registrations))
}

export async function fetchManufacturerRegistrations(): Promise<ManufacturerRegistration[]> {
  const response = await fetch(MANUFACTURER_REGISTRATION_API)
  if (!response.ok) {
    throw new Error(`Failed to load manufacturer registrations: ${response.status}`)
  }

  const payload = await response.json()
  if (!Array.isArray(payload)) {
    throw new Error('Failed to load manufacturer registrations: invalid server response.')
  }

  const registrations = payload.filter((entry): entry is ManufacturerRegistration => (
    !!entry
    && typeof entry === 'object'
    && typeof entry.manufacturerCode === 'string'
    && typeof entry.manufacturerUrl === 'string'
    && (entry.manufacturerApiKey === undefined || typeof entry.manufacturerApiKey === 'string')
    && (entry.savedAt === undefined || typeof entry.savedAt === 'string')
  ))

  writeManufacturerRegistrations(registrations)
  return registrations
}

export async function persistManufacturerRegistrations(registrations: ManufacturerRegistration[]) {
  const response = await fetch(MANUFACTURER_REGISTRATION_API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrations),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Failed to save manufacturer registrations: ${response.status}`)
  }

  writeManufacturerRegistrations(registrations)
}

export function findManufacturerRegistration(manufacturerCode: string): ManufacturerRegistration | null {
  const normalizedCode = manufacturerCode.trim().toLowerCase()
  return readManufacturerRegistrations().find((entry) => (
    String(entry.manufacturerCode || '').trim().toLowerCase() === normalizedCode
  )) ?? null
}

export function readAuthSession(): AuthSession | null {
  try {
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!storedSession) return null

    const parsed = JSON.parse(storedSession) as Partial<AuthSession>
    if (parsed.isLoggedIn && parsed.currentUser) {
      return {
        isLoggedIn: true,
        currentUser: parsed.currentUser,
      }
    }
  } catch (error) {
    console.warn('Failed to restore auth session from localStorage', error)
  }

  localStorage.removeItem(AUTH_STORAGE_KEY)
  return null
}

export function writeAuthSession(session: AuthSession | null) {
  if (!session || !session.isLoggedIn || !session.currentUser) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}
