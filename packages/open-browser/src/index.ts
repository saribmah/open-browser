import { Hono } from 'hono'
import { Api } from './api/api'
import type { SandboxManager, SandboxConfig } from './sandbox/manager'

export { SandboxManager } from "./sandbox/manager";
export { Sandbox as CloudflareSandbox } from "@cloudflare/sandbox";

const app = new Hono<{ Bindings: Cloudflare.Env }>()

// Handle open-github.com requests - redirect to create sandbox and go to chat
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
        
        // Construct the full GitHub URL
        const githubUrl = `https://github.com/${githubPath}`
        
        // Create sandbox configuration
        const config: SandboxConfig = {
            url: githubUrl,
            type: 'GITHUB',
            directory: '/',
            sdkType: 'OPENCODE',
            provider: (c.env.DEFAULT_SANDBOX_PROVIDER || 'daytona') as SandboxConfig['provider']
        }
        
        try {
            // Get the sandbox manager and create a new sandbox
            const id = c.env.SANDBOX_MANAGER.idFromName('global')
            const manager = c.env.SANDBOX_MANAGER.get(id) as DurableObjectStub<SandboxManager>
            const session = await manager.create(config)
            
            // Redirect to the chat page with the sandbox ID
            return c.redirect(`https://open-browser.ai/chat/${session.id}`)
        } catch (error: any) {
            console.error('Failed to create sandbox from open-github.com:', error)
            // Redirect to home page with error in query params
            return c.redirect(`https://open-browser.ai?error=${encodeURIComponent(error.message || 'Failed to create sandbox')}`)
        }
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
