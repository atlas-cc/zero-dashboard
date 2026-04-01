import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.ZERO_BACKEND_URL || 'http://178.156.184.203:7779'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const apiPath = url.searchParams.get('p') || 'dashboard'
  try {
    const res = await fetch(`${BACKEND}/api/${apiPath}`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const apiPath = url.searchParams.get('p') || 'log'
  const body = await req.json()
  try {
    const res = await fetch(`${BACKEND}/api/${apiPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
  }
}
