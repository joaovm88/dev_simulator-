// Copia os runtimes WebAssembly e o Monaco para /public, para o jogo
// funcionar sem depender de CDN (roda offline e atrás de proxies corporativos).
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = (...p) => join(root, 'node_modules', ...p);
const pub = (...p) => join(root, 'public', ...p);

const copias = [
  ...['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'].map((f) => [
    nm('pyodide', f),
    pub('pyodide', f),
  ]),
  [nm('sql.js', 'dist', 'sql-wasm.js'), pub('sqljs', 'sql-wasm.js')],
  [nm('sql.js', 'dist', 'sql-wasm.wasm'), pub('sqljs', 'sql-wasm.wasm')],
  [nm('monaco-editor', 'min', 'vs'), pub('monaco', 'vs')],
];

for (const [de, para] of copias) {
  if (!existsSync(de)) {
    console.warn(`[copy-assets] ausente: ${de}`);
    continue;
  }
  mkdirSync(dirname(para), { recursive: true });
  cpSync(de, para, { recursive: true });
}
console.log('[copy-assets] runtimes copiados para public/');
