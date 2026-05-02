import { useThemeStore } from '@/stores/theme'

export class ApiError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`API ${status}`)
    this.status = status
    this.body = body
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isDark = useThemeStore.getState().isDark ? '1' : '0'
  const headers: Record<string, string> = {
    'X-Dark-Mode': isDark,
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  }
  const res = await fetch(`/api${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text)
  }
  return (await res.json()) as T
}

export async function apiPostForm<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const params = new URLSearchParams(body)
  return api<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
}
