import { Hono } from 'hono'
import { Api } from './api/api'

export { SandboxManager } from "./sandbox/manager";
export { Sandbox as CloudflareSandbox } from "@cloudflare/sandbox";

const app = new Hono<{ Bindings: Cloudflare.Env }>()

// Handle open-github.com requests - redirect to open-browser.ai with url param
app.use('*', async (c, next) => {
    const url = new URL(c.req.url)
    
    // Check if request is from open-github.com
    if (url.hostname === 'open-github.com') {
        const path = url.pathname
        
        // Skip empty paths or just "/"
        if (!path || path === '/') {
            return c.redirect('https://open-browser.ai')
        }
        
        // Extract the GitHub path (e.g., "/colinhacks/zod" -> "colinhacks/zod")
        const githubPath = path.startsWith('/') ? path.slice(1) : path
        
        if (!githubPath) {
            return c.redirect('https://open-browser.ai')
        }
        
        // Construct the full GitHub URL and redirect to open-browser.ai with openurl param
        const githubUrl = `https://github.com/${githubPath}`
        return c.redirect(`https://open-browser.ai?openurl=${encodeURIComponent(githubUrl)}`)
    }
    
    return next()
})

app.route('/api', Api.routes)

// Serve static assets for non-API routes on open-browser.ai
// This is a catch-all that returns undefined to let assets be served
app.get('*', async (c) => {
    // Return undefined/null to let Cloudflare serve static assets
    // The assets binding handles SPA routing via not_found_handling
    return c.env.ASSETS.fetch(c.req.raw)
})

export default app
