import { Hono } from 'hono'
import { Api } from './api/api'

export { SandboxManager } from "./sandbox/manager";

const app = new Hono<{ Bindings: Cloudflare.Env }>()

app.route('/api', Api.routes)

export default app
