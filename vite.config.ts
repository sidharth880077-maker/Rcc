
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  // Fix: Removed process.cwd() and loadEnv to resolve "Property 'cwd' does not exist on type 'Process'" error.
  // Fix: Removed manual process.env definition as the API_KEY is injected automatically by the platform.
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
