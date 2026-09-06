/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Base URL of the Swetrix analytics instance. Analytics is disabled when unset. */
    readonly SWETRIX_BASE_URL?: string;
    /** Swetrix project ID. Analytics is disabled when unset. */
    readonly SWETRIX_PROJECT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
