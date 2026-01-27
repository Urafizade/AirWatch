// Optional: type definitions for Vite's import.meta.env to quiet TypeScript
interface ImportMetaEnv {
  readonly VITE_GOOGLE_GEOCODING_API_KEY?: string;
  readonly VITE_GOOGLE_AIR_QUALITY_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
