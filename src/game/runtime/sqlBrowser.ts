import type { SqlJsStatic } from 'sql.js';

let carregando: Promise<SqlJsStatic> | null = null;

/**
 * Carrega o SQL.js (SQLite em WebAssembly) de /public. O script é avaliado como
 * CommonJS para não colidir com o loader AMD (`define`) que o Monaco registra.
 */
export function carregarSQL(): Promise<SqlJsStatic> {
  carregando ??= (async () => {
    const codigo = await (await fetch('/sqljs/sql-wasm.js')).text();
    const modulo: { exports: unknown } = { exports: {} };
    new Function('module', 'exports', codigo)(modulo, modulo.exports);
    const init = modulo.exports as (cfg: { locateFile: (f: string) => string }) => Promise<SqlJsStatic>;
    return init({ locateFile: (f) => `/sqljs/${f}` });
  })();
  carregando.catch(() => (carregando = null));
  return carregando;
}
