const TOKEN_META_SELECTOR = 'meta[name="api-token"]'
const LS_KEY = "quantforge_api_token"

function getToken(): string | null {
  const meta = document.querySelector<HTMLMetaElement>(TOKEN_META_SELECTOR)
  if (meta?.content) return meta.content
  const ls = localStorage.getItem(LS_KEY)
  if (ls) return ls
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_QUANTFORGE_API_TOKEN) {
    return import.meta.env.VITE_QUANTFORGE_API_TOKEN as string
  }
  return null
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
