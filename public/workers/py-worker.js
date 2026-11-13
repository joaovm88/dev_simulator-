// Worker (module) que hospeda o Pyodide. Rodar fora da thread principal permite
// encerrar o worker quando o código do jogador entra em loop infinito.
import { loadPyodide } from '/pyodide/pyodide.mjs';

let pronto = null;
let executar = null;

self.onmessage = async (ev) => {
  const { id, harness, payload } = ev.data;
  try {
    if (!pronto) {
      pronto = (async () => {
        const py = await loadPyodide({ indexURL: '/pyodide/' });
        py.runPython(harness);
        executar = py.globals.get('_executar');
      })();
    }
    await pronto;
    if (!payload) {
      self.postMessage({ id, ok: true, result: '{}' });
      return;
    }
    self.postMessage({ id, ok: true, result: executar(JSON.stringify(payload)) });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String(e) });
  }
};
