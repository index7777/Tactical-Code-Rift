import { defineConfig } from 'vitest/config';
export default defineConfig({base:'./',build:{outDir:'build/web',sourcemap:true,rollupOptions:{output:{manualChunks:{phaser:['phaser']}}}},test:{include:['src/**/*.test.ts']}});
