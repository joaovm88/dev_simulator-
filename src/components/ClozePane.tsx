'use client';

import { useEffect, useState } from 'react';
import { MARCADOR, chaveLacuna, embaralhar, idsDoModelo } from '@/game/lacunas';
import type { Lacunas } from '@/game/types';
import { useJogo } from '@/game/state/store';

const rotulo = (texto: string) => (texto === '' ? '(nada)' : texto);

/** Modo guiado: o código da etapa com lacunas clicáveis e a explicação de cada opção. */
export function ClozePane({ modelo }: { modelo: Lacunas }) {
  const escolhas = useJogo((s) => (s.questAtivaId ? s.progresso[s.questAtivaId]?.lacunas : undefined)) ?? {};
  const erradas = useJogo((s) => s.lacunasErradas);
  const escolherLacuna = useJogo((s) => s.escolherLacuna);
  const ids = idsDoModelo(modelo);
  const chave = (id: string) => chaveLacuna(modelo.arquivo, id);
  const primeiraVazia = () => ids.find((id) => escolhas[chave(id)] === undefined) ?? null;
  const [aberta, setAberta] = useState<string | null>(primeiraVazia);

  useEffect(() => {
    setAberta(primeiraVazia());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo.arquivo]);

  const escolher = (id: string, texto: string) => {
    escolherLacuna(chave(id), texto);
    const proxima = ids.find((outro) => outro !== id && escolhas[chave(outro)] === undefined);
    setAberta(proxima ?? null);
  };

  const preenchidas = ids.filter((id) => escolhas[chave(id)] !== undefined).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-borda bg-painel2 px-3 py-1.5 text-[12px]">
        <span className="text-texto">
          <span className="mr-1.5 font-semibold text-ambar">Modo guiado</span>
          Clique em uma lacuna para ver o que cada opção faz.
        </span>
        <span className="font-mono tabular-nums text-suave" data-testid="lacunas-contagem">
          {preenchidas}/{ids.length} preenchidas
        </span>
      </div>

      <pre className="min-h-0 flex-1 overflow-auto py-2 font-mono text-[13px] leading-[1.75]" data-testid="cloze">
        {modelo.modelo.replace(/\n$/, '').split('\n').map((linha, i) => (
          <div key={i} className="flex">
            <span className="w-11 shrink-0 select-none pr-3 text-right text-[#3b4656]">{i + 1}</span>
            <span className="whitespace-pre text-texto">
              {linha.split(MARCADOR).map((parte, j) => {
                if (j % 2 === 0) return <span key={j}>{parte}</span>;
                const valor = escolhas[chave(parte)];
                const errada = erradas.includes(chave(parte));
                const cor = errada
                  ? 'border-vermelho bg-vermelho/15 text-vermelho'
                  : valor === undefined
                    ? 'border-dashed border-ambar bg-ambar/10 text-ambar'
                    : 'border-verde/60 bg-verde/10 text-[#b8f5d2]';
                return (
                  <button
                    key={j}
                    data-lacuna={parte}
                    aria-label={`Lacuna ${parte}${valor === undefined ? ', em branco' : `: ${rotulo(valor)}`}`}
                    onClick={() => setAberta(parte)}
                    className={`mx-0.5 rounded border px-1.5 align-baseline leading-[1.45] ${cor} ${aberta === parte ? 'ring-2 ring-azul' : ''}`}
                  >
                    {valor === undefined ? '  ?  ' : rotulo(valor)}
                  </button>
                );
              })}
            </span>
          </div>
        ))}
      </pre>

      <div className="max-h-[46%] shrink-0 overflow-y-auto border-t border-borda bg-painel p-2.5" data-testid="opcoes">
        {aberta && modelo.slots[aberta] ? (
          <>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-suave">O que cada opção faz</div>
            <div className="grid gap-1.5 lg:grid-cols-3">
              {embaralhar(chave(aberta), modelo.slots[aberta]).map((o) => {
                const escolhida = escolhas[chave(aberta)] === o.texto;
                return (
                  <button
                    key={o.texto}
                    data-opcao={o.texto}
                    onClick={() => escolher(aberta, o.texto)}
                    className={`rounded-md border p-2 text-left hover:border-verde/70 hover:bg-realce ${escolhida ? 'border-verde bg-verde/10' : 'border-borda bg-painel2'}`}
                  >
                    <code className="block overflow-x-auto whitespace-pre font-mono text-[12.5px] font-semibold text-[#b8f5d2]">{rotulo(o.texto)}</code>
                    <span className="mt-1 block text-[12px] leading-snug text-suave">{o.explica}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="px-1 py-2 text-[12.5px] text-suave">
            {preenchidas === ids.length ? (
              <>
                Todas as lacunas preenchidas. Clique em <span className="font-semibold text-verde">✓ Rodar testes</span> para executar o código de verdade.
              </>
            ) : (
              'Selecione uma lacuna no código acima.'
            )}
          </p>
        )}
      </div>
    </div>
  );
}
