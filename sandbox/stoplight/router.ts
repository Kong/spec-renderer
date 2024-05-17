import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {

    path: '/:pathMatch(.*)*',
    name: 'root',
    //    alias: '',
    component: () => import('./pages/StoplightPlayground.vue'),
  }]

const router = createRouter({
  history: createWebHistory('/spec-renderer/stoplight'),
  routes,
})

export default router
