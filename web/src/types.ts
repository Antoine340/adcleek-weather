import type { App } from 'vue'
import type { Router } from 'vue-router'

export interface ModuleContext {
  app: App
  router: Router
}

export type UserModule = (ctx: ModuleContext) => void | Promise<void>
