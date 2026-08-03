import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.spec.ts'],
    exclude: [
      './dist/**',
      './sandbox/**',
      './cli/**',
      'node_modules',
    ],
    projects: [
      {
        extends: true,
      },
      {
        test: {
          name: 'cli',
          globals: true,
          environment: 'node',
          include: ['cli/**/*.spec.ts'],
        },
      },
    ],
    setupFiles: ['./vitest.setup.ts'],
    deps: {
      optimizer: {
        web: {
          // https://github.com/vitest-dev/vitest/issues/4074
          exclude: ['vue'],
        },
      },
    },
  },
}))
