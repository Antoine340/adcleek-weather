import type { ModuleContext, UserModule } from './types'

import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { configureRouter } from '~/router'

import App from './App.vue'
import './styles/main.css'

async function bootstrap() {
  const app = createApp(App)

  const router = createRouter({
    routes: setupLayouts(routes),
    history: createWebHistory(import.meta.env.BASE_URL),
  })

  // Create module context
  const moduleContext: ModuleContext = {
    app,
    router,
  }

  // Load and install all modules
  const modules = import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true })

  // Sort modules by filename to ensure consistent loading order
  const sortedModules = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))

  for (const [path, module] of sortedModules) {
    try {
      await module.install?.(moduleContext)
    }
    catch (error) {
      console.error(`Failed to load module ${path}:`, error)
    }
  }

  // Add router configuration (auth guards...)
  configureRouter(router)

  // Use router after modules are loaded in case they need to modify routes
  app.use(router)

  // Mount the app
  app.mount('#app')
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
})
