<script setup lang="ts">
import { computed, ref } from 'vue'

type Passport = any

const props = defineProps<{ passport: Passport | null }>()

const summaryStatus = computed(
  () => props.passport?.dynamicUpdates?.[0]?.generalProductInformation?.batteryStatus ?? 'Approved',
)

const generalInfo = computed(() => props.passport?.generalProductInformation ?? {})
const materialComp = computed(() => props.passport?.materialComposition ?? {})
const perfData = computed(() => props.passport?.performance ?? {})
const carbonData = computed(() => props.passport?.carbonFootprint ?? {})
const circData = computed(() => props.passport?.circularity ?? {})
const supplyData = computed(() => props.passport?.supplyChainDueDiligence ?? {})
const labelData = computed(() => props.passport?.labeling ?? {})
const maintenanceData = computed(() => props.passport?.maintenanceInformation ?? {})

const expandedSections = ref<Record<string, boolean>>({
  general: true,
  material: false,
  performance: false,
  carbon: false,
  circularity: false,
  supply: false,
  labeling: false,
  maintenance: false,
  dynamic: false,
})

const expandedArrays = ref<Record<string, boolean>>({})

const toggleSection = (section: string) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const toggleArray = (key: string) => {
  expandedArrays.value[key] = !expandedArrays.value[key]
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return `${value.length} items`
  if (typeof value === 'object') return '[Nested object]'
  return String(value)
}

type FlatItem = [string, any, boolean, any[]] // key, displayValue, isArray, arrayItems

const flattenObject = (obj: any, prefix = ''): FlatItem[] => {
  const result: FlatItem[] = []
  
  for (const [key, value] of Object.entries(obj || {})) {
    const displayKey = prefix ? `${prefix} → ${key}` : key
    
    if (value === null || value === undefined) {
      result.push([displayKey, 'N/A', false, []])
    } else if (typeof value === 'boolean') {
      result.push([displayKey, value ? 'Yes' : 'No', false, []])
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result.push([displayKey, 'Empty', false, []])
      } else if (typeof value[0] === 'object') {
        result.push([displayKey, `${value.length} items`, true, value])
      } else {
        result.push([displayKey, value.join(', '), false, []])
      }
    } else if (typeof value === 'object') {
      const nested = flattenObject(value, displayKey)
      result.push(...nested)
    } else {
      result.push([displayKey, value, false, []])
    }
  }
  
  return result
}
</script>

