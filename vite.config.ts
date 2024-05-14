import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import vue from '@vitejs/plugin-vue'
import { replaceCodePlugin } from 'vite-plugin-replace'
import path, { join } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Include the rollup-plugin-visualizer if the BUILD_VISUALIZER env var is set to "true"
const buildVisualizerPlugin = process.env.BUILD_VISUALIZER
  ? visualizer({
    filename: path.resolve(__dirname, 'bundle-analyzer/stats-treemap.html'),
    template: 'treemap', // sunburst|treemap|network
    sourcemap: true,
    gzipSize: true,
  })
  : undefined

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    replaceCodePlugin({
      replacements: [
        {
          from: /if\s\(typeof module\s===\s"object"\s&&\stypeof\smodule\.exports\s===\s"object"\)\s\{\n.*;\n\}/m,
          to: '',
        },
      ],
    }),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['util'],
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('elements-api'),
        },
      },
    }),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      // Alias src directory for imports
      '@': path.resolve(__dirname, './src/'),
    },
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        // Inject the @kong/design-tokens SCSS variables to make them available for all components.
        // This is not needed in host applications.
        additionalData: '@use "sass:color";@import "@kong/design-tokens/tokens/scss/variables";',
      },
    },
  },
  // TODO: If deploying to GitHub pages, enable this line
  base: process.env.USE_SANDBOX ? '/spec-renderer/' : '/',
  build: {
    lib: process.env.USE_SANDBOX
      ? undefined
      : {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'KongSpecRenderer',
        fileName: (format) => `kong-spec-renderer.${format}.js`,
      },
    emptyOutDir: true,
    minify: true,
    sourcemap: true,
    rollupOptions: {
      external: process.env.USE_SANDBOX ? undefined : ['vue'],
      output: process.env.USE_SANDBOX
        ? undefined
        : {
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
        },
      plugins: [
        //         replace({
        //           delimiters: ['', ''],
        //           preventAssignment: true,
        //           values: {
        // 'if (typeof module === "object" && typeof module.exports === "object") {\nmodule.exports = Object.assign(module.exports.default, module.exports)\n}': '',
        //           },
        //         }),
        // visualizer must remain last in the list of plugins
        buildVisualizerPlugin,
      ],
    },
  },
  optimizeDeps: {
    include: [
      'vue',
    ],
  },
  server: {
    open: !!process.env.USE_SANDBOX,
    fs: {
      // Allow serving files from one level up from the package root - IMPORTANT - to support the sandbox
      allow: [join(__dirname, '..')],
    },
  },
  // Change the root when utilizing the sandbox via USE_SANDBOX=true to use the `/sandbox/*` files
  // During the build process, the `/sandbox/*` files are not used and we should default to the package root.
  root: process.env.USE_SANDBOX ? './sandbox' : process.cwd(),
})
