import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'
const dataDirectory = process.env.DATA_DIR || path.join(__dirname, 'data')
const registrationsFile = path.join(dataDirectory, 'manufacturer-registrations.json')
const distDirectory = path.join(__dirname, 'dist')

app.use(express.json())

function isValidRegistration(entry) {
  return entry
    && typeof entry === 'object'
    && typeof entry.manufacturerCode === 'string'
    && entry.manufacturerCode.trim()
    && typeof entry.manufacturerUrl === 'string'
    && entry.manufacturerUrl.trim()
    && (entry.manufacturerApiKey === undefined || typeof entry.manufacturerApiKey === 'string')
    && (entry.savedAt === undefined || typeof entry.savedAt === 'string')
}

async function ensureDataDirectory() {
  await fs.mkdir(dataDirectory, { recursive: true })
}

async function readRegistrationsFromDisk() {
  await ensureDataDirectory()

  try {
    const fileContents = await fs.readFile(registrationsFile, 'utf8')
    const parsed = JSON.parse(fileContents)
    return Array.isArray(parsed) ? parsed.filter(isValidRegistration) : []
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return []
    }

    if (error instanceof SyntaxError) {
      console.warn('Manufacturer registrations file is invalid JSON. Resetting persisted registrations.')
      await writeRegistrationsToDisk([])
      return []
    }

    throw error
  }
}

async function writeRegistrationsToDisk(registrations) {
  await ensureDataDirectory()
  await fs.writeFile(registrationsFile, JSON.stringify(registrations, null, 2), 'utf8')
}

app.get('/api/manufacturer-registrations', async (_req, res) => {
  try {
    const registrations = await readRegistrationsFromDisk()
    res.json(registrations)
  } catch (error) {
    console.error('Failed to read manufacturer registrations', error)
    res.status(500).json({ message: 'Failed to read manufacturer registrations.' })
  }
})

app.put('/api/manufacturer-registrations', async (req, res) => {
  const registrations = req.body

  if (!Array.isArray(registrations) || registrations.some((entry) => !isValidRegistration(entry))) {
    res.status(400).json({ message: 'Manufacturer registrations payload is invalid.' })
    return
  }

  try {
    await writeRegistrationsToDisk(registrations)
    res.status(204).end()
  } catch (error) {
    console.error('Failed to write manufacturer registrations', error)
    res.status(500).json({ message: 'Failed to save manufacturer registrations.' })
  }
})

app.use(express.static(distDirectory))

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDirectory, 'index.html'))
})

app.listen(PORT, HOST, () => {
  console.log(`Battery portal listening on http://${HOST}:${PORT}`)
})
