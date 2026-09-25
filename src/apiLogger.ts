export type LogEntry = {
  timestamp: string
  level: 'INFO' | 'DEBUG' | 'ERROR' | 'WARN'
  message: string;
  response?: {
    status: number
    statusText: string
    size?: string
  }
}

const logs: LogEntry[] = []
const MAX_LOGS = 1000

type LogResponse = {
  status?: number
  statusText?: string
  size?: string
}

function pushLog(level: LogEntry['level'], message: string, response?: LogResponse) {
  logs.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    response: response
      ? {
          status: response.status ?? 0,
          statusText: response.statusText ?? 'Unknown',
          size: response.size,
        }
      : undefined,
  })

  if (logs.length > MAX_LOGS) {
    logs.shift()
  }
}

export const apiLogger = {
  log: (message: string, response?: LogResponse) => {
    pushLog('INFO', message, response)
  },

  error: (message: string, response?: LogResponse) => {
    pushLog('ERROR', message, response)
  },

  warn: (message: string, response?: LogResponse) => {
    pushLog('WARN', message, response)
  },

  debug: (message: string, response?: LogResponse) => {
    pushLog('DEBUG', message, response)
  },

  getLogs: () => [...logs],

  clearLogs: () => {
    logs.length = 0
  },
}
