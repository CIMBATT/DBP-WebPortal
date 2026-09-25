<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BatteryPassportScreen from './BatteryPassportScreen.vue'
import { apiLogger } from '../apiLogger'
import { fetchManufacturerRegistrations, readManufacturerRegistrations, type ManufacturerRegistration } from '../storage'
import { validatePassportCollectionPayload, validatePassportPayload } from '../passportValidation'

type Passport = {
  id: string
  manufacturer: string
  type: string
  manufacturingDate: string
  status?: string
}

type PaginationInfo = {
  page: number
  limit: number
  total: number
  pages: number
}

const props = defineProps<{ items: Passport[] }>()

const manufacturerOptions = ref<ManufacturerRegistration[]>([])
const selectedManufacturer = ref('')
const manufacturerPassports = ref<Passport[]>([])
const paginationInfo = ref<PaginationInfo | null>(null)
const currentPage = ref(1)
const loading = ref(false)
const errorMessage = ref('')
const selectedPassport = ref<any | null>(null)
const popupOpen = ref(false)
const productIdFilter = ref('')

const displayBatteries = computed(() => {
  let batts = manufacturerPassports.value.length > 0 ? manufacturerPassports.value : props.items
  
  if (productIdFilter.value) {
    const filterLower = productIdFilter.value.toLowerCase()
    batts = batts.filter((b) => b.id.toLowerCase().includes(filterLower))
  }
  
  return batts
})

async function readManufacturers() {
  manufacturerOptions.value = readManufacturerRegistrations()

  if (manufacturerOptions.value.length > 0 && !selectedManufacturer.value) {
    selectedManufacturer.value = manufacturerOptions.value[0].manufacturerCode
  }

  try {
    manufacturerOptions.value = await fetchManufacturerRegistrations()
    if (manufacturerOptions.value.length > 0 && !selectedManufacturer.value) {
      selectedManufacturer.value = manufacturerOptions.value[0].manufacturerCode
    }
  } catch (error) {
    console.error('[BatteryList] Failed to refresh manufacturer registrations from server', error)
  }
}

function normalizePassport(payload: any, fallbackManufacturer?: string): Passport | null {
  if (!payload) return null

  const general = payload.generalProductInformation ?? {}
  const manufacturer = general.manufacturerInformation?.identifier ?? fallbackManufacturer ?? general.manufacturer ?? 'Unknown'
  const id = general.productIdentifier ?? payload.productIdentifier ?? payload.id ?? general.batteryPassportIdentifier ?? 'Unknown'
  const type = general.batteryCategory ?? payload.batteryCategory ?? 'Unknown'
  const manufacturingDate = general.manufacturingDate ?? payload.manufacturingDate ?? 'Unknown'
  const status = payload.dynamicUpdates?.[0]?.generalProductInformation?.batteryStatus ?? 'Approved'

  return {
    id: String(id),
    manufacturer: String(manufacturer),
    type: String(type),
    manufacturingDate: manufacturingDate && manufacturingDate !== 'Unknown'
      ? new Date(manufacturingDate).toLocaleDateString()
      : 'Unknown',
    status: String(status),
  }
}

