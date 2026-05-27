/**
 * @file contributor/preview/types.ts
 * @role Shared types for the preview subsystem
 * @owns ZoomMode — single source of truth used by PreviewPanel, PreviewToolbar,
 *       and usePreviewZoom. Consolidated here to prevent the three-way divergence
 *       that existed when each file defined its own local copy.
 */

export type ZoomMode = 'fit-width' | 'fit-page' | '100%';
