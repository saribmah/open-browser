import { Router } from '../src/router/router';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function generateSpec() {
    const res = await Router.routes.request('/doc');
    const doc = await res.json();
    
    const outputPath = resolve(import.meta.dir, '../openapi.json');
    writeFileSync(outputPath, JSON.stringify(doc, null, 2));
    console.log(`OpenAPI spec generated at: ${outputPath}`);
}

generateSpec();
