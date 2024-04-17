import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {

    path: '/',
    name: 'root',
    redirect: { name: 'stoplight' },
    children: [{
      path: 'spec-renderer',
      name: 'home',
      redirect: { name: 'stoplight' },
      children: [{
        path: 'parser:afterBase(.*)',
        name: 'parser',
        component: () => import('./pages/SpecRendererPlayground.vue'),
      },
      {
        path: 'stoplight',
        name: 'stoplight',
        component: () => import('./pages/StoplightPlayground.vue'),
      }],
    }],
  }]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
