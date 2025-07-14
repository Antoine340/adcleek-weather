import type { Router } from 'vue-router'

export function configureRouter(router: Router) {
  router.beforeEach((to) => {
    console.debug('Routing to: ', to.path)
  })
}
