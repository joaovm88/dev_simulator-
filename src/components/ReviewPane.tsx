'use client';

import { etapaAtual, useJogo } from '@/game/state/store';

/** Code review invertido: o jogador marca as linhas problemáticas do código de um colega. */
export function ReviewPane() {
  const progresso = useJogo((s) => s.progresso);
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const falsos = useJogo((s) => s.revisaoFalsos);
  const alternarLinha = useJogo((s) => s.alternarLinha);
  const enviarRevisao = useJogo((s) => s.enviarRevisao);
  const atual = etapaAtual({ progresso, questAtivaId });
  if (!atual || atual.etapa.tipo !== 'REVISAO_CODIGO') return null;
  const { etapa, progresso: p } = atual;

  return (
    <div className="flex h-full flex-col bg-fundo">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-borda bg-painel px-3 py-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ambar">Code review</div>
          <div className="truncate font-mono text-[12px] text-suave">{etapa.autor}</div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[12px] text-suave">
            <span className="font-mono text-texto">{p.marcadas.length}</span> marcada(s) · procure{' '}
            <span className="font-mono text-texto">{etapa.problemas.length}</span> problemas
          </span>
          <button onClick={enviarRevisao} className="rounded bg-verde px-3 py-1 text-[12px] font-semibold text-black hover:brightness-110">
            Enviar revisão
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-2 font-mono text-[13px] leading-[1.8]" data-testid="revisao">
        {etapa.codigo.split('\n').map((linha, i) => {
          const n = i + 1;
          const marcada = p.marcadas.includes(n);
          const falso = falsos.includes(n);
          if (linha.trim() === '') {
            return (
              <div key={n} className="flex">
                <span className="w-11 shrink-0 select-none pr-3 text-right text-[#3b4656]">{n}</span>
              </div>
            );
          }
          return (
            <button
              key={n}
              data-linha={n}
              aria-pressed={marcada}
              aria-label={`Linha ${n}: ${linha.trim()}`}
              onClick={() => alternarLinha(n)}
              className={`flex w-full border-l-2 text-left ${
                falso ? 'border-ambar bg-ambar/10' : marcada ? 'border-vermelho bg-vermelho/15' : 'border-transparent hover:bg-painel2'
              }`}
            >
              <span className="w-[42px] shrink-0 select-none pr-3 text-right text-[#3b4656]">{n}</span>
              <span className="whitespace-pre text-texto">{linha}</span>
              {marcada && <span className={`ml-auto shrink-0 px-3 text-[11px] ${falso ? 'text-ambar' : 'text-vermelho'}`}>{falso ? 'esta linha está correta' : '⚑ problema'}</span>}
            </button>
          );
        })}
      </div>
      <p className="shrink-0 border-t border-borda bg-painel px-3 py-2 text-[12px] text-suave">Clique em uma linha para marcá-la (ou desmarcá-la) como problemática.</p>
    </div>
  );
}
