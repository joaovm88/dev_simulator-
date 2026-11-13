'use client';

import { QUESTS, questPorId } from '@/game/quests';
import { ROTULO_NIVEL } from '@/game/types';
import { estrelas, useJogo } from '@/game/state/store';
import { COR_NIVEL } from './ui';

export function Celebracao() {
  const celebracao = useJogo((s) => s.celebracao);
  const progresso = useJogo((s) => s.progresso);
  const fechar = useJogo((s) => s.fecharCelebracao);
  const abrirEmail = useJogo((s) => s.abrirEmail);
  const quest = questPorId(celebracao?.questId);
  if (!celebracao || !quest) return null;

  const n = estrelas(progresso[quest._id]);
  const { promocao } = celebracao;
  const proximoEmail = () => {
    fechar();
    // Promoção: abre o e-mail do RH. Caso contrário, a próxima demanda da trilha.
    const seguinte = QUESTS[QUESTS.indexOf(quest) + 1];
    const id = promocao ? `promocao_${quest.nivelCarreira}` : seguinte?._id;
    if (id) abrirEmail(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" role="dialog" aria-modal="true" aria-labelledby="celebracao-titulo">
      <div className="surgir w-full max-w-md rounded-xl border border-borda bg-painel p-7 text-center shadow-2xl">
        <div className={`font-mono text-[11px] font-semibold tracking-widest ${COR_NIVEL[quest.nivelCarreira].texto}`}>
          {quest.codigo} · {quest.boss ? 'BOSS CHALLENGE CONCLUÍDO' : 'MISSÃO CONCLUÍDA'}
        </div>
        <h2 id="celebracao-titulo" className="mt-2 text-[20px] font-semibold text-white">
          {quest.titulo}
        </h2>
        <div className="mt-3 text-[30px] leading-none tracking-wider text-ambar" aria-label={`${n} de 3 estrelas`}>
          {'★'.repeat(n)}
          <span className="text-borda">{'★'.repeat(3 - n)}</span>
        </div>
        <div className="mt-3 font-mono text-[15px] font-semibold text-verde">+{quest.recompensaXP} XP</div>

        {promocao && (
          <div className="mt-5 rounded-lg border border-ambar/40 bg-ambar/10 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-ambar">{promocao === 'FIM' ? 'Trilha concluída' : 'Promoção'}</div>
            <div className="mt-1 text-[16px] font-semibold text-white">
              {promocao === 'FIM' ? 'Você completou a carreira na NexusTech!' : `Agora você é ${ROTULO_NIVEL[promocao]}`}
            </div>
          </div>
        )}

        <p className="mt-4 text-[12px] text-suave">
          {n === 3 ? 'Execução impecável: nenhuma decisão errada e nenhuma dica.' : 'Estrelas são perdidas com decisões erradas e dicas usadas.'}
        </p>
        <button autoFocus onClick={proximoEmail} className="mt-5 w-full rounded-md bg-verde px-4 py-2.5 text-[13px] font-semibold text-black hover:brightness-110">
          {promocao ? 'Ler o e-mail do RH' : 'Ver a caixa de entrada'}
        </button>
      </div>
    </div>
  );
}
