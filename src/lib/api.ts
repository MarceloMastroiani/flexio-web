const BASE_URL = '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let accessToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb
}

interface RequestOptions extends RequestInit {
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (auth && accessToken) {
    finalHeaders['Authorization'] = `Bearer ${accessToken}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  if (res.status === 401 && onUnauthorized) {
    onUnauthorized()
  }

  let body: unknown = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const message = extractError(body) ?? `Error ${res.status}`
    throw new ApiError(res.status, message)
  }

  return body as T
}

function extractError(body: unknown): string | null {
  if (typeof body === 'string') return body
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (typeof b.message === 'string') return b.message
    if (Array.isArray(b.message)) return b.message.join('. ')
    if (typeof b.error === 'string') return b.error
  }
  return null
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { auth, method: 'GET' }),
  post: <T>(path: string, data?: unknown, auth = true) =>
    request<T>(path, { auth, method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown, auth = true) =>
    request<T>(path, { auth, method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  del: <T>(path: string, auth = true) => request<T>(path, { auth, method: 'DELETE' }),
}
