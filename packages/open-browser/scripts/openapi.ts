import app from '../src/index';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function generateSpec() {
    // Make a request to the /api/doc endpoint to get the OpenAPI spec
    const res = await app.request('/api/doc');
    const doc = await res.json();
    
    const outputPath = resolve(import.meta.dir, '../openapi.json');
    writeFileSync(outputPath, JSON.stringify(doc, null, 2));
    console.log(`OpenAPI spec generated at: ${outputPath}`);
}

generateSpec();
