<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BatteryListScreen from './components/BatteryListScreen.vue'
import BatteryPassportScreen from './components/BatteryPassportScreen.vue'
import BatterySearchScreen from './components/BatterySearchScreen.vue'
import RegistrationScreen from './components/RegistrationScreen.vue'
import LoginScreen from './components/LoginScreen.vue'
import LoggingScreen from './components/LoggingScreen.vue'
import AboutScreen from './components/AboutScreen.vue'
import { findManufacturerRegistration, readAuthSession, readManufacturerRegistrations, writeAuthSession } from './storage'
import { validatePassportCollectionPayload, validatePassportPayload } from './passportValidation'

const isLoggedIn = ref(false)
const currentUser = ref('')
const PASSPORT_ROUTE_PATTERNS = [
  /^\/oem\/[^/]+\/battery\/[^/]+/i,
  /^\/manufacturer\/[^/]+\/battery\/[^/]+/i,
] as const

const originalFetch = window.fetch.bind(window)
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  console.debug('[HTTP] Outgoing request', { url, method: (init?.method ?? 'GET').toUpperCase(), headers: init?.headers ?? {} })

  return originalFetch(input, init)
    .then((response) => {
      console.debug('[HTTP] Response received', {
        url,
        status: response.status,
        statusText: response.statusText,
      })
      return response
    })
    .catch((error) => {
      console.error('[HTTP] Request failed', { url, error })
      throw error
    })
}

const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'password',
}

type DemoPassport = {
  id: string
  generalProductInformation: {
    batteryPassportIdentifier: string
    productIdentifier: string
    batteryCategory: string
    manufacturerInformation: { identifier: string }
    manufacturingPlace: { postalCode1: string }
    manufacturingDate: string
    puttingIntoService: string
    warrantyPeriod: string
    batteryMass: number
    operatorInformation: { identifier: string }
  }
  materialComposition: {
    batteryChemistry: { shortName: string; clearName: string }
    batteryMaterials: Array<{
      batteryMaterial: string
      batteryMaterialLocation: Array<{ componentName: string }>
      isCriticalRawMaterial: boolean
    }>
    hazardousSubstances: Array<{
      hazardousSubstanceIdentifier: string
      hazardousSubstanceImpact: string[]
      hazardousSubstanceLocation: { componentName: string }
    }>
  }
  performance: {
    batteryTechnicalProperties: {
      ratedEnergy: number
      ratedCapacity: number
      nominalVoltage: number
      minimumVoltage: number
      maximumVoltage: number
      expectedLifetime: number
      expectedNumberOfCycles: number
      ratedMaximumPower: number
      roundtripEfficiency: number
      cRate: number
      lifetimeReferenceTest: string
      temperatureRangeIdleState: { minimum: number; maximum: number }
      initialInternalResistance: Array<{ batteryComponent: string; ohmicResistance: number }>
      originalPowerCapability: Array<{ powerCapabilityAt: number; atSoC: number }>
    }
    batteryCondition: {
      capacityFade: { capacityFadeValue: number; lastUpdate: string }
      internalResistanceIncrease: Array<{
        batteryComponent: string
        internalResistanceIncreaseValue: number
        lastUpdateInternalResistanceIncrease: string
      }>
    }
  }
  carbonFootprint: {
    batteryCarbonFootprint: number
    absoluteCarbonFootprint: number
    carbonFootprintPerformanceClass: string
    carbonFootprintStudy: string
    carbonFootprintPerLifecycleStage: {
      carbonFootprintPerLifecycleStage1: Array<{ lifecycleStage: string; carbonFootprint: number }>
    }
  }
  circularity: {
    renewableContent: number
    recycledContent: Array<{ recycledMaterial: string; preConsumerShare: number; postConsumerShare: number }>
    sparePartSources: Array<{ nameOfSupplier: string; components: Array<{ partName: string }> }>
    endOfLifeInformation: {
      wastePrevention: string
      separateCollection: string
      informationOnCollection: string
    }
  }
  supplyChainDueDiligence: {
    supplyChainDueDiligenceReport: string
    supplyChainIndices: number
    thirdPartyAssurances: string
  }
  labeling: {
    declarationOfConformity: string
    resultOfTestReport: string
    labels: Array<{ labelingMeaning: string; labelingSymbol: string; labelingSubject: string }>
  }
  dynamicUpdates: Array<{
    lastUpdate: string
    generalProductInformation: { batteryStatus: string; operatorInformation: { identifier: string } }
    performance: null
  }>
}

const passports = ref<Record<string, DemoPassport>>({})

function persistAuthSession() {
  writeAuthSession(
    isLoggedIn.value && currentUser.value
      ? { isLoggedIn: true, currentUser: currentUser.value }
      : null,
  )
}

