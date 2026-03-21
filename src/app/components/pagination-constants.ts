/**
 * Pagination and zoom constants for Preview component.
 * Single source of truth for all dimension, layout, and timing values.
 * 
 * CRITICAL: These constants are tightly coupled across zoom and pagination systems.
 * Changes to one constant may require recalibration of others.
 */

/**
 * Physical page dimensions and rendering parameters.
 * 
 * These define the virtual page geometry used for pagination calculations.
 * All measurements converted to pixels using DPI for DOM layout.
 * 
 * Dependencies:
 * - contentWidth MUST equal (width - 2 * padding) for correct measurement
 * - DPI must match browser default (96) for accurate inch-to-pixel conversion
 */
export const PAGE_DIMENSIONS = {
  /** Page width in inches - standard US Letter width */
  width: 8.5,
  /** Page height in inches - standard US Letter height */
  height: 11,
  /** Content width in inches (page width - 2 * padding) - MUST stay in sync with width and padding */
  contentWidth: 6.5,
  /** Page padding in inches - uniform padding on all sides */
  padding: 1,
  /** Dots per inch for pixel conversion - browser standard, do not change */
  dpi: 96,
} as const;

/**
 * Layout spacing and safety margins.
 * 
 * These control visual spacing and prevent edge cases in pagination.
 * 
 * Dependencies:
 * - pageGap MUST match Tailwind's gap-8 class (32px = 2rem)
 * - containerPadding MUST match Tailwind's p-8 class (64px = 2 * 32px)
 * - Changes to Tailwind classes require updating these constants
 * 
 * Purpose:
 * - pageGap: Visual separation between pages in scroll container
 * - safetyMargin: Prevents bottom content from being cut off at page boundaries
 * - containerPadding: Total horizontal padding for fit-to-width calculation
 */
export const LAYOUT = {
  /** Gap between pages in pixels (must match Tailwind gap-8: 32px = 2rem) */
  pageGap: 32,
  /** Safety margin in pixels to ensure bottom padding is visible (reduces effective page height) */
  safetyMargin: 20,
  /** Container padding in pixels (must match Tailwind p-8: 64px = 2 * 32px for left + right) */
  containerPadding: 64,
} as const;

/**
 * Timing parameters for async rendering operations.
 * 
 * These control when measurements occur relative to DOM updates.
 * Timing is critical: too fast = incorrect measurements, too slow = visible flashing.
 * 
 * Dependencies:
 * - measurementDelay must allow template styles to apply before measuring
 * - rafCount ensures layout has stabilized before calculating zoom
 * 
 * Known issues:
 * - 50ms delay is a heuristic that may fail with very complex content
 * - Double RAF is brittle and may need adjustment for different browsers
 */
export const TIMING = {
  /** Delay in milliseconds before measuring content for pagination (allows styles to apply) */
  measurementDelay: 50,
  /** Number of requestAnimationFrame calls for DOM stabilization (ensures layout complete) */
  rafCount: 2,
} as const;

/**
 * Zoom level constraints and comparison thresholds.
 * 
 * These prevent zoom artifacts and floating point comparison errors.
 * 
 * Dependencies:
 * - changeThreshold prevents infinite update loops from float imprecision
 * - min/max bounds prevent unusable zoom levels
 * 
 * Note:
 * - Fit-to-width auto-zoom is clamped between min and max
 * - changeThreshold chosen to be larger than typical float rounding errors
 */
export const ZOOM = {
  /** Minimum zoom level (25%) - prevents content from becoming unreadable */
  min: 0.25,
  /** Maximum zoom level (200%) - prevents excessive memory/performance issues */
  max: 2.0,
  /** Threshold for detecting zoom changes to avoid floating point comparison issues */
  changeThreshold: 0.001,
} as const;

/**
 * Runtime validation for pagination constants.
 * 
 * These checks detect configuration errors that would cause incorrect pagination.
 * Validation runs on module load and throws immediately if invariants are violated.
 */
function validateConstants() {
  const errors: string[] = [];

  // Validate PAGE_DIMENSIONS relationships
  const expectedContentWidth = PAGE_DIMENSIONS.width - 2 * PAGE_DIMENSIONS.padding;
  if (Math.abs(PAGE_DIMENSIONS.contentWidth - expectedContentWidth) > 0.001) {
    errors.push(
      `PAGE_DIMENSIONS.contentWidth (${PAGE_DIMENSIONS.contentWidth}) must equal width - 2*padding (${expectedContentWidth})`
    );
  }

  if (PAGE_DIMENSIONS.dpi !== 96) {
    errors.push(
      `PAGE_DIMENSIONS.dpi (${PAGE_DIMENSIONS.dpi}) should be 96 to match browser standard. Non-standard DPI may cause measurement errors.`
    );
  }

  // Validate LAYOUT matches Tailwind expectations
  if (LAYOUT.pageGap !== 32) {
    errors.push(
      `LAYOUT.pageGap (${LAYOUT.pageGap}) should be 32 to match Tailwind gap-8. Update Tailwind class or constant.`
    );
  }

  if (LAYOUT.containerPadding !== 64) {
    errors.push(
      `LAYOUT.containerPadding (${LAYOUT.containerPadding}) should be 64 to match Tailwind p-8. Update Tailwind class or constant.`
    );
  }

  if (LAYOUT.safetyMargin < 0) {
    errors.push(
      `LAYOUT.safetyMargin (${LAYOUT.safetyMargin}) must be non-negative.`
    );
  }

  // Validate TIMING parameters
  if (TIMING.measurementDelay < 0) {
    errors.push(
      `TIMING.measurementDelay (${TIMING.measurementDelay}) must be non-negative.`
    );
  }

  if (TIMING.rafCount < 1) {
    errors.push(
      `TIMING.rafCount (${TIMING.rafCount}) must be at least 1.`
    );
  }

  // Validate ZOOM constraints
  if (ZOOM.min >= ZOOM.max) {
    errors.push(
      `ZOOM.min (${ZOOM.min}) must be less than ZOOM.max (${ZOOM.max}).`
    );
  }

  if (ZOOM.min <= 0) {
    errors.push(
      `ZOOM.min (${ZOOM.min}) must be positive.`
    );
  }

  if (ZOOM.changeThreshold <= 0) {
    errors.push(
      `ZOOM.changeThreshold (${ZOOM.changeThreshold}) must be positive.`
    );
  }

  if (ZOOM.changeThreshold >= 0.01) {
    errors.push(
      `ZOOM.changeThreshold (${ZOOM.changeThreshold}) is too large and may prevent zoom changes. Recommended: < 0.01`
    );
  }

  // Throw if any errors found
  if (errors.length > 0) {
    throw new Error(
      `Pagination constants validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

// Run validation on module load
validateConstants();