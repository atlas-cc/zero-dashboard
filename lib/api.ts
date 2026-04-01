// Always use the Vercel proxy route to avoid mixed content (HTTPS page -> HTTP backend)
const USE_PROXY = typeof window !== 'undefined' && window.location.protocol === 'https:'
const API_URL = USE_PROXY ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7779')

function apiUrl(path: string) {
  if (USE_PROXY) return `/api/proxy/path?p=${path}`
  return `${API_URL}/api/${path}`
}

export async function fetchDashboard() {
  const res = await fetch(apiUrl('dashboard'), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

export async function fetchTasks(status?: string) {
  const path = status ? `tasks?status=${status}` : 'tasks'
  const res = await fetch(apiUrl(path), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export async function createTask(data: {
  title: string
  status?: string
  domain?: string
  source?: string
  notes?: string
}) {
  const res = await fetch(apiUrl('tasks'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export async function fetchCorrections() {
  const res = await fetch(apiUrl('corrections'), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch corrections')
  return res.json()
}

export async function fetchLog(limit = 50) {
  const res = await fetch(apiUrl(`log?limit=${limit}`), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch log')
  return res.json()
}
