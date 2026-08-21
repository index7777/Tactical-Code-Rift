import { defineConfig } from 'vitest/config';
export default defineConfig({base:'./',build:{outDir:'dist/web',sourcemap:true,rollupOptions:{output:{manualChunks:{phaser:['phaser']}}}},test:{include:['src/**/*.test.ts']}});
