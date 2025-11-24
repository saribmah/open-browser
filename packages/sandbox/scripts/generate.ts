import { createClient } from '@hey-api/openapi-ts';
import { resolve } from 'path';

createClient({
    input: resolve(import.meta.dir, '../openapi.json'),
    output: resolve(import.meta.dir, '../../web/src/client/sandbox'),
});

createClient({
    input: resolve(import.meta.dir, '../openapi.json'),
    output: resolve(import.meta.dir, '../../open-browser/src/sandbox/client'),
});
