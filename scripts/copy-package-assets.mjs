import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/styles', { recursive: true });
await cp('src/styles', 'dist/styles', { recursive: true });
await cp('src/tailwind-preset.cjs', 'dist/tailwind-preset.cjs');
