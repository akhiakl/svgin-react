# svgin-react

[![npm version](https://img.shields.io/npm/v/svgin-react.svg)](https://npmjs.com/package/svgin-react)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Securely fetch and inline SVGs from URLs as React components. Supports both client and server rendering, with optimal tree-shaking and modern React best practices.

---

## ✨ Features

- **Client & Server:** Use in React apps, Next.js, RSC, SSR, etc.
- **Sanitization:** Secure by default with DOMPurify (customizable or disableable).
- **In-memory cache:** Fast, avoids duplicate fetches.
- **Preload API:** Preload SVGs for instant rendering.
- **Modern exports:** Separate entrypoints for client, server, and core utilities for best tree-shaking.

---

## 📦 Install

```sh
npm install svgin-react dompurify
```

---

## 🧩 Usage

### Next.js / React Server Components (RSC)

```tsx
// app/icons/AlertIcon.server.tsx
import { SvgInServer } from 'svgin-react/server';

export default async function AlertIcon() {
  return await SvgInServer({ src: '/icons/alert.svg', width: 32 });
}
```

### React Client Components (SPA/CSR/Next.js)

```tsx
// app/icons/AlertIcon.client.tsx
'use client';
import { SvgIn } from 'svgin-react/client';

export default function AlertIcon() {
  return <SvgIn src="/icons/alert.svg" width={24} fill="#f00" />;
}
```

> **Note:** If you use `SvgIn` in a Next.js app directory, you must add `'use client';` at the top of your component file to mark it as a client component.

### Preloading SVGs (client only)

```ts
import { preloadSvg } from 'svgin-react/core';

preloadSvg('/icons/alert.svg');
```

---

## 🔧 API

### `<SvgIn />` (client)

Props:

- `src`: string (URL to the SVG)
- `width`, `height`: number | string
- `fill`: string (for color)
- `fallback`: ReactNode (spinner or fallback SVG)
- `className`: string
- `ariaLabel`: string
- `sanitizeFn?`: (svg: string) => Promise<string> (optional, override or disable sanitization)

### `SvgInServer(props)` (server)

- Same props as `<SvgIn />`, but is an async function for use in server components.

### `preloadSvg(url, sanitizeFn?)`

- Preloads and caches an SVG for later use. Optional custom sanitizer.

---

## 🗂️ Entry Points & Tree-shaking

- `svgin-react/client` → Only the client component (`SvgIn`). No server or preload code included.
- `svgin-react/server` → Only the server component (`SvgInServer`). No client or preload code included.
- `svgin-react/core` → Only core utilities (`preloadSvg`, types, etc.).

This structure ensures **zero bundle bloat**: only the code you import is included in your app.

---

## 🛡️ Security

- By default, all SVGs are sanitized with DOMPurify (dynamically imported, not in bundle unless used).
- You can provide your own `sanitizeFn` or disable sanitization if you trust your SVG source.

---

## 📝 Example: Custom Sanitizer

```tsx
<SvgIn src="/icons/alert.svg" sanitizeFn={async (svg) => svg} />
```

---

## 🏆 Why this structure?

- **Best tree-shaking:** No accidental client/server code mixing.
- **Modern:** Designed for React 18+, Next.js, and future React architectures.
- **Simple:** Only import what you need.

---

## License

MIT
