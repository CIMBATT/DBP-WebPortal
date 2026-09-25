type PassportLike = {
  id?: unknown
  productIdentifier?: unknown
  batteryCategory?: unknown
  manufacturingDate?: unknown
  dynamicUpdates?: unknown
  generalProductInformation?: {
    batteryPassportIdentifier?: unknown
    productIdentifier?: unknown
    batteryCategory?: unknown
    manufacturingDate?: unknown
    manufacturerInformation?: {
      identifier?: unknown
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatExpectedPassportMessage(context: string, reason: string) {
  return `${context} returned invalid JSON: ${reason}. Expected a battery passport object with generalProductInformation.productIdentifier (or id) and generalProductInformation.batteryCategory.`
}

export function validatePassportPayload(payload: unknown, context: string) {
  if (!isRecord(payload)) {
    throw new Error(formatExpectedPassportMessage(context, 'the response body is not a JSON object'))
  }

  const passport = payload as PassportLike
  const general = passport.generalProductInformation
  if (!isRecord(general)) {
    throw new Error(formatExpectedPassportMessage(context, 'missing generalProductInformation object'))
  }

  const identifier = general.productIdentifier ?? passport.productIdentifier ?? passport.id ?? general.batteryPassportIdentifier
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw new Error(formatExpectedPassportMessage(context, 'missing product identifier'))
  }

  const batteryCategory = general.batteryCategory ?? passport.batteryCategory
  if (typeof batteryCategory !== 'string' || !batteryCategory.trim()) {
    throw new Error(formatExpectedPassportMessage(context, 'missing battery category'))
  }

  return payload
}

export function validatePassportCollectionPayload(payload: unknown, context: string) {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => validatePassportPayload(item, `${context} item ${index + 1}`))
  }

  if (!isRecord(payload)) {
    throw new Error(`${context} returned invalid JSON: the response body is neither a JSON object nor a JSON array.`)
  }

  if ('items' in payload || 'pagination' in payload) {
    const items = payload.items
    if (!Array.isArray(items)) {
      throw new Error(`${context} returned invalid JSON: paginated responses must contain an items array.`)
    }

    return {
      ...payload,
      items: items.map((item, index) => validatePassportPayload(item, `${context} item ${index + 1}`)),
    }
  }

  return validatePassportPayload(payload, context)
}
