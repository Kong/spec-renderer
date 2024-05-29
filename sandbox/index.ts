import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Kongponents from '@kong/kongponents'

import '@kong/kongponents/dist/style.css'
import './assets/scss/_base.scss'

const app = createApp(App)
app.use(router)

app.use(Kongponents)

app.mount('#app')
