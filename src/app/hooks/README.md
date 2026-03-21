# Shared Hooks

This directory contains React hooks that are shared across multiple roles or components.

## Guidelines
- Hooks here should be role-agnostic
- Role-specific hooks belong in their respective role directories
- System-level hooks (e.g., useDebounce, useResizeObserver) belong here

## Future Hooks
- `useDebounce.ts` - Debounce utility
- `useResizeObserver.ts` - Resize detection
- `useLocalStorage.ts` - Local storage persistence
