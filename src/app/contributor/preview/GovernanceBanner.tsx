import { useState } from 'react'
import { Info } from 'lucide-react'
import { Checkbox } from '../../components/ui/checkbox'
import { Label } from '../../components/ui/label'

/**
 * GovernanceBanner - Slim governance tip bar
 *
 * Layout:
 *   [ℹ] message text                                [×]
 *   □ Don't show this again
 *
 * × alone              → session dismiss (onDismiss, no storage written)
 * Checkbox checked + × → permanent dismiss (onDismissPermanently, localStorage)
 *
 * @governance Contributor-facing education layer
 */

interface GovernanceBannerProps {
  message: string
  onDismiss: () => void
  onDismissPermanently: () => void
}

export function GovernanceBanner({ message, onDismiss, onDismissPermanently }: GovernanceBannerProps) {
  const [permanent, setPermanent] = useState(false)

  function handleDismiss() {
    if (permanent) {
      onDismissPermanently()
    } else {
      onDismiss()
    }
  }

  return (
    <div className="relative px-4 py-2 pr-8 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
      {/* × dismiss — absolute top-right */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 hover:text-blue-900 leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* Message row */}
      <div className="flex items-start gap-1.5">
        <Info size={14} className="shrink-0 mt-px" />
        <span>{message}</span>
      </div>

      {/* Checkbox row */}
      <div className="flex items-center gap-1.5 mt-1">
        <Checkbox
          id="governance-permanent"
          checked={permanent}
          onCheckedChange={(checked) => setPermanent(checked === true)}
          className="size-3 rounded-[2px]"
        />
        <Label
          htmlFor="governance-permanent"
          className="text-xs text-blue-700 font-normal cursor-pointer"
        >
          Don't show this again
        </Label>
      </div>
    </div>
  )
}
