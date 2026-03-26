/**
 * Governance Notification Service
 *
 * Responsibility: Track and gate governance education notifications
 * shown to Contributors when their formatting actions are overridden
 * by template governance rules.
 *
 * Architecture:
 * - Each notification type has a stable string key
 * - Session dismissal: stored in sessionStorage (persists for the browser session / tab)
 * - Permanent dismissal: stored in localStorage (persists across sessions)
 * - shouldNotify returns false if dismissed by either storage
 * - No UI logic here — only tracking and gating
 *
 * @governance Contributor-facing education layer
 * @see Mylo Governance: Contributor formatting enforcement
 */

export type GovernanceNotificationKey = 'empty_paragraphs'
// Future keys added here as new governance rules are introduced
// Keys use underscores throughout — storage keys: mylo_governance_notified_<key> / mylo_governance_dismissed_<key>

const SESSION_PREFIX = 'mylo_governance_notified_'
const PERSISTENT_PREFIX = 'mylo_governance_dismissed_'

export function hasBeenNotified(key: GovernanceNotificationKey): boolean {
  return sessionStorage.getItem(`${SESSION_PREFIX}${key}`) === 'true'
}

export function isPermanentlyDismissed(key: GovernanceNotificationKey): boolean {
  return localStorage.getItem(`${PERSISTENT_PREFIX}${key}`) === 'true'
}

/**
 * Mark a notification as dismissed.
 * @param persistent - true → localStorage (permanent); false → sessionStorage (session only)
 */
export function markAsNotified(key: GovernanceNotificationKey, persistent: boolean): void {
  if (persistent) {
    localStorage.setItem(`${PERSISTENT_PREFIX}${key}`, 'true')
  } else {
    sessionStorage.setItem(`${SESSION_PREFIX}${key}`, 'true')
  }
}

/**
 * Returns true if the notification should be shown.
 * Returns false if permanently dismissed (localStorage) or session-dismissed (sessionStorage).
 */
export function shouldNotify(key: GovernanceNotificationKey): boolean {
  if (localStorage.getItem(`${PERSISTENT_PREFIX}${key}`) === 'true') return false
  if (sessionStorage.getItem(`${SESSION_PREFIX}${key}`) === 'true') return false
  return true
}
