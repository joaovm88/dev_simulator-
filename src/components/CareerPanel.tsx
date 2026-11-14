'use client';

import { questsDoNivel } from '@/game/quests';
import { conquistas } from '@/game/conquistas';
import { NIVEIS, ROTULO_NIVEL } from '@/game/types';
import { estrelas, questLiberada, useJogo, xpTotal } from '@/game/state/store';
import { COR_NIVEL } from './ui';

/** Mapa da trilha, estrelas e conquistas. */
export function CareerPanel() {
  const progresso = useJogo((s) => s.progresso);
  const abrirEmail = useJogo((s) => s.abrirEmail);
  const lista = conquistas(progresso);
  const obtidas = lista.filter((c) => c.obtida).length;
  const bonus = Object.values(progresso).reduce((t, p) => t + (p?.bonusXP ?? 0), 0);

  return (
    <div className="pb-4">
      <h2 className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-suave">Carreira</h2>
      <div className="mx-3 mb-3 rounded-md border border-borda bg-painel2 px-3 py-2">
        <div className="font-mono text-[18px] font-semibold text-verde">{xpTotal({ progresso })} XP</div>
        <div className="text-[11px] text-suave">{bonus > 0 ? `inclui ${bonus} XP de bônus por escrever do zero` : 'Escreva código do zero para ganhar XP de bônus'}</div>
      </div>

      {NIVEIS.map((nivel) => (
        <section key={nivel} className="mb-3">
          <h3 className={`px-3 pb-1 text-[11px] font-semibold ${COR_NIVEL[nivel].texto}`}>{ROTULO_NIVEL[nivel]}</h3>
          <ol>
            {questsDoNivel(nivel).map((q) => {
              const p = progresso[q._id];
              const liberada = questLiberada({ progresso }, q);
              const n = estrelas(p);
              return (
                <li key={q._id}>
                  <button disabled={!liberada} onClick={() => abrirEmail(q._id)} className="flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-painel2 disabled:opacity-45">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${p?.concluida ? 'border-verde bg-verde/20 text-verde' : liberada ? `${COR_NIVEL[nivel].borda} ${COR_NIVEL[nivel].texto}` : 'border-borda text-suave'}`}>
                      {p?.concluida ? '✓' : liberada ? '●' : '🔒'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-texto">
                        <span className="font-mono text-suave">{q.codigo}</span> {q.titulo}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-ambar">
                      {q.boss && !p?.concluida ? <span className="text-[9px] text-ambar">BOSS</span> : '★'.repeat(n)}
                      <span className="text-borda">{p?.concluida ? '★'.repeat(3 - n) : ''}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <h3 className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-suave">
        Conquistas · {obtidas}/{lista.length}
      </h3>
      <ul className="space-y-1 px-3" data-testid="conquistas">
        {lista.map((c) => (
          <li key={c.id} className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${c.obtida ? 'border-ambar/40 bg-ambar/10' : 'border-borda opacity-55'}`}>
            <span className={`text-[15px] leading-none ${c.obtida ? '' : 'grayscale'}`} aria-hidden>
              {c.icone}
            </span>
            <span>
              <span className="block text-[12px] font-semibold text-texto">{c.titulo}</span>
              <span className="block text-[11px] leading-snug text-suave">{c.descricao}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
