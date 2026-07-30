import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/lib/auth'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'requests/new',
          name: 'request-new',
          component: () => import('@/views/RequestCreateView.vue'),
        },
        {
          path: 'requests/new-on-behalf',
          name: 'request-on-behalf',
          component: () => import('@/views/RequestOnBehalfView.vue'),
        },
        {
          path: 'requests/:id',
          name: 'request-detail',
          component: () => import('@/views/RequestDetailView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
        },
        {
          path: 'users/new',
          name: 'users-new',
          component: () => import('@/views/UserCreateView.vue'),
        },
        {
          path: 'reports/platform',
          name: 'report-platform',
          component: () => import('@/views/ReportView.vue'),
          props: { level: 'platform' },
        },
        {
          path: 'reports/country',
          name: 'report-country',
          component: () => import('@/views/ReportView.vue'),
          props: { level: 'country' },
        },
        {
          path: 'reports/territory',
          name: 'report-territory',
          component: () => import('@/views/ReportView.vue'),
          props: { level: 'territory' },
        },
        {
          path: 'reports/site',
          name: 'report-site',
          component: () => import('@/views/ReportView.vue'),
          props: { level: 'site' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const { state, bootstrap, isAuthenticated } = useAuth()
  if (!state.ready) await bootstrap()
  if (to.meta.public) {
    if (isAuthenticated.value && to.name === 'login') return { name: 'dashboard' }
    return true
  }
  if (!getToken()) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
