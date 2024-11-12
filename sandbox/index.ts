import { createApp } from 'vue'
import router from './router'
import { loader } from '@guolao/vue-monaco-editor'
import App from './App.vue'

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs',
  },
})

const app = createApp(App)
app.use(router)
app.mount('#app')
