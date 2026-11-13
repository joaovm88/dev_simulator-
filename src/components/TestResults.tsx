'use client';

import { useJogo } from '@/game/state/store';
import { Rich } from './Rich';

export function TestResults() {
  const resultado = useJogo((s) => s.resultado);
  const validando = useJogo((s) => s.validando);
  const abrirArquivo = useJogo((s) => s.abrirArquivo);
  const arquivos = useJogo((s) => (s.questAtivaId ? s.arquivos[s.questAtivaId] : undefined));
  const temArquivo = (caminho: string) => arquivos?.[caminho] !== undefined;

  if (validando) return <p className="p-3 font-mono text-suave">Executando o Test Runner…</p>;
  if (!resultado) {
    return (
      <p className="p-3 text-suave">
        Nenhuma execução ainda. Use <span className="font-semibold text-verde">✓ Rodar testes</span> (ou Ctrl+Enter no editor) para validar a etapa atual.
      </p>
    );
  }
  const passou = resultado.testes.filter((t) => t.ok).length;
  return (
    <div className="p-3">
      <div className={`mb-2 font-mono text-[12px] font-semibold ${resultado.ok ? 'text-verde' : 'text-vermelho'}`}>
        {passou} de {resultado.testes.length} verificações passaram
      </div>
      <ul className="space-y-1.5">
        {resultado.testes.map((t, i) => (
          <li key={i} className="rounded border border-borda bg-painel px-3 py-2">
            <div className="flex items-start gap-2 font-mono text-[12px]">
              <span className={t.ok ? 'text-verde' : 'text-vermelho'}>{t.ok ? '✓' : '✗'}</span>
              <span className={t.ok ? 'text-texto' : 'text-white'}>{t.nome}</span>
              {!t.ok && t.arquivo && temArquivo(t.arquivo) && (
                <button onClick={() => abrirArquivo(t.arquivo!)} className="ml-auto shrink-0 text-azul hover:underline">
                  {t.arquivo}
                  {t.linha ? `:${t.linha}` : ''}
                </button>
              )}
            </div>
            {!t.ok && t.detalhe && (
              <div className="mt-1 pl-5 text-[12px] leading-relaxed text-suave">
                <Rich texto={t.detalhe} />
              </div>
            )}
            {!t.ok && t.saida && (
              <pre className="ml-5 mt-1.5 overflow-x-auto rounded bg-fundo p-2 font-mono text-[11px] text-suave">
                <span className="text-borda">saída do programa:{'\n'}</span>
                {t.saida}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
