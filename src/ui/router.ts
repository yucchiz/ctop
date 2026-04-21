export type Route = { name: 'list' } | { name: 'editor'; id: string }

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#/, '')
  const match = clean.match(/^\/folders\/([^/?]+)/)
  if (match) return { name: 'editor', id: decodeURIComponent(match[1]!) }
  return { name: 'list' }
}

export function navigate(route: Route): void {
  const target = route.name === 'list' ? '#/' : `#/folders/${encodeURIComponent(route.id)}`
  if (location.hash !== target) location.hash = target
}

export function onRouteChange(handler: (route: Route) => void): () => void {
  const listener = (): void => handler(parseHash(location.hash))
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}