function restoreAuthSession() {
  const session = readAuthSession()
  isLoggedIn.value = session?.isLoggedIn ?? false
  currentUser.value = session?.currentUser ?? ''
}

function normalizePassportId(passport: Partial<DemoPassport> & { generalProductInformation?: DemoPassport['generalProductInformation'] }, fallbackId = '') {
  return passport.generalProductInformation?.productIdentifier
    ?? passport.id
    ?? fallbackId
}

function normalizePassportSummary(passport: DemoPassport) {
  return {
    id: normalizePassportId(passport, passport.generalProductInformation?.batteryPassportIdentifier ?? ''),
    manufacturer: passport.generalProductInformation?.manufacturerInformation?.identifier ?? passport.generalProductInformation?.manufacturer ?? '',
    type: passport.generalProductInformation?.batteryCategory ?? '',
    status: passport.dynamicUpdates?.[0]?.generalProductInformation?.batteryStatus ?? 'Approved',
  }
}

function isPassportRoute(path: string) {
  return PASSPORT_ROUTE_PATTERNS.some((pattern) => pattern.test(path))
}

async function loadPassports() {
  try {
    const registrations = readManufacturerRegistrations()
    if (registrations.length === 0) {
      passports.value = {}
      return
    }

    const firstReg = registrations[0]
    const baseUrl = firstReg.manufacturerUrl.replace(/\/+$/, '')
    const headers: Record<string, string> = {}
    if (firstReg.manufacturerApiKey) {
      headers['x-api-key'] = firstReg.manufacturerApiKey
    }

    console.debug('[BatteryPassport] Loading passport list from API', { url: baseUrl, manufacturer: firstReg.manufacturerCode })
    const res = await fetch(baseUrl, { headers })
    if (!res.ok) throw new Error(`Failed to fetch passports: ${res.status}`)
    const data = validatePassportCollectionPayload(
      await res.json(),
      `Manufacturer API for "${firstReg.manufacturerCode}"`,
    )
    console.debug('[BatteryPassport] Passport list response received', { count: Array.isArray(data) ? data.length : (data?.items?.length ?? 1) })
    const list = Array.isArray(data) ? data : data.items ?? [data]
    const map: Record<string, DemoPassport> = {}
    for (const p of list) {
      const productIdentifier = p?.generalProductInformation?.productIdentifier ?? p?.productIdentifier ?? p?.id ?? p?.generalProductInformation?.batteryPassportIdentifier
      const id = productIdentifier ? String(productIdentifier) : ''
      if (!id) continue
      const normalized = p as DemoPassport
      normalized.id = id
      map[id] = normalized
    }
    passports.value = map
  } catch (err: any) {
    console.error('Error loading passports from API:', err)
  }
}

const currentPath = ref(window.location.pathname)

const activeMenu = computed(() => {
  if (currentPath.value === '/login') return 'login'
  if (currentPath.value === '/register' && isLoggedIn.value) return 'register'
  if (currentPath.value === '/list' && isLoggedIn.value) return 'list'
  if (currentPath.value === '/logs' && isLoggedIn.value) return 'logs'
  if (currentPath.value === '/about') return 'about'
  if (isPassportRoute(currentPath.value)) return 'passport'
  if (currentPath.value === '/search') return 'search'
  if (currentPath.value === '/' || currentPath.value === '') return 'search'
  return 'search'
})

const selectedPassport = ref<DemoPassport | null>(null)
const selectedPassportError = ref('')

function showErrorPopup(message: string) {
  window.alert(message)
}

function getManufacturerRegistration(mfg: string): { manufacturerUrl: string; manufacturerApiKey?: string } | null {
  const found = findManufacturerRegistration(mfg)
  return found ? { manufacturerUrl: found.manufacturerUrl, manufacturerApiKey: found.manufacturerApiKey } : null
}

async function loadPassportById(id: string, mfg?: string) {
  selectedPassportError.value = ''
  selectedPassport.value = null
  try {
    let baseUrl = ''
    let headers: Record<string, string> = {}
    if (mfg) {
      const reg = getManufacturerRegistration(mfg)
      if (reg?.manufacturerUrl) baseUrl = reg.manufacturerUrl
      if (reg?.manufacturerApiKey) headers['x-api-key'] = reg.manufacturerApiKey
    }
    // ensure no trailing slash
    baseUrl = baseUrl.replace(/\/+$/, '')
    const fetchUrl = `${baseUrl}/${encodeURIComponent(id)}`

    console.debug('[BatteryPassport] Fetching passport by id', { manufacturer: mfg ?? 'default', batteryId: id, fetchUrl, headers })
    const res = await fetch(fetchUrl, { headers })
    if (!res.ok) {
      if (res.status === 404) {
        // not found
        return null
      }
      throw new Error(`Failed to fetch passport: ${res.status}`)
    }
    const p = validatePassportPayload(
      await res.json(),
      `Manufacturer API for "${mfg ?? 'selected manufacturer'}"`,
    )
    const passport = p as DemoPassport
    const productIdentifier = normalizePassportId(passport, id)
    // Use product identifier as the battery id for URLs and display when available
    passport.id = productIdentifier
    passport.generalProductInformation = {
      ...passport.generalProductInformation,
      batteryPassportIdentifier: productIdentifier,
    }

    if (mfg) {
      passport.generalProductInformation = {
        ...passport.generalProductInformation,
        manufacturerInformation: { identifier: mfg },
      }
    }

    selectedPassport.value = passport
    return passport
  } catch (err: any) {
    const message = String(err?.message ?? err)
    selectedPassportError.value = message
    console.error('Error loading passport by id:', err)
    showErrorPopup(message)
    return null
  }
}