async function loadManufacturerPassports(manufacturerCode: string, page: number = 1) {
  const registration = manufacturerOptions.value.find((item) => item.manufacturerCode === manufacturerCode)
  if (!registration) {
    manufacturerPassports.value = []
    paginationInfo.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const baseUrl = registration.manufacturerUrl.replace(/\/+$/, '')
    const url = `${baseUrl}?page=${page}&limit=25`
    const response = await fetch(url, {
      headers: registration.manufacturerApiKey ? { 'x-api-key': registration.manufacturerApiKey } : {},
    })

    apiLogger.log(`GET ${baseUrl}?page=${page}&limit=25`, {
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const payload = validatePassportCollectionPayload(
      await response.json(),
      `Manufacturer API for "${manufacturerCode}"`,
    )
    
    // Handle paginated response {items, pagination}
    if (payload.items && payload.pagination) {
      const items = Array.isArray(payload.items) ? payload.items : [payload.items]
      manufacturerPassports.value = items
        .map((item) => normalizePassport(item, registration.manufacturerCode))
        .filter((item): item is Passport => item !== null)
      paginationInfo.value = payload.pagination
      currentPage.value = page
    } else if (Array.isArray(payload)) {
      // Fallback for non-paginated responses
      manufacturerPassports.value = payload
        .map((item) => normalizePassport(item, registration.manufacturerCode))
        .filter((item): item is Passport => item !== null)
      paginationInfo.value = null
      currentPage.value = 1
    } else {
      // Single item response
      const item = normalizePassport(payload, registration.manufacturerCode)
      manufacturerPassports.value = item ? [item] : []
      paginationInfo.value = null
      currentPage.value = 1
    }
  } catch (error) {
    console.error('[BatteryList] Failed to load passports for manufacturer', manufacturerCode, error)
    apiLogger.error(`GET ${registration.manufacturerUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    errorMessage.value = error instanceof Error
      ? error.message
      : `Unable to load passports for ${manufacturerCode}.`
    manufacturerPassports.value = []
    paginationInfo.value = null
  } finally {
    loading.value = false
  }
}

watch(
  selectedManufacturer,
  (nextValue) => {
    if (!nextValue) {
      manufacturerPassports.value = []
      paginationInfo.value = null
      errorMessage.value = ''
      currentPage.value = 1
      productIdFilter.value = ''
      return
    }
    currentPage.value = 1
    productIdFilter.value = ''
    void loadManufacturerPassports(nextValue, 1)
  },
)

async function goToPreviousPage() {
  if (currentPage.value > 1) {
    await loadManufacturerPassports(selectedManufacturer.value, currentPage.value - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function goToNextPage() {
  if (paginationInfo.value && currentPage.value < paginationInfo.value.pages) {
    await loadManufacturerPassports(selectedManufacturer.value, currentPage.value + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function openBattery(id: string, manufacturer: string) {
  const registration = manufacturerOptions.value.find((item) => item.manufacturerCode === manufacturer)

  if (!registration) {
    window.alert(`Manufacturer "${manufacturer}" is not registered.`)
    return
  }

  try {
    const baseUrl = registration.manufacturerUrl.replace(/\/+$/, '')
    const url = `${baseUrl}/${encodeURIComponent(id)}`
    const response = await fetch(url, {
      headers: registration.manufacturerApiKey ? { 'x-api-key': registration.manufacturerApiKey } : {},
    })

    apiLogger.log(`GET ${url}`, {
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const payload = validatePassportPayload(
      await response.json(),
      `Manufacturer API for "${manufacturer}"`,
    )
    const passport = payload as any
    passport.id = payload?.id ?? payload?.generalProductInformation?.productIdentifier ?? id
    passport.generalProductInformation = {
      ...passport.generalProductInformation,
      manufacturerInformation: { identifier: manufacturer },
    }
    selectedPassport.value = passport
    popupOpen.value = true
  } catch (error) {
    console.error('[BatteryList] Failed to fetch battery details for popup', error)
    apiLogger.error(`GET ${error instanceof Error ? error.message : 'Unknown error'}`)
    window.alert(
      error instanceof Error
        ? error.message
        : `Unable to load battery ${id} for manufacturer "${manufacturer}".`,
    )
  }
}

onMounted(() => {
  void readManufacturers()
  if (selectedManufacturer.value) {
    void loadManufacturerPassports(selectedManufacturer.value)
  }
})
</script>

<template>
  <section class="list-screen">
    <div class="card list-card">
      <div class="list-header">
        <h2>Registered manufacturer passports</h2>
        <span>{{ displayBatteries.length }} total</span>
      </div>

      <div class="filter-row">
        <label for="manufacturer-select">Manufacturer</label>
        <select id="manufacturer-select" v-model="selectedManufacturer">
          <option value="">All registered manufacturers</option>
          <option v-for="entry in manufacturerOptions" :key="entry.manufacturerCode" :value="entry.manufacturerCode">
            {{ entry.manufacturerCode }}
          </option>
        </select>
      </div>

      <div class="filter-row">
        <label for="product-id-filter">
          <span class="filter-icon">🔍</span>
          Product Identifier Filter
        </label>
        <input
          id="product-id-filter"
          v-model="productIdFilter"
          type="text"
          placeholder="Search by product identifier..."
        />
      </div>

      <p v-if="loading" class="status-note">Loading passports…</p>
      <p v-else-if="errorMessage" class="error-note">{{ errorMessage }}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product Identifier</th>
              <th>Manufacturer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="battery in displayBatteries" :key="`${battery.manufacturer}-${battery.id}`" class="clickable-row" @click="openBattery(battery.id, selectedManufacturer)">
              <td>{{ battery.id }}</td>
              <td>{{ battery.manufacturer }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="paginationInfo && !productIdFilter" class="pagination-row">
        <button :disabled="currentPage === 1" class="pagination-button" @click="goToPreviousPage">Previous</button>
        <span class="page-info">Page {{ currentPage }} of {{ paginationInfo.pages }} ({{ paginationInfo.total }} total)</span>
        <button :disabled="currentPage === paginationInfo.pages" class="pagination-button" @click="goToNextPage">Next</button>
      </div>
    </div>

    <div v-if="popupOpen && selectedPassport" class="passport-modal-backdrop" @click.self="popupOpen = false; selectedPassport = null">
      <div class="passport-modal" role="dialog" aria-modal="true" aria-label="Battery passport details">
        <div class="modal-header">
          <h3>Battery passport</h3>
          <button type="button" class="close-button" @click="popupOpen = false; selectedPassport = null">Close</button>
        </div>
        <BatteryPassportScreen :passport="selectedPassport" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.list-screen {
  display: grid;
}

.card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.04);
}

.list-card {
  max-width: 980px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.list-header h2 {
  margin: 0;
  color: #0f172a;
}

.list-header span {
  color: #64748b;
  font-weight: 600;
}

.filter-row {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-row label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-icon {
  font-size: 0.9rem;
  color: #64748b;
}

.filter-row select {
  width: min(320px, 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  font: inherit;
  background: white;
  color: #0f172a;
}

.filter-row input {
  width: min(320px, 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  font: inherit;
  background: white;
  color: #0f172a;
}

.status-note,
.error-note {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-note {
  color: #1d4ed8;
}

.error-note {
  color: #b91c1c;
}

.passport-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.56);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 50;
}

.passport-modal {
  width: min(1100px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: white;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
  padding: 18px 20px 20px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.close-button {
  border: none;
  background: #e2e8f0;
  color: #0f172a;
  border-radius: 999px;
  padding: 8px 14px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
}

th {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

td {
  color: #0f172a;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background: rgba(59, 130, 246, 0.04);
}

.status-pill {
  background: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.pagination-button {
  border: 1px solid #cbd5e1;
  background: white;
  color: #0f172a;
  border-radius: 8px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
