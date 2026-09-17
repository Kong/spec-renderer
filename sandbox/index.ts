import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@kong/design-tokens/themes/classic-day.css'
import '@kong/design-tokens/themes/classic-night.css'
import './color-mode'

const app = createApp(App)
app.use(router)

app.mount('#app')
