import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'root',
    component: () => import('./pages/SpecRendererPlayground.vue'),
  },
  {
    path: '/components',
    name: 'components',
    component: () => import('./pages/ComponentsPlayground.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/spec-renderer'),
  routes,
})

export default router
