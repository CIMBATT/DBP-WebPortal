<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  fetchManufacturerRegistrations,
  persistManufacturerRegistrations,
  readManufacturerRegistrations,
  type ManufacturerRegistration,
} from '../storage'

const manufacturerCode = ref('')
const manufacturerUrl = ref('')
const manufacturerApiKey = ref('')
const savedManufacturers = ref<ManufacturerRegistration[]>([])
const successMessage = ref('')
const errorMessage = ref('')

async function loadRegistrations() {
  savedManufacturers.value = readManufacturerRegistrations()
  errorMessage.value = ''

  try {
    savedManufacturers.value = await fetchManufacturerRegistrations()
  } catch (error) {
    console.error('Failed to load manufacturer registrations from server', error)
    if (savedManufacturers.value.length === 0) {
      errorMessage.value = error instanceof Error
        ? error.message
        : 'Failed to load manufacturer registrations.'
    }
  }
}

async function saveManufacturerRegistration() {
  const codeValue = manufacturerCode.value.trim()
  const urlValue = manufacturerUrl.value.trim()
  const apiKeyValue = manufacturerApiKey.value.trim()
  errorMessage.value = ''

  if (!codeValue) {
    successMessage.value = 'Please enter a manufacturer code'
    return
  }

  if (!urlValue) {
    successMessage.value = 'Please enter a manufacturer URL'
    return
  }

  try {
    new URL(urlValue)
  } catch {
    successMessage.value = 'Please enter a valid URL'
    return
  }

  const newEntry: ManufacturerRegistration = {
    manufacturerCode: codeValue,
    manufacturerUrl: urlValue,
    savedAt: new Date().toLocaleString(),
  }

  if (apiKeyValue) newEntry.manufacturerApiKey = apiKeyValue

  savedManufacturers.value.unshift(newEntry)

  try {
    await persistManufacturerRegistrations(savedManufacturers.value)
  } catch (error) {
    savedManufacturers.value.shift()
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Failed to save manufacturer registration.'
    return
  }

  manufacturerCode.value = ''
  manufacturerUrl.value = ''
  manufacturerApiKey.value = ''
  successMessage.value = `✓ Manufacturer "${codeValue}" registered successfully`

  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

async function deleteManufacturer(index: number) {
  errorMessage.value = ''
  const removed = savedManufacturers.value[index]
  if (!removed) return

  savedManufacturers.value.splice(index, 1)

  try {
    await persistManufacturerRegistrations(savedManufacturers.value)
  } catch (error) {
    savedManufacturers.value.splice(index, 0, removed)
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Failed to delete manufacturer registration.'
  }
}

function maskApiKey(key: string) {
  if (!key) return ''
  if (key.length <= 8) return '****' + key.slice(-4)
  return key.slice(0, 4) + '...' + key.slice(-4)
}

onMounted(() => {
  void loadRegistrations()
})
</script>

<template>
  <section class="manufacturer-registration-section">
    <div class="card manufacturer-registration-card">
      <label for="manufacturer-code">Manufacturer Code</label>
      <input
        id="manufacturer-code"
        v-model="manufacturerCode"
        type="text"
        placeholder="Enter manufacturer code"
        @keyup.enter="saveManufacturerRegistration"
      />

      <label for="manufacturer-url" class="label-url">Manufacturer URL</label>
      <input
        id="manufacturer-url"
        v-model="manufacturerUrl"
        type="url"
        placeholder="https://example.com"
        @keyup.enter="saveManufacturerRegistration"
      />

            <label for="manufacturer-apikey" class="label-apikey">API Key (optional)</label>
            <input
              id="manufacturer-apikey"
              v-model="manufacturerApiKey"
              type="text"
              placeholder="Paste API key if required by provider"
              @keyup.enter="saveManufacturerRegistration"
            />

            <button type="button" class="primary-button" @click="saveManufacturerRegistration">Register Manufacturer</button>

            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
    </div>

    <div v-if="savedManufacturers.length > 0" class="card manufacturers-list">
      <h2>Registered Manufacturers</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Manufacturer Code</th>
              <th>Manufacturer URL</th>
              <th>API Key</th>
              <th>Registered</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in savedManufacturers" :key="index">
              <td class="code-cell">
                <code>{{ item.manufacturerCode }}</code>
              </td>
              <td class="url-cell">
                <a :href="item.manufacturerUrl" target="_blank" rel="noopener">{{ item.manufacturerUrl }}</a>
              </td>
                            <td class="apikey-cell">{{ item.manufacturerApiKey ? maskApiKey(item.manufacturerApiKey) : '' }}</td>
                            <td class="date-cell">{{ item.savedAt }}</td>
                            <td class="action-cell">
                              <button type="button" class="delete-button" @click="deleteManufacturer(index)">
                                Delete
                              </button>
                            </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card empty-state">
      <p>No manufacturers registered yet. Add your first manufacturer above.</p>
    </div>
  </section>
</template>

<style scoped>
.manufacturer-registration-section {
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

.manufacturer-registration-card {
  max-width: 500px;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 12px;
  margin-top: 16px;
}

label:first-of-type {
  margin-top: 0;
}

input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 14px 16px;
  font: inherit;
  background: white;
  color: #0f172a;
  box-sizing: border-box;
  margin-bottom: 4px;
}

input:focus {
  outline: 3px solid rgba(59, 130, 246, 0.14);
  border-color: #3b82f6;
}

.primary-button {
  margin-top: 20px;
  width: 100%;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  font: inherit;
  font-weight: 600;
  padding: 12px 24px;
  cursor: pointer;
  min-height: 48px;
}

.primary-button:hover {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.success-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
  font-weight: 600;
}

.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  font-weight: 600;
}

.manufacturers-list h2 {
  margin-top: 0;
  margin-bottom: 18px;
  color: #0f172a;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

thead {
  border-bottom: 2px solid #e2e8f0;
}

th {
  text-align: left;
  padding: 12px;
  font-weight: 600;
  color: #334155;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
}

.code-cell code {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.url-cell a {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

.url-cell a:hover {
  text-decoration: underline;
}

.date-cell {
  font-size: 0.9rem;
  color: #64748b;
}

.action-cell {
  text-align: center;
}

.delete-button {
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
  padding: 6px 12px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
}

.delete-button:hover {
  background: #fecaca;
}

.empty-state {
  text-align: center;
  padding: 40px 24px;
  color: #64748b;
}
</style>
