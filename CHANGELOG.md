# Changelog

All notable changes to the Mylo document collaboration platform prototype will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Text case transformation feature in Editor toolbar (2025-03-01)
  - Added `transformCase` function supporting 4 case types: ALL CAPS, Title Case, lowercase, Sentence case
  - Added CaseSensitive icon button with popover UI containing 4 case transformation options
  - Implemented full mark preservation during transformation (bold, italic, underline, links, superscript, subscript)
  - Added edge case handling:
    - No-op for empty selections
    - No-op for whitespace-only selections
    - No-op optimization when transformation produces identical text
    - Multi-paragraph selection support
  - Verified template presentation layer remains authoritative in Preview (template textTransform rules override content case)
  - All transformations work correctly in both Editor and Preview panels with both Default Professional and Formal Document templates

- Dynamic fit-to-width zoom system with panel resize adaptation (2025-03-01)
  - Removed manual zoom controls (+/- buttons, percentage display)
  - Implemented ResizeObserver to automatically recalculate fit-to-width when Preview panel width changes
  - Preview now adapts automatically when user drags the divider between Editor and Preview panels
  - Added visible grip handle to the panel divider for improved discoverability
  - Zoom automatically adjusts to maximize readable page size within available panel width
  - Simplified Preview UI to reflect "Preview is authoritative pagination truth" governance principle
  - Zoom clamped between 25% and 200% to maintain usability across panel sizes

## Architecture Notes

### Text Case Transformation Implementation
- **Surface**: Editor (drafting intent)
- **Authority**: Contributor controls content case; Template Editor controls Preview rendering
- **Persistence**: Document content state (case transformations are saved)
- **Undo**: Single transaction per transformation
- **Governance compliance**: Preview template rules (e.g., uppercase H1/H2 in Formal template) remain authoritative and override content case
- **Mark preservation**: Transformations preserve all character markers including links with href attributes intact
- **Selection scope**: Works on caret selection, partial selection, multi-paragraph selection

### Dynamic Fit-to-Width Zoom Implementation
- **Surface**: Preview (presentation layer)
- **Authority**: System controlled (automatic adaptation)
- **Persistence**: Session state only (does not export or persist across reloads)
- **Mechanism**: ResizeObserver watches Preview container width; recalculates on resize
- **User interaction**: Dragging panel divider triggers automatic zoom recalculation
- **Governance compliance**: Choice B implementation - single automatic fit-to-width mode with no manual controls reinforces "Preview is authoritative" principle
- **Technical approach**: CSS `transform: scale()` with scroll position preservation during zoom changes
- **Responsive behavior**: Adapts to window resize and panel resize events