import { createRouter, createWebHashHistory } from 'vue-router'
//mport Style from '@/views/StyleView.vue'
import Home from '@/views/HomeView.vue'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    meta: {
      title: 'Select style',
    },
    path: '/',
    /* name: 'style',
     component: Style,*/
    component: () => import('@/views/LoginView.vue'),
  },
  {
    // Document title tag
    // We combine it with defaultDocumentTitle set in `src/main.js` on router.afterEach hook
    meta: {
      title: 'Dashboard',
    },
    path: '/dashboard',
    name: 'dashboard',
    component: Home,
  },
  {
    meta: {
      title: 'Tables',
    },
    path: '/tables',
    name: 'tables',
    component: () => import('@/views/TablesView.vue'),
  },
  {
    meta: {
      title: 'Forms',
    },
    path: '/forms',
    name: 'forms',
    component: () => import('@/views/FormsView.vue'),
  },
  {
    meta: {
      title: 'Profile',
    },
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    meta: {
      title: 'Ui',
    },
    path: '/ui',
    name: 'ui',
    component: () => import('@/views/UiView.vue'),
  },
  {
    meta: {
      title: 'Responsive layout',
    },
    path: '/responsive',
    name: 'responsive',
    component: () => import('@/views/ResponsiveView.vue'),
  },
  {
    meta: {
      title: 'Login',
    },
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    meta: {
      title: 'Error',
    },
    path: '/error',
    name: 'error',
    component: () => import('@/views/ErrorView.vue'),
  },
  {
    meta: {
      title: 'Events',
    },
    path: '/events',
    children: [
      /*{
        path: '', // /events
        name: 'EventList',
        component: EventList
      },*/
      {
        path: 'add', // /events/add
        name: 'EventAdd',
         component: () => import('@/views/Events/Add.vue'),
      },
      /*{
        path: ':id', // /events/:id
        name: 'EventDetail',
        component: EventDetail,
        props: true
      }*/
    ]
  },



]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})
const publicPages = ['/login']

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const isPublic = publicPages.includes(to.path)

  if (!userStore.token && !isPublic) {
    return next('/login')
  }

  if (userStore.token && !userStore.user) {
    try {
      await userStore.fetchUser()
    } catch (err) {
      userStore.logout()
      return next('/login')
    }
  }

  next()
})

export default router