function loadPassportFromPath() {
  const match = currentPath.value.match(/^\/oem\/([^/]+)\/battery\/([^/]+)(?:\?.*)?$/i)
    ?? currentPath.value.match(/^\/manufacturer\/([^/]+)\/battery\/([^/]+)(?:\?.*)?$/i)
    ?? currentPath.value.match(/^\/([^/]+)\/battery\/([^/]+)(?:\?.*)?$/i)

  if (!match) {
    selectedPassport.value = null
    selectedPassportError.value = ''
    return
  }

  const mfg = decodeURIComponent(match[1])
  const id = decodeURIComponent(match[2])
  const registration = getManufacturerRegistration(mfg)

  if (!registration) {
    const message = `Manufacturer "${mfg}" is not registered. Please register it before searching for a battery.`
    selectedPassportError.value = message
    selectedPassport.value = null
    showErrorPopup(message)
    return
  }

  // Auto-load the passport directly
  loadPassportById(id, mfg)
}

const demoBatteryList = computed(() =>
  Object.values(passports.value).map(normalizePassportSummary),
)

function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function updatePathFromWindow() {
  currentPath.value = window.location.pathname
  loadPassportFromPath()
}

function goToSearch() {
  navigateTo('/search')
}

function goToPassport() {
  navigateTo('/manufacturer/NorthVolt%20Energy/battery/BAT-1001')
}

function goToList() {
  navigateTo('/list')
}

function goToRegister() {
  navigateTo('/register')
}

function goToLogging() {
  navigateTo('/logs')
}

function goToLogin() {
  navigateTo('/login')
}

function goToAbout() {
  navigateTo('/about')
}

function handleLogin(username: string, password: string) {
  if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
    isLoggedIn.value = true
    currentUser.value = username
    persistAuthSession()
    navigateTo('/')
  }
}

function handleLogout() {
  isLoggedIn.value = false
  currentUser.value = ''
  persistAuthSession()
  navigateTo('/')
}

onMounted(() => {
  restoreAuthSession()
  window.addEventListener('popstate', updatePathFromWindow)
  // load passports from backend API
  loadPassports()
  // Load passport from deep-link on initial mount
  updatePathFromWindow()
})

