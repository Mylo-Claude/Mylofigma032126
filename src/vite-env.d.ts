/// <reference types="vite/client" />

declare module 'pagedjs';

interface ImportMetaEnv {
  readonly VITE_GOOGLE_FONTS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
