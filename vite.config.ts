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

// !Important: always externalize `shiki/onig.wasm`
const externalDependencies: string[] = ['shiki/onig.wasm']
// If not loading sandbox, externalize vue
if (!process.env.USE_SANDBOX) {
  externalDependencies.push('vue')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    replaceCodePlugin({
      /**
       *  This is to avoid warning:
       *
       * The CommonJS "module" variable is treated as a global variable in an ECMAScript module and may not work as expected [commonjs-variable-in-esm]
       *
       *  due to presence of the invalid code in one @jsdevtools/ono dependency
       *
       *  https://github.com/JS-DevTools/ono/blob/master/src/index.ts#L12
       */
      replacements: [
        {
          from: /if\s\(typeof module\s===\s"object"\s&&\stypeof\smodule\.exports\s===\s"object"\)\s\{\n.*;\n\}/m,
          to: '',
        },
        /**
         * prevent error in ssr
         *
         * error deferencing Cannot read properties of undefined (reading 'origin')
         *
         * due to location is not defined in this code:
         * https://github.com/stoplightio/json-schema-ref-parser/blob/master/lib/environment/browser.js#L5
         *
         */
        {
          from: 'exports.getCwd = () => location.origin + location.pathname;',
          to: 'exports.getCwd = () => typeof location !== "undefined" ? location.origin + location.pathname:"";',
        },
        /**
         * prevent @asyncapi/parser/browser/index.js to throw an error when window object is not found in ssr more
         */
        {
          from: 'throw new Error("unable to locate global object")',
          to: 'return {fetch:()=>{}}',
        },
        /**
         * prevent @asyncapi/parser/browser/index.js to throw an error when attempting to manipulate with AbortController/AbortSignal in ssr mode
         */
        {
          from: 'const{AbortController:t,AbortSignal:i}="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0',
          to: 'const{AbortController:t,AbortSignal:i}="undefined"!=typeof self?self:"undefined"!=typeof window?window:{AbortController:{},AbortSignal:{}}',
        },
      ],
    }),
    /**
     * this is to avoid warning
     * [plugin:vite:resolve] [plugin vite:resolve] Module "util" has been externalized for browser compatibility, imported by "/Users/val.gorodnichev@konghq.com/Code/Kong/ui/spec-renderer/node_modules/.pnpm/@jsdevtools+ono@7.1.3/node_modules/@jsdevtools/ono/esm/types.js". See https://vitejs.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
     * during the build
     */
    nodePolyfills({
      include: ['util', 'path'],
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => ['asyncapi-component', 'elements-api'].includes(tag),
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
        additionalData: '@use "sass:color";@import "@kong/design-tokens/tokens/scss/variables";@import "@/styles/mixins/mixins";@import "@/styles/variables";',
      },
    },
  },
  // TODO: If deploying to GitHub pages, enable this line
  base: process.env.USE_SANDBOX ? '/spec-renderer' : '/',
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
      input: process.env.USE_SANDBOX
        ? {
          kong: path.resolve(__dirname, './sandbox/index.html'),
          stoplight: path.resolve(__dirname, './sandbox/stoplight/index.html'),
          async: path.resolve(__dirname, './sandbox/async/index.html'),
        }
        : path.resolve(__dirname, './src/index.ts'),
      external: externalDependencies,
      output: process.env.USE_SANDBOX
        ? undefined
        : {
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
        },
      plugins: [
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