onUnmounted(() => {
  window.removeEventListener('popstate', updatePathFromWindow)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand-mark" aria-label="Battery Passport logo">
          <span class="brand-ring brand-ring-outer" aria-hidden="true"></span>
          <span class="brand-ring brand-ring-inner" aria-hidden="true"></span>
          <span class="brand-cell brand-cell-top" aria-hidden="true"></span>
          <span class="brand-cell brand-cell-bottom" aria-hidden="true"></span>
          <span class="brand-core">BP</span>
        </div>
        <div>
          <p class="brand-label">Battery Passport</p>
          <span class="brand-subtitle">Digital product portal</span>
        </div>
      </div>

      <nav class="menu" aria-label="Main navigation">
        <button
          type="button"
          class="nav-button"
          :class="{ active: activeMenu === 'search' }"
          @click="goToSearch"
        >
          <span class="nav-icon">🔍</span>
          <span class="nav-copy">
            <strong>Battery Search</strong>
          </span>
        </button>

        <button
          v-if="isLoggedIn"
          type="button"
          class="nav-button"
          :class="{ active: activeMenu === 'list' }"
          @click="goToList"
        >
          <span class="nav-icon">📋</span>
          <span class="nav-copy">
            <strong>All Passports</strong>
          </span>
        </button>

        <button
          v-if="isLoggedIn"
          type="button"
          class="nav-button"
          :class="{ active: activeMenu === 'register' }"
          @click="goToRegister"
        >
          <span class="nav-icon">🏭</span>
          <span class="nav-copy">
            <strong>Manufacturer Registration</strong>
          </span>
        </button>

        <button
          type="button"
          class="nav-button"
          :class="{ active: activeMenu === 'about' }"
          @click="goToAbout"
        >
          <span class="nav-icon">ℹ️</span>
          <span class="nav-copy">
            <strong>About</strong>
          </span>
        </button>

        <button
          v-if="isLoggedIn"
          type="button"
          class="nav-button"
          :class="{ active: activeMenu === 'logs' }"
          @click="goToLogging"
        >
          <span class="nav-icon">📋</span>
          <span class="nav-copy">
            <strong>API Logs</strong>
          </span>
        </button>

        <button
          v-if="!isLoggedIn"
          type="button"
          class="nav-button"
          :class="{ active: activeMenu === 'login' }"
          @click="goToLogin"
        >
          <span class="nav-icon">🔐</span>
          <span class="nav-copy">
            <strong>Sign In</strong>
          </span>
        </button>
      </nav>

      <div v-if="isLoggedIn" class="user-section">
        <div class="user-info">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ currentUser }}</span>
        </div>
        <button type="button" class="logout-button" @click="handleLogout">Sign Out</button>
      </div>
    </aside>

    <main class="content-panel">
      <header class="topbar">
        <div>
          <p class="eyebrow">Overview</p>
          <h1>
            {{
              activeMenu === 'login'
                ? 'Sign In'
                : activeMenu === 'register'
                  ? 'Manufacturer Registration'
                  : activeMenu === 'logs'
                    ? 'API Call Logs'
                    : activeMenu === 'about'
                      ? 'About'
                    : activeMenu === 'passport'
                        ? 'Battery Passport'
                        : activeMenu === 'list'
                        ? 'Demo Passport List'
                        : 'Battery Search'
            }}
          </h1>
        </div>
      </header>

      <LoginScreen v-if="activeMenu === 'login'" @login="handleLogin" />
      <RegistrationScreen v-else-if="activeMenu === 'register'" />
      <BatteryListScreen v-else-if="activeMenu === 'list'" :items="demoBatteryList" />
      <LoggingScreen v-else-if="activeMenu === 'logs'" />
      <AboutScreen v-else-if="activeMenu === 'about'" />
      <BatteryPassportScreen v-else-if="activeMenu === 'passport'" :passport="selectedPassport ?? null" />
      <BatterySearchScreen v-else />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f4f7fb 0%, #edf4ff 100%);
  color: #132238;
}

.sidebar {
  width: 280px;
  background: #0f172a;
  color: #f8fafc;
  padding: 24px 18px;
  box-shadow: 8px 0 25px rgba(15, 23, 42, 0.08);
  position: relative;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 8px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}

.brand-mark {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.28), transparent 42%),
    linear-gradient(145deg, #eff6ff, #dbeafe);
  box-shadow:
    inset 0 0 0 1px rgba(147, 197, 253, 0.4),
    0 10px 24px rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.brand-core {
  position: relative;
  z-index: 2;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  color: #0f172a;
}

.brand-ring {
  position: absolute;
  border-radius: 999px;
  border: 2px solid rgba(37, 99, 235, 0.95);
}

.brand-ring-outer {
  width: 44px;
  height: 44px;
}

.brand-ring-inner {
  width: 28px;
  height: 28px;
  border-color: rgba(56, 189, 248, 0.95);
}

.brand-cell {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(180deg, #1d4ed8, #38bdf8);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
}

.brand-cell-top {
  top: 10px;
  right: 10px;
}

.brand-cell-bottom {
  bottom: 10px;
  left: 10px;
}

.brand-label {
  margin: 0;
  font-weight: 700;
}

.brand-subtitle {
  font-size: 0.76rem;
  color: #cbd5e1;
}

.menu {
  display: flex;
  flex-direction: column;
  margin-top: 22px;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 14px 12px;
  cursor: pointer;
}

.nav-button.active {
  background: rgba(59, 130, 246, 0.18);
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.35);
}

.nav-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.12);
}

.nav-copy {
  display: flex;
  flex-direction: column;
}

.nav-copy strong {
  font-size: 0.96rem;
}

.user-section {
  position: absolute;
  bottom: 24px;
  left: 18px;
  right: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.user-icon {
  font-size: 1.2rem;
}

.user-name {
  color: #cbd5e1;
  font-weight: 600;
  word-break: break-all;
}

.logout-button {
  width: 100%;
  border: 1px solid rgba(248, 250, 252, 0.2);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.06);
  color: #cbd5e1;
  font: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: rgba(248, 250, 252, 0.12);
  color: #f8fafc;
}

.content-panel {
  flex: 1;
  padding: 32px;
}

.topbar {
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: #64748b;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 2.6vw, 3rem);
  color: #0f172a;
}

@media (max-width: 900px) {
  .app-shell {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
