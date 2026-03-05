import { createRouter, createWebHistory } from 'vue-router'
import DiagramEditor from '../components/DiagramEditor.vue'

const routes = [
  {
    path: '/',
    name: 'DiagramEditor',
    component: DiagramEditor
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
