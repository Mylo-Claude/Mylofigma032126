/**
 * Governance Notification Service
 *
 * Responsibility: Track and gate governance education notifications
 * shown to Contributors when their formatting actions are overridden
 * by template governance rules.
 *
 * Architecture:
 * - Each notification type has a stable string key
 * - Shown-state persists in sessionStorage for the browser session
 * - Notifications are shown once per session per rule
 * - No UI logic here — only tracking and gating
 *
 * @governance Contributor-facing education layer
 * @see Mylo Governance: Contributor formatting enforcement
 */

export type GovernanceNotificationKey = 'empty-paragraphs'
// Future keys added here as new governance rules are introduced

const SESSION_PREFIX = 'mylo_governance_notified_'

export function hasBeenNotified(key: GovernanceNotificationKey): boolean {
  return sessionStorage.getItem(`${SESSION_PREFIX}${key}`) === 'true'
}

export function markAsNotified(key: GovernanceNotificationKey): void {
  sessionStorage.setItem(`${SESSION_PREFIX}${key}`, 'true')
}

export function shouldNotify(
  key: GovernanceNotificationKey,
  isRuleActive: boolean
): boolean {
  return isRuleActive && !hasBeenNotified(key)
}
