import { PYTHON_HARNESS, type ExecutorPython, type PayloadPython, type RespostaPython } from './pythonHarness';

const TEMPO_LIMITE_MS = 10_000;

let worker: Worker | null = null;
let inicializado: Promise<void> | null = null;
let seq = 0;

function enviar(w: Worker, payload: PayloadPython | null): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const ouvir = (ev: MessageEvent) => {
      if (ev.data?.id !== id) return;
      w.removeEventListener('message', ouvir);
      w.removeEventListener('error', falhar);
      if (ev.data.ok) resolve(ev.data.result);
      else reject(new Error(ev.data.error));
    };
    const falhar = (ev: ErrorEvent) => {
      w.removeEventListener('message', ouvir);
      w.removeEventListener('error', falhar);
      reject(new Error(ev.message || 'Falha ao iniciar o runtime Python.'));
    };
    w.addEventListener('message', ouvir);
    w.addEventListener('error', falhar);
    w.postMessage({ id, harness: PYTHON_HARNESS, payload });
  });
}

function descartar() {
  worker?.terminate();
  worker = null;
  inicializado = null;
}

/** Sobe o Pyodide em segundo plano (primeira carga leva alguns segundos). */
export function aquecerPython(): Promise<void> {
  if (!worker) {
    worker = new Worker('/workers/py-worker.js', { type: 'module' });
    inicializado = enviar(worker, null).then(
      () => undefined,
      (e) => {
        descartar();
        throw e;
      },
    );
  }
  return inicializado!;
}

export const executarPython: ExecutorPython = async (payload) => {
  await aquecerPython();
  const w = worker!;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // O worker fica preso no loop do jogador: encerra e recria na próxima execução.
      descartar();
      reject(new Error('TEMPO_ESGOTADO'));
    }, TEMPO_LIMITE_MS);
  });
  try {
    const bruto = await Promise.race([enviar(w, payload), limite]);
    return JSON.parse(bruto) as RespostaPython;
  } catch (e) {
    if ((e as Error).message !== 'TEMPO_ESGOTADO') throw e;
    const erro = {
      tipo: 'TimeoutError',
      mensagem: `A execução passou de ${TEMPO_LIMITE_MS / 1000}s e foi interrompida. Há algum laço que nunca termina?`,
      arquivo: null,
      linha: null,
    };
    if (payload.modo === 'script') return { saida: '', erro };
    return { testes: (payload.testes ?? []).map((t) => ({ nome: t.nome, ok: false, saida: '', erro })) };
  } finally {
    clearTimeout(timer);
  }
};
