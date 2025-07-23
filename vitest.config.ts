import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    deps: {
      optimizer: {
        web: {
          // https://github.com/vitest-dev/vitest/issues/4074
          exclude: ['vue'],
        },
      },
    },
    exclude: [
      './dist/**',
      './sandbox/**',
      'node_modules',
    ],

    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['**/*.spec.ts'],
          exclude: ['**/*.component.spec.ts'],
        },
      },
      {
        extends: true,

        test: {
          name: 'component',
          include: ['**/*.component.spec.ts'],
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [
              { browser: 'chromium' },
            ],
          },
        },
      },
    ],
  },
}))
