import { defineConfig } from 'vitest/config';
export default defineConfig({base:'./',build:{outDir:'dist/web',sourcemap:true},test:{include:['src/**/*.test.ts']}});
