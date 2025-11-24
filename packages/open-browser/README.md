```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Local Development with Sandbox

To test with a local sandbox server:

1. Start the sandbox server in the `packages/sandbox` directory:
```bash
cd packages/sandbox
bun run dev
```

2. The local sandbox will run on `http://localhost:4096` by default

3. When creating a sandbox via the API, use the `"local"` provider:
```json
{
  "url": "https://github.com/user/repo",
  "type": "GITHUB",
  "directory": "/workspace",
  "sdkType": "OPENCODE",
  "provider": "local"
}
```

You can override the local sandbox URL with the `LOCAL_SANDBOX_URL` environment variable.
