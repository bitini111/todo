const BASE = '/api'

function getToken() {
  return localStorage.getItem('auth-token')
}

async function request(method, path, body, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  })

  if (res.status === 401) {
    localStorage.removeItem('auth-token')
    window.location.reload()
    throw new Error('登录已过期，请重新登录')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || '请求失败')
  }

  return res
}

/** Auth-aware fetch that returns parsed JSON */
export async function apiGet(path) {
  const res = await request('GET', path)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await request('POST', path, body)
  return res.json()
}

export async function apiPut(path, body) {
  const res = await request('PUT', path, body)
  return res.json()
}

export async function apiDelete(path) {
  await request('DELETE', path)
}

/** Upload a file with multipart/form-data */
export async function apiUpload(path, file) {
  const formData = new FormData()
  formData.append('template', file)

  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })

  if (res.status === 401) {
    localStorage.removeItem('auth-token')
    window.location.reload()
    throw new Error('登录已过期，请重新登录')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || '上传失败')
  }

  return res
}

/** Download a file (blob) from a GET endpoint */
export async function apiDownload(path) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })

  if (res.status === 401) {
    localStorage.removeItem('auth-token')
    window.location.reload()
    throw new Error('登录已过期，请重新登录')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || '请求失败')
  }

  return res.blob()
}
