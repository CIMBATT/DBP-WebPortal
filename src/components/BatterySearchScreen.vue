<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BatteryPassportScreen from './BatteryPassportScreen.vue'
import { apiLogger } from '../apiLogger'
import { findManufacturerRegistration } from '../storage'
import { validatePassportPayload } from '../passportValidation'

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

const manufacturer = ref('')
const batteryId = ref('')
const statusMessage = ref('Enter a manufacturer and battery ID to open its passport.')
const activeSearchResult = ref<DemoPassport | null>(null)

function showErrorPopup(message: string) {
  window.alert(message)
}

const demoPassport = computed(() => activeSearchResult.value ?? null)
const showPassportPopup = computed(() => !!demoPassport.value)

function closePassportPopup() {
  activeSearchResult.value = null
  statusMessage.value = 'Enter a manufacturer and battery ID to search for a passport.'
}

function handleBatterySearchRequest(event: Event) {
  const target = event as CustomEvent<{ manufacturer?: string; batteryId?: string }>
  const selectedManufacturer = (target.detail?.manufacturer ?? '').trim()
  const selectedBatteryId = (target.detail?.batteryId ?? '').trim()

  if (!selectedManufacturer || !selectedBatteryId) return

  manufacturer.value = selectedManufacturer
  batteryId.value = selectedBatteryId
  void openPassport()
}

onMounted(() => {
  window.addEventListener('battery-search-request', handleBatterySearchRequest)
})

onUnmounted(() => {
  window.removeEventListener('battery-search-request', handleBatterySearchRequest)
})

function getManufacturerRegistration(mfg: string): { manufacturerUrl: string; manufacturerApiKey?: string } | null {
  const found = findManufacturerRegistration(mfg)
  return found
    ? {
        manufacturerUrl: found.manufacturerUrl,
        manufacturerApiKey: found.manufacturerApiKey,
      }
    : null
}

async function openPassport() {
  const mfg = manufacturer.value.trim()
  const id = batteryId.value.trim()

  if (!mfg) {
    const message = 'Please enter a manufacturer before continuing.'
    statusMessage.value = message
    showErrorPopup(message)
    return
  }

  if (!id) {
    const message = 'Please enter a battery ID before continuing.'
    statusMessage.value = message
    showErrorPopup(message)
    return
  }

  const rawId = id.trim()
  const registration = getManufacturerRegistration(mfg)

  if (!registration) {
    const message = `Manufacturer "${mfg}" is not registered. Register it first in Manufacturer Registration.`
    statusMessage.value = message
    showErrorPopup(message)
    return
  }

  try {
    const baseUrl = registration.manufacturerUrl.replace(/\/+$/, '')
    const fetchUrl = `${baseUrl}/${encodeURIComponent(rawId)}`
    const headers: Record<string, string> = {}
    if (registration.manufacturerApiKey) {
      headers['x-api-key'] = registration.manufacturerApiKey
    }

    console.debug('[BatterySearch] Requesting passport from manufacturer API', {
      manufacturer: mfg,
      batteryId: rawId,
      fetchUrl,
      headers,
    })

    apiLogger.log(`GET ${fetchUrl}`)

    const response = await fetch(fetchUrl, { headers })
    
    apiLogger.log(`GET ${fetchUrl}`, {
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      const message = `Battery ${rawId} was not found for manufacturer "${mfg}".`
      activeSearchResult.value = null
      statusMessage.value = message
      showErrorPopup(message)
      return
    }

    const payload = validatePassportPayload(await response.json(), `Manufacturer API for "${mfg}"`) as DemoPassport
    const resultPassport = payload as DemoPassport
    const displayId = payload?.id ?? payload?.generalProductInformation?.productIdentifier ?? rawId
    resultPassport.id = displayId

    activeSearchResult.value = resultPassport
    batteryId.value = rawId
    statusMessage.value = `Battery ${displayId} (Manufacturer: ${mfg}) is displayed below.`
  } catch (error) {
    console.error('Failed to fetch passport using manufacturer registration', error)
    apiLogger.error(`GET ${error instanceof Error ? error.message : 'Unknown error'}`)
    const message = error instanceof Error
      ? error.message
      : `Unable to load battery ${rawId} from manufacturer "${mfg}".`
    activeSearchResult.value = null
    statusMessage.value = message
    showErrorPopup(message)
  }
}
</script>

<template>
  <section class="search-section">
    <div class="card form-card">
      <label for="manufacturer">Manufacturer</label>
      <input
        id="manufacturer"
        v-model="manufacturer"
        type="text"
        placeholder="Enter manufacturer"
        @keyup.enter="openPassport"
      />

      <label for="battery-id">Battery ID</label>
      <div class="input-row">
        <input
          id="battery-id"
          v-model="batteryId"
          type="text"
          placeholder="Enter battery ID"
          @keyup.enter="openPassport"
        />
        <button type="button" class="primary-button" @click="openPassport">Open passport</button>
      </div>
      <p class="form-hint">Search using a battery serial number, model number, or identifier.</p>
      <div class="status-box" :class="{ warning: !manufacturer.trim() || !batteryId.trim() }">
        {{ statusMessage }}
      </div>
    </div>

    <div v-if="showPassportPopup" class="passport-modal-backdrop" @click.self="closePassportPopup">
      <div class="passport-modal" role="dialog" aria-modal="true" aria-label="Battery passport details">
        <div class="modal-header">
          <h3>Battery passport</h3>
          <button type="button" class="close-button" @click="closePassportPopup">Close</button>
        </div>
        <BatteryPassportScreen :passport="demoPassport" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.search-section {
  display: grid;
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.04);
}

.form-card {
  min-height: 240px;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 12px;
}

label:first-of-type {
  margin-top: 0;
}

.input-row {
  display: flex;
  gap: 12px;
}

input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 14px 16px;
  font: inherit;
  background: white;
  color: #0f172a;
}

input:focus {
  outline: 3px solid rgba(59, 130, 246, 0.14);
  border-color: #3b82f6;
}

.primary-button {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  font: inherit;
  font-weight: 600;
  padding: 0 22px;
  min-width: 150px;
  cursor: pointer;
}

.form-hint {
  margin-top: 12px;
  color: #64748b;
}

.status-box {
  margin-top: 24px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
  font-weight: 600;
}

.status-box.warning {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a4d00;
}

.passport-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
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
  font-size: 1.3rem;
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

.summary-card {
  max-width: 900px;
}

.passport-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.passport-label {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: #64748b;
}

.passport-header h2 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
}

.status-pill {
  background: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}

.passport-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.passport-section h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  color: #0f172a;
}

.passport-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.passport-grid > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.passport-grid span {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.passport-grid strong {
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 600;
}

@media (max-width: 900px) {
  .input-row {
    flex-direction: column;
  }

  .primary-button {
    min-height: 48px;
  }

  .passport-grid {
    grid-template-columns: 1fr;
  }
}
</style>
