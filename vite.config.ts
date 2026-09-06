import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  // Expose SWETRIX_* (in addition to the default VITE_*) env vars to client code
  // Via import.meta.env. Values come from the shell env or a local .env file
  // (see .env.example); analytics stays disabled when they are unset.
  envPrefix: ['VITE_', 'SWETRIX_'],
  plugins: [react()],
})
