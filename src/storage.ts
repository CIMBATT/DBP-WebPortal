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

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const responseText = await response.text()

  try {
    return JSON.parse(responseText) as T
  } catch {
    const preview = responseText.trim().slice(0, 120)
    throw new Error(`${fallbackMessage} The server returned a non-JSON response: ${preview || '<empty response>'}`)
  }
}

function isManufacturerRegistration(entry: unknown): entry is ManufacturerRegistration {
  return !!entry
    && typeof entry === 'object'
    && 'manufacturerCode' in entry
    && typeof entry.manufacturerCode === 'string'
    && 'manufacturerUrl' in entry
    && typeof entry.manufacturerUrl === 'string'
    && (!('manufacturerApiKey' in entry) || entry.manufacturerApiKey === undefined || typeof entry.manufacturerApiKey === 'string')
    && (!('savedAt' in entry) || entry.savedAt === undefined || typeof entry.savedAt === 'string')
}

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
    throw new Error('Failed to load manufacturer registrations from the server.')
  }

  const payload = await parseJsonResponse<unknown[]>(
    response,
    'Failed to load manufacturer registrations.',
  )
  if (!Array.isArray(payload)) {
    throw new Error('Failed to load manufacturer registrations: invalid server response.')
  }

  const registrations = payload.filter(isManufacturerRegistration)

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
