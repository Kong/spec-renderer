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
if (!process.env.USE_SANDBOX && process.env.VITE_AS_WEB_COMPONENT !== 'true') {
  externalDependencies.push('vue')
}
// Mock API for the sensitive-data-masking sandbox spec
const mockSensitiveDataPlugin = {
  name: 'mock-sensitive-data-api',
  configureServer(server: any) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? ''
      if (!url.startsWith('/mock')) return next()

      const pathname = (url.slice('/mock'.length) || '/').split('?')[0]

      res.setHeader('Content-Type', 'application/json')

      const send = (status: number, body: unknown) => {
        res.statusCode = status
        res.end(JSON.stringify(body))
      }

      if (req.method === 'GET' && /^\/users\/[^/]+$/.test(pathname)) {
        send(200, { id: 'usr_123abc', username: 'alice', email: 'alice@example.com', password: 'hunter2', apiToken: 'tok_super_secret_xyz987', internalNote: 'internal admin note' })
      } else if (req.method === 'POST' && pathname === '/auth/login') {
        send(200, { accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMTIzIn0.secret_sig', refreshToken: 'rt_abc123def456ghi789', expiresIn: 3600, user: { id: 'usr_123abc', username: 'alice', email: 'alice@example.com', password: 'hunter2', apiToken: 'tok_super_secret_xyz987' } })
      } else if (req.method === 'POST' && pathname === '/auth/refresh') {
        // echo the Authorization header back to simulate a token-refresh response
        const authHeader = req.headers['authorization']
        if (authHeader) res.setHeader('Authorization', authHeader)
        send(200, { accessToken: 'eyJhbGciOiJIUzI1NiJ9.new.token', refreshToken: 'rt_new_refresh_xyz', expiresIn: 3600 })
      } else if (req.method === 'GET' && pathname === '/profile') {
        send(200, { id: 'usr_123abc', username: 'alice', email: 'alice@example.com', password: 'hunter2', apiToken: 'tok_super_secret_xyz987', internalNote: 'internal note' })
      } else if (req.method === 'GET' && pathname === '/audit-logs') {
        send(200, [
          { eventId: 'evt_789xyz', action: 'login', actorEmail: 'alice@example.com', ipAddress: '192.168.1.42', timestamp: '2024-01-15T10:30:00Z' },
          { eventId: 'evt_790abc', action: 'update_profile', actorEmail: 'bob@example.com', ipAddress: '10.0.0.1', timestamp: '2024-01-15T11:00:00Z' },
        ])
      } else if (req.method === 'POST' && pathname === '/users') {
        send(201, { id: 'usr_new_456', username: 'newuser', email: 'newuser@example.com', password: 'newpassword123', apiToken: 'tok_new_api_token_abc', internalNote: 'newly created' })
      } else if (req.method === 'POST' && pathname === '/payment-methods') {
        send(201, { type: 'card', card: { last4: '4242', expiry: '12/26', cvv: '123', holderName: 'Alice Smith' } })
      } else if (req.method === 'POST' && pathname === '/oauth/token') {
        send(200, { access_token: 'mock_oauth_token_abc123', token_type: 'Bearer', expires_in: 3600 })
      } else if (req.method === 'POST' && pathname === '/credentials') {
        send(200, { status: 'accepted' })
      } else if (req.method === 'GET' && pathname === '/reports') {
        send(200, { total: 2, items: [{ id: 'rpt_001' }, { id: 'rpt_002' }] })
      } else if (req.method === 'GET' && pathname === '/admin/settings') {
        send(200, { maintenanceMode: false })
      } else if (req.method === 'GET' && pathname === '/orders') {
        send(200, { items: [{ orderId: 'ord_abc123' }, { orderId: 'ord_def456' }] })
      } else if (req.method === 'GET' && pathname === '/metrics') {
        send(200, { requestCount: 1042, errorRate: 0.02 })
      } else {
        send(404, { message: 'Not found' })
      }
    })
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mockSensitiveDataPlugin,
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
      include: ['util', 'path', 'querystring'],
    }),
    vue({
      features: {
        customElement: process.env.VITE_AS_WEB_COMPONENT === 'true',
      },
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
        api: 'modern-compiler',
        // Inject the @kong/design-tokens SCSS variables to make them available for all components.
        // This is not needed in host applications.
        additionalData: `
          @use "sass:color";
          @use "@/styles/globals" as *;
        `,
      },
    },
  },
  base: process.env.USE_SANDBOX ? '/spec-renderer' : '/',
  build: {
    emptyOutDir: process.env.VITE_AS_WEB_COMPONENT !== 'true',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: process.env.USE_SANDBOX
      ? undefined
      : {
        entry: process.env.VITE_AS_WEB_COMPONENT === 'true' ? path.resolve(__dirname, 'src/web-component.ts') : path.resolve(__dirname, 'src/index.ts'),
        name: 'KongSpecRenderer',
        fileName: (format) => {
          if (format === 'cjs') {
            return `kong-spec-renderer.${process.env.VITE_AS_WEB_COMPONENT === 'true' ? 'web-component.' : ''}cjs`
          } else {
            return `kong-spec-renderer.${process.env.VITE_AS_WEB_COMPONENT === 'true' ? 'web-component.' : ''}${format}.js`
          }
        },
        formats: ['es', 'cjs', 'umd'],
        cssFileName: 'spec-renderer',
      },
    minify: true,
    sourcemap: true,
    rollupOptions: {
      input: process.env.USE_SANDBOX
        ? {
          kong: path.resolve(__dirname, './sandbox/index.html'),
        }
        : path.resolve(__dirname, './src/index.ts'),
      external: externalDependencies,
      output: process.env.USE_SANDBOX
        ? undefined
        : {
          globals: process.env.AS_WEB_COMPONENT === 'true' ? undefined : {
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
