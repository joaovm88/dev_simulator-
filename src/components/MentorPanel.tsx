'use client';

import { useEffect, useRef } from 'react';
import { QUESTS, arquivoDaEtapa, questPorId } from '@/game/quests';
import { lacunasDa } from '@/game/lacunas';
import { etapaAtual, questLiberada, useJogo, type Mensagem } from '@/game/state/store';
import { comandosPendentes } from '@/game/validators';
import type { Etapa } from '@/game/types';
import { Rich } from './Rich';

const ROTULO_ETAPA: Record<Etapa['tipo'], string> = {
  DECISAO_ARQUITETURAL: 'Decisão',
  COMANDO_TERMINAL: 'Terminal',
  IMPLEMENTACAO_CODIGO: 'Código',
  IMPLEMENTACAO_SQL: 'SQL',
  IMPLEMENTACAO_MONGO: 'MongoDB',
  VALIDACAO_ESTATICA: 'Code Review',
  REVISAO_CODIGO: 'Revisão',
  SIMULACAO: 'Simulação',
};

function Bolha({ m }: { m: Mensagem }) {
  if (m.de === 'sistema') {
    const cor = m.tom === 'ok' ? 'text-verde border-verde/30' : m.tom === 'erro' ? 'text-vermelho border-vermelho/30' : 'text-suave border-borda';
    return <div className={`surgir rounded border px-2.5 py-1 text-center font-mono text-[11px] ${cor}`}>{m.texto}</div>;
  }
  if (m.de === 'jogador') {
    return (
      <div className="surgir ml-8 rounded-lg rounded-br-sm bg-realce px-3 py-2 text-[12.5px] leading-relaxed text-texto">
        <Rich texto={m.texto} />
      </div>
    );
  }
  const borda = m.tom === 'ok' ? 'border-l-verde' : m.tom === 'erro' ? 'border-l-vermelho' : m.tom === 'info' ? 'border-l-ambar' : 'border-l-borda';
  return (
    <div className={`surgir mr-3 rounded-lg rounded-bl-sm border border-l-2 border-borda bg-painel2 px-3 py-2 text-[12.5px] leading-relaxed text-texto ${borda}`}>
      <Rich texto={m.texto} blocoDeCodigo={m.tom === 'info'} />
    </div>
  );
}

