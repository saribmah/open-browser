import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { Hono } from 'hono';
import { Api } from '../src/api/api';

async function generateSpec() {
    // Create app without importing from index to avoid Cloudflare-specific imports
    const app = new Hono();
    app.route('/api', Api.routes);
    
    // Make a request to the /api/doc endpoint to get the OpenAPI spec
    const res = await app.request('/api/doc');
    const doc = await res.json();
    
    const outputPath = resolve(import.meta.dir, '../openapi.json');
    writeFileSync(outputPath, JSON.stringify(doc, null, 2));
    console.log(`OpenAPI spec generated at: ${outputPath}`);
}

generateSpec();
