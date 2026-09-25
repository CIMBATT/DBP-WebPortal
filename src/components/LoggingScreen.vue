<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { apiLogger, type LogEntry } from '../apiLogger'

const logs = ref<LogEntry[]>([])
const autoRefresh = ref(true)
let refreshInterval: ReturnType<typeof setInterval> | null = null

const sortedLogs = computed(() => {
  return [...logs.value].reverse()
})

const displayLogs = computed(() => {
  return sortedLogs.value.slice(0, 100)
})

function refreshLogs() {
  logs.value = apiLogger.getLogs()
}

function clearLogs() {
  if (window.confirm('Are you sure you want to clear all logs?')) {
    apiLogger.clearLogs()
    refreshLogs()
  }
}

function getLevelClass(level: string) {
  return level.toLowerCase()
}

function getResponseClass(status: number) {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'client-error'
  if (status >= 500) return 'server-error'
  return 'info'
}

function stopAutoRefresh() {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  if (!autoRefresh.value) return

  refreshInterval = setInterval(() => {
    refreshLogs()
  }, 1000)
}

onMounted(() => {
  refreshLogs()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <section class="logging-section">
    <div class="card logs-card">
      <div class="logs-header">
        <div>
          <h2>API Call Logs</h2>
          <p>Showing last 100 of {{ logs.length }} log entries</p>
        </div>
        <div class="header-actions">
          <label class="auto-refresh-toggle">
            <input v-model="autoRefresh" type="checkbox" />
            Auto-refresh
          </label>
          <button type="button" class="refresh-button" @click="refreshLogs">⟳ Refresh</button>
          <button type="button" class="clear-button" @click="clearLogs">✕ Clear</button>
        </div>
      </div>

      <div class="logs-container">
        <div v-if="logs.length === 0" class="no-logs">
          <p>No logs yet. Make API calls to see them here.</p>
        </div>
        <div v-else class="logs-table">
          <div class="log-header-row">
            <div class="log-timestamp">Timestamp</div>
            <div class="log-level">Level</div>
            <div class="log-message">Message</div>
            <div class="log-response">Response</div>
          </div>
          <div v-for="(log, idx) in displayLogs" :key="`${log.timestamp}-${idx}`" class="log-row">
            <div class="log-timestamp">{{ log.timestamp }}</div>
            <div class="log-level" :class="getLevelClass(log.level)">{{ log.level }}</div>
            <div class="log-message">{{ log.message }}</div>
            <div class="log-response" v-if="log.response">
              <span class="status-badge" :class="getResponseClass(log.response.status)">
                {{ log.response.status }} {{ log.response.statusText }}
              </span>
            </div>
            <div v-else class="log-response">—</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.logging-section {
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

.logs-card {
  max-width: 1200px;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.logs-header h2 {
  margin: 0 0 4px;
  font-size: 1.3rem;
  color: #0f172a;
}

.logs-header p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.auto-refresh-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.auto-refresh-toggle input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.refresh-button,
.clear-button {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  font: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.clear-button:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.logs-container {
  max-height: 600px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.no-logs {
  padding: 32px 16px;
  text-align: center;
  color: #64748b;
}

.logs-table {
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.log-header-row {
  display: grid;
  grid-template-columns: 180px 80px 1fr 200px;
  gap: 16px;
  padding: 12px 16px;
  background: #e2e8f0;
  font-weight: 700;
  color: #334155;
  position: sticky;
  top: 0;
}

.log-row {
  display: grid;
  grid-template-columns: 180px 80px 1fr 200px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #cbd5e1;
  align-items: center;
  background: white;
}

.log-row:nth-child(odd) {
  background: #f8fafc;
}

.log-row:hover {
  background: #f1f5f9;
}

.log-timestamp {
  color: #64748b;
  font-size: 0.8rem;
  word-break: break-word;
}

.log-level {
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
  font-size: 0.75rem;
}

.log-level.info {
  background: #dbeafe;
  color: #0369a1;
}

.log-level.debug {
  background: #e0e7ff;
  color: #4338ca;
}

.log-level.warn {
  background: #fef3c7;
  color: #92400e;
}

.log-level.error {
  background: #fee2e2;
  color: #991b1b;
}

.log-message {
  color: #0f172a;
  word-break: break-word;
  white-space: pre-wrap;
}

.log-response {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.status-badge.client-error {
  background: #fed7aa;
  color: #92400e;
}

.status-badge.server-error {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.info {
  background: #e0e7ff;
  color: #3730a3;
}
</style>
