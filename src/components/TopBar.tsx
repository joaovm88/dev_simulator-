'use client';

import { useState } from 'react';
import { QUESTS, XP_TOTAL, questPorId } from '@/game/quests';
import { ROTULO_NIVEL } from '@/game/types';
import { nivelAtual, trilhaConcluida, useJogo, xpTotal } from '@/game/state/store';
import { COR_NIVEL } from './ui';

export function TopBar() {
  const progresso = useJogo((s) => s.progresso);
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const reiniciarMissao = useJogo((s) => s.reiniciarMissao);
  const reiniciarJogo = useJogo((s) => s.reiniciarJogo);
  const [menu, setMenu] = useState(false);

  const nivel = nivelAtual({ progresso });
  const xp = xpTotal({ progresso });
  const fim = trilhaConcluida({ progresso });
  const quest = questPorId(questAtivaId);
  const p = quest ? progresso[quest._id] : undefined;
  const cor = COR_NIVEL[nivel];
  const feitas = QUESTS.filter((q) => progresso[q._id]?.concluida).length;

  return (
    <header className="flex h-11 shrink-0 items-center gap-4 border-b border-borda bg-painel px-3">
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-[15px] font-bold text-verde">dev_OS</span>
        <span className="text-[11px] text-suave">NexusTech Solutions</span>
      </div>

      <div className="min-w-0 flex-1 truncate text-center text-[12px] text-suave">
        {quest && p ? (
          <>
            <span className={`font-mono font-semibold ${COR_NIVEL[quest.nivelCarreira].texto}`}>{quest.codigo}</span>
            <span className="mx-2 text-texto">{quest.titulo}</span>
            <span>{p.concluida ? '· concluída' : `· etapa ${p.etapa + 1} de ${quest.etapas.length}`}</span>
          </>
        ) : (
          'Abra a caixa de entrada para receber sua próxima demanda'
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${cor.texto} ${cor.fundo} ${cor.borda}`} data-testid="nivel">
          {fim ? 'Trilha concluída' : ROTULO_NIVEL[nivel]}
        </span>
        <div className="flex items-center gap-2" title={`${feitas} de ${QUESTS.length} missões concluídas`}>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-realce" role="progressbar" aria-valuenow={xp} aria-valuemin={0} aria-valuemax={XP_TOTAL} aria-label="Experiência">
            <div className="h-full rounded-full bg-verde transition-all duration-500" style={{ width: `${(xp / XP_TOTAL) * 100}%` }} />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-suave" data-testid="xp">
            {xp} XP
          </span>
        </div>
        <div className="relative">
          <button aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)} className="rounded px-1.5 py-0.5 text-suave hover:bg-realce hover:text-texto">
            ⋯
          </button>
          {menu && (
            <div className="absolute right-0 top-8 z-30 w-56 rounded-md border border-borda bg-painel2 py-1 shadow-xl" onMouseLeave={() => setMenu(false)}>
              <button
                disabled={!quest}
                className="block w-full px-3 py-1.5 text-left hover:bg-realce disabled:opacity-40"
                onClick={() => {
                  setMenu(false);
                  if (quest && confirm(`Restaurar os arquivos de "${quest.titulo}" ao estado inicial?`)) reiniciarMissao(quest._id);
                }}
              >
                Reiniciar missão atual
              </button>
              <button
                className="block w-full px-3 py-1.5 text-left text-vermelho hover:bg-realce"
                onClick={() => {
                  setMenu(false);
                  if (confirm('Apagar TODO o progresso e recomeçar do primeiro dia na NexusTech?')) reiniciarJogo();
                }}
              >
                Apagar progresso e recomeçar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