<template>
  <section v-if="props.passport" class="passport-screen">
    <div class="card passport-card">
      <div class="passport-header">
        <div>
          <p class="passport-label">Battery ID</p>
          <h2>{{ props.passport.id }}</h2>
        </div>
        <span class="status-pill">{{ summaryStatus }}</span>
      </div>

      <!-- General Product Information -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('general')">
          <span class="toggle-icon">{{ expandedSections.general ? '▼' : '▶' }}</span>
          <h3>General Product Information</h3>
        </button>
        <div v-if="expandedSections.general" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(generalInfo)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Material Composition -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('material')">
          <span class="toggle-icon">{{ expandedSections.material ? '▼' : '▶' }}</span>
          <h3>Material Composition</h3>
        </button>
        <div v-if="expandedSections.material" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(materialComp)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('performance')">
          <span class="toggle-icon">{{ expandedSections.performance ? '▼' : '▶' }}</span>
          <h3>Performance</h3>
        </button>
        <div v-if="expandedSections.performance" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(perfData)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Carbon Footprint -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('carbon')">
          <span class="toggle-icon">{{ expandedSections.carbon ? '▼' : '▶' }}</span>
          <h3>Carbon Footprint</h3>
        </button>
        <div v-if="expandedSections.carbon" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(carbonData)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Circularity -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('circularity')">
          <span class="toggle-icon">{{ expandedSections.circularity ? '▼' : '▶' }}</span>
          <h3>Circularity</h3>
        </button>
        <div v-if="expandedSections.circularity" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(circData)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Supply Chain Due Diligence -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('supply')">
          <span class="toggle-icon">{{ expandedSections.supply ? '▼' : '▶' }}</span>
          <h3>Supply Chain Due Diligence</h3>
        </button>
        <div v-if="expandedSections.supply" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(supplyData)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Labeling -->
      <div class="passport-section">
        <button class="section-header" @click="toggleSection('labeling')">
          <span class="toggle-icon">{{ expandedSections.labeling ? '▼' : '▶' }}</span>
          <h3>Labeling</h3>
        </button>
        <div v-if="expandedSections.labeling" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(labelData)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Maintenance Information -->
      <div v-if="maintenanceData && Object.keys(maintenanceData).length > 0" class="passport-section">
        <button class="section-header" @click="toggleSection('maintenance')">
          <span class="toggle-icon">{{ expandedSections.maintenance ? '▼' : '▶' }}</span>
          <h3>Maintenance Information</h3>
        </button>
        <div v-if="expandedSections.maintenance" class="section-content">
          <div class="data-grid">
            <div v-for="item in flattenObject(maintenanceData)" :key="item[0]" class="data-item">
              <span class="label">{{ item[0] }}</span>
              <div v-if="item[2]" class="array-container">
                <button class="array-button" @click="toggleArray(item[0])">
                  <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                  {{ item[1] }}
                </button>
                <div v-if="expandedArrays[item[0]]" class="array-items">
                  <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                    <strong>Item {{ idx + 1 }}</strong>
                    <div v-if="typeof arrayItem === 'object'">
                      <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                        <span class="nested-label">{{ k }}</span>
                        <span class="nested-value">{{ formatValue(v) }}</span>
                      </div>
                    </div>
                    <div v-else>{{ arrayItem }}</div>
                  </div>
                </div>
              </div>
              <strong v-else>{{ item[1] }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic Updates -->
      <div v-if="props.passport.dynamicUpdates && props.passport.dynamicUpdates.length > 0" class="passport-section">
        <button class="section-header" @click="toggleSection('dynamic')">
          <span class="toggle-icon">{{ expandedSections.dynamic ? '▼' : '▶' }}</span>
          <h3>Dynamic Updates</h3>
        </button>
        <div v-if="expandedSections.dynamic" class="section-content">
          <div v-for="(update, idx) in props.passport.dynamicUpdates" :key="idx" class="update-item">
            <div class="update-header">Update {{ idx + 1 }}</div>
            <div class="data-grid">
              <div v-for="item in flattenObject(update)" :key="item[0]" class="data-item">
                <span class="label">{{ item[0] }}</span>
                <div v-if="item[2]" class="array-container">
                  <button class="array-button" @click="toggleArray(item[0])">
                    <span class="array-toggle">{{ expandedArrays[item[0]] ? '▼' : '▶' }}</span>
                    {{ item[1] }}
                  </button>
                  <div v-if="expandedArrays[item[0]]" class="array-items">
                    <div v-for="(arrayItem, idx) in item[3]" :key="idx" class="array-item-content">
                      <strong>Item {{ idx + 1 }}</strong>
                      <div v-if="typeof arrayItem === 'object'">
                        <div v-for="[k, v] in Object.entries(arrayItem)" :key="k" class="nested-field">
                          <span class="nested-label">{{ k }}</span>
                          <span class="nested-value">{{ formatValue(v) }}</span>
                        </div>
                      </div>
                      <div v-else>{{ arrayItem }}</div>
                    </div>
                  </div>
                </div>
                <strong v-else>{{ item[1] }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section v-else class="empty-state">
    <div class="card empty-card">
      <h2>Battery passport not found</h2>
      <p>No data is available for this battery ID.</p>
    </div>
  </section>
</template>

<style scoped>
.passport-screen,
.empty-state {
  display: grid;
}

.card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.04);
}

.passport-card {
  max-width: 1000px;
}

.passport-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
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
  font-weight: 700;
  white-space: nowrap;
}

.passport-section {
  margin-top: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background: #f1f5f9;
}

.toggle-icon {
  font-size: 0.8rem;
  color: #64748b;
  transition: transform 0.2s ease;
  display: inline-block;
  width: 16px;
  text-align: center;
}

.section-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  text-align: left;
}

.section-content {
  padding: 20px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.data-item .label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 600;
}

.data-item strong {
  font-size: 0.95rem;
  color: #0f172a;
  word-break: break-word;
}

.array-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.array-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: left;
}

.array-button:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.array-toggle {
  display: inline-block;
  width: 12px;
  text-align: center;
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.array-items {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 4px;
  animation: slideDown 0.2s ease-out;
}

.array-item-content {
  padding: 10px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 3px solid #3b82f6;
}

.array-item-content:last-child {
  margin-bottom: 0;
}

.array-item-content strong {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #1e40af;
}

.nested-field {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.nested-label {
  font-weight: 600;
  color: #475569;
  min-width: 100px;
  flex-shrink: 0;
}

.nested-value {
  color: #0f172a;
  word-break: break-word;
}

.update-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.update-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.update-header {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.empty-card {
  text-align: center;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.empty-card h2 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #0f172a;
}

.empty-card p {
  margin: 0;
  color: #475569;
}

@media (max-width: 900px) {
  .data-grid {
    grid-template-columns: 1fr;
  }

  .passport-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
