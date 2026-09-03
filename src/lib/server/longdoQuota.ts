import 'server-only'

import type { NextRequest } from 'next/server'

const GLOBAL_REQUESTS_PER_MINUTE = 45
const GLOBAL_REQUESTS_PER_DAY = 4000
const GLOBAL_REQUESTS_PER_MONTH = 90_000
const CLIENT_REQUESTS_PER_MINUTE = 20

type ClientWindow = {
  startedAt: number
  count: number
  lastSeenAt: number
}

type LongdoUsageState = {
  minuteStartedAt: number
  minuteCount: number
  dayKey: string
  dayCount: number
  monthKey: string
  monthCount: number
  clients: Map<string, ClientWindow>
}

const globalWithLongdoUsage = globalThis as typeof globalThis & {
  mapxpropLongdoUsage?: LongdoUsageState
}

const currentDayKey = (now: number) => new Date(now).toISOString().slice(0, 10)
const currentMonthKey = (now: number) => new Date(now).toISOString().slice(0, 7)

const getUsageState = (now: number) => {
  if (!globalWithLongdoUsage.mapxpropLongdoUsage) {
    globalWithLongdoUsage.mapxpropLongdoUsage = {
      minuteStartedAt: now,
      minuteCount: 0,
      dayKey: currentDayKey(now),
      dayCount: 0,
      monthKey: currentMonthKey(now),
      monthCount: 0,
      clients: new Map(),
    }
  }
  return globalWithLongdoUsage.mapxpropLongdoUsage
}

const getClientKey = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || null

export const getLongdoApiKey = () => process.env.LONGDO_MAP_KEY || process.env.NEXT_PUBLIC_LONGDO_MAP_KEY

export const takeLongdoQuota = (request: NextRequest) => {
  const now = Date.now()
  const state = getUsageState(now)
  const dayKey = currentDayKey(now)
  const monthKey = currentMonthKey(now)
  const clientKey = getClientKey(request)

  if (monthKey !== state.monthKey) {
    state.monthKey = monthKey
    state.monthCount = 0
  }
  if (dayKey !== state.dayKey) {
    state.dayKey = dayKey
    state.dayCount = 0
  }
  if (now - state.minuteStartedAt >= 60_000) {
    state.minuteStartedAt = now
    state.minuteCount = 0
  }

  const existingClient = clientKey ? state.clients.get(clientKey) : undefined
  const client = clientKey
    ? !existingClient || now - existingClient.startedAt >= 60_000
      ? { startedAt: now, count: 0, lastSeenAt: now }
      : existingClient
    : null

  if (state.dayCount >= GLOBAL_REQUESTS_PER_DAY) return false
  if (state.monthCount >= GLOBAL_REQUESTS_PER_MONTH) return false
  if (state.minuteCount >= GLOBAL_REQUESTS_PER_MINUTE) return false
  if (client && client.count >= CLIENT_REQUESTS_PER_MINUTE) return false

  state.dayCount += 1
  state.monthCount += 1
  state.minuteCount += 1
  if (clientKey && client) {
    client.count += 1
    client.lastSeenAt = now
    state.clients.set(clientKey, client)
  }

  if (state.clients.size > 2000) {
    for (const [key, value] of state.clients) {
      if (now - value.lastSeenAt > 120_000) state.clients.delete(key)
    }
  }

  return true
}

export const longdoNoStoreHeaders = { 'Cache-Control': 'private, no-store' }
