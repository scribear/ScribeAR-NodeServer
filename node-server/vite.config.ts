import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./src/**/*.test.ts'],
    coverage: {
      enabled: true,
      provider: 'istanbul', // or 'v8'
      include: ['src'],
      exclude: ['src/index.ts']
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@server': path.resolve(__dirname, './src/server'),
      '@src': path.resolve(__dirname, './src/'),
      '@test': path.resolve(__dirname, './test/'),
    },
  },
})