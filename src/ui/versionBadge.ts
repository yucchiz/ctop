import { APP_VERSION } from '../version'

export function renderVersionBadge(): string {
  return `<span class="version-badge" aria-label="アプリバージョン">${APP_VERSION}</span>`
}