function Acoes() {
  const progresso = useJogo((s) => s.progresso);
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const validando = useJogo((s) => s.validando);
  const verEtapa = useJogo((s) => s.verEtapa && !s.emailAberto);
  const emailAberto = useJogo((s) => s.emailAberto);
  const arquivoAtivo = useJogo((s) => s.arquivoAtivo);
  const { responderDecisao, validar, pedirDica, abrirArquivo, abrirEmail, setPainelLateral, setAbaInferior, enviarRevisao, setVerEtapa } = useJogo.getState();
  const atual = etapaAtual({ progresso, questAtivaId });
  const quest = questPorId(questAtivaId);

  if (!atual) {
    const proxima = QUESTS.find((q) => questLiberada({ progresso }, q) && !progresso[q._id]?.concluida);
    return (
      <div className="border-t border-borda p-3">
        <p className="mb-2 text-[12px] leading-relaxed text-suave">
          {quest && progresso[quest._id]?.concluida
            ? 'Missão entregue. A próxima demanda está na caixa de entrada.'
            : 'Quando você aceitar uma missão, eu apareço aqui para fazermos pair programming.'}
        </p>
        {proxima && (
          <button
            onClick={() => {
              setPainelLateral('inbox');
              abrirEmail(proxima._id);
            }}
            className="w-full rounded-md bg-verde px-3 py-2 text-[12.5px] font-semibold text-black hover:brightness-110"
          >
            Abrir e-mail: {proxima.codigo}
          </button>
        )}
      </div>
    );
  }

  const { etapa, progresso: p } = atual;
  const dicas = etapa.dicas ?? [];
  const botaoDica = dicas.length > 0 && (
    <button
      onClick={pedirDica}
      disabled={p.dicas >= dicas.length}
      className="rounded-md border border-borda px-3 py-2 text-[12px] text-texto hover:bg-realce disabled:opacity-40"
      title="Usar dicas reduz as estrelas da missão"
    >
      💡 Dica ({p.dicas}/{dicas.length})
    </button>
  );

  return (
    <div className="border-t border-borda p-3" data-testid="acoes">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="font-semibold uppercase tracking-wider text-suave">
          Etapa {etapa.ordem}/{atual.quest.etapas.length} · {ROTULO_ETAPA[etapa.tipo]}
        </span>
        <span className="truncate pl-2 text-texto">{etapa.titulo}</span>
      </div>

      {etapa.tipo === 'DECISAO_ARQUITETURAL' && (
        <div className="space-y-1.5">
          {etapa.opcoes.map((o, i) => {
            const errada = p.tentadas.includes(o.id);
            return (
              <button
                key={o.id}
                disabled={errada}
                onClick={() => responderDecisao(o.id)}
                className={`flex w-full gap-2 rounded-md border px-3 py-2 text-left text-[12.5px] leading-snug ${
                  errada ? 'border-vermelho/30 text-suave line-through opacity-60' : 'border-borda bg-painel2 text-texto hover:border-verde/60 hover:bg-realce'
                }`}
              >
                <span className="font-mono font-semibold text-verde">{String.fromCharCode(65 + i)}</span>
                <span>{o.texto}</span>
              </button>
            );
          })}
        </div>
      )}

      {etapa.tipo === 'COMANDO_TERMINAL' && (
        <>
          <ul className="mb-2 space-y-1">
            {etapa.comandos.map((c) => {
              const feito = !comandosPendentes(etapa, p.comandos).includes(c);
              return (
                <li key={c.padrao} className="flex items-center gap-2 font-mono text-[12px]">
                  <span className={feito ? 'text-verde' : 'text-borda'}>{feito ? '✓' : '○'}</span>
                  <span className={feito ? 'text-suave line-through' : 'text-texto'}>{c.descricao}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <button onClick={() => setAbaInferior('terminal')} className="flex-1 rounded-md border border-verde/50 px-3 py-2 text-[12.5px] font-semibold text-verde hover:bg-verde/10">
              Ir para o terminal
            </button>
            {botaoDica}
          </div>
        </>
      )}

      {etapa.tipo === 'REVISAO_CODIGO' && (
        <div className="flex gap-2">
          <button
            onClick={() => (verEtapa ? enviarRevisao() : setVerEtapa(true))}
            className="flex-1 rounded-md bg-verde px-3 py-2 text-[12.5px] font-semibold text-black hover:brightness-110"
          >
            {verEtapa ? `Enviar revisão (${p.marcadas.length} marcada${p.marcadas.length === 1 ? '' : 's'})` : 'Abrir o code review'}
          </button>
          {botaoDica}
        </div>
      )}

      {etapa.tipo === 'SIMULACAO' && (
        <div className="flex gap-2">
          <button onClick={() => setVerEtapa(true)} className="flex-1 rounded-md border border-vermelho/50 px-3 py-2 text-[12.5px] font-semibold text-vermelho hover:bg-vermelho/10">
            Abrir a Sala de Guerra
          </button>
          {botaoDica}
        </div>
      )}

      {(etapa.tipo === 'IMPLEMENTACAO_CODIGO' || etapa.tipo === 'IMPLEMENTACAO_SQL' || etapa.tipo === 'IMPLEMENTACAO_MONGO' || etapa.tipo === 'VALIDACAO_ESTATICA') && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              const arquivo = arquivoDaEtapa(etapa);
              if (arquivo && (emailAberto || !lacunasDa(etapa).some((l) => l.arquivo === arquivoAtivo))) abrirArquivo(arquivo);
              void validar();
            }}
            disabled={validando}
            className="flex-1 rounded-md bg-verde px-3 py-2 text-[12.5px] font-semibold text-black hover:brightness-110 disabled:opacity-60"
          >
            {validando ? 'Validando…' : etapa.tipo === 'VALIDACAO_ESTATICA' ? '✓ Pedir Code Review' : '✓ Rodar testes'}
          </button>
          {botaoDica}
        </div>
      )}
    </div>
  );
}

export function MentorPanel() {
  const mensagens = useJogo((s) => (s.questAtivaId ? s.chat[s.questAtivaId] : undefined));
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' });
  }, [mensagens?.length]);

  return (
    <>
      <header className="flex shrink-0 items-center gap-2.5 border-b border-borda px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-verde/15 font-mono text-[11px] font-bold text-verde">IA</div>
        <div>
          <div className="font-mono text-[13px] font-semibold text-verde">dev_IA</div>
          <div className="text-[10.5px] text-suave">Mentora · Pair Programming</div>
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3" aria-live="polite">
        {!mensagens?.length && (
          <div className="mr-3 rounded-lg border border-borda bg-painel2 px-3 py-2 text-[12.5px] leading-relaxed text-texto">
            Olá! Eu sou a <span className="font-mono text-verde">dev_IA</span>. Antes de cada decisão de arquitetura ou linha de código, vou te mostrar as alternativas, explicar os trade-offs e revisar o que você escrever.
            <br />
            <br />
            Comece lendo os e-mails na caixa de entrada, à esquerda.
          </div>
        )}
        {mensagens?.map((m) => <Bolha key={m.id} m={m} />)}
        <div ref={fim} />
      </div>
      <Acoes />
    </>
  );
}
