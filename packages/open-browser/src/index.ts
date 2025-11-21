import { Hono } from 'hono'
import { Api } from './api/api'

const app = new Hono()

app.route('/api', Api.routes)

export default app
