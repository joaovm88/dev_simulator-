'use client';

import { questPorId } from '@/game/quests';
import { caixaDeEntrada, estrelas, useJogo } from '@/game/state/store';
import { COR_NIVEL } from './ui';

const Estrelas = ({ n }: { n: number }) => (
  <span className="tracking-tight text-ambar" aria-label={`${n} de 3 estrelas`}>
    {'★'.repeat(n)}
    <span className="text-borda">{'★'.repeat(3 - n)}</span>
  </span>
);

export function Inbox() {
  const progresso = useJogo((s) => s.progresso);
  const lidos = useJogo((s) => s.lidos);
  const emailAberto = useJogo((s) => s.emailAberto);
  const abrirEmail = useJogo((s) => s.abrirEmail);
  const emails = caixaDeEntrada({ progresso });

  return (
    <div>
      <h2 className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-suave">Caixa de entrada</h2>
      <ul>
        {emails.map((e) => {
          const quest = questPorId(e.questId);
          const p = quest && progresso[quest._id];
          const naoLido = !lidos.includes(e.id) && !p;
          return (
            <li key={e.id}>
              <button
                onClick={() => abrirEmail(e.id)}
                className={`block w-full border-l-2 px-3 py-2 text-left hover:bg-painel2 ${emailAberto === e.id ? 'border-verde bg-painel2' : 'border-transparent'}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-suave">
                  {naoLido && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-verde" aria-label="não lido" />}
                  <span className="truncate">{e.remetente.split(' (')[0]}</span>
                </div>
                <div className={`mt-0.5 line-clamp-2 text-[12px] leading-snug ${naoLido ? 'font-semibold text-white' : 'text-texto'}`}>{e.assunto}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  {quest && <span className={`rounded border px-1 font-mono ${COR_NIVEL[quest.nivelCarreira].texto} ${COR_NIVEL[quest.nivelCarreira].borda}`}>{quest.codigo}</span>}
                  {quest?.boss && <span className="rounded border border-ambar/40 px-1 text-ambar">BOSS</span>}
                  {e.tipo === 'promocao' && <span className="rounded border border-azul/40 px-1 text-azul">RH</span>}
                  {p?.concluida ? <Estrelas n={estrelas(p)} /> : p ? <span className="text-azul">em andamento</span> : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EmailView() {
  const progresso = useJogo((s) => s.progresso);
  const emailAberto = useJogo((s) => s.emailAberto);
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const aceitarMissao = useJogo((s) => s.aceitarMissao);
  const email = caixaDeEntrada({ progresso }).find((e) => e.id === emailAberto);
  if (!email) return null;
  const quest = questPorId(email.questId);
  const p = quest && progresso[quest._id];

  return (
    <article className="h-full overflow-y-auto bg-fundo">
      <div className="mx-auto max-w-2xl px-8 py-7">
        <h1 className="text-[19px] font-semibold leading-snug text-white">{email.assunto}</h1>
        <div className="mt-3 flex items-center gap-3 border-b border-borda pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-realce font-mono text-[13px] font-bold uppercase text-verde">{email.remetente[0]}</div>
          <div className="text-[12px]">
            <div className="text-texto">{email.remetente}</div>
            <div className="text-suave">para: voce@nexustech.dev</div>
          </div>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-texto">{email.corpo}</div>

        {quest && (
          <div className="mt-7 rounded-lg border border-borda bg-painel p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`font-mono text-[11px] font-semibold ${COR_NIVEL[quest.nivelCarreira].texto}`}>
                  MISSÃO {quest.codigo} {quest.boss && '· BOSS CHALLENGE'}
                </div>
                <div className="mt-0.5 text-[14px] font-semibold text-white">{quest.titulo}</div>
              </div>
              <div className="shrink-0 text-right font-mono text-[12px]">
                <div className="text-verde">+{quest.recompensaXP} XP</div>
                {p?.concluida && <Estrelas n={estrelas(p)} />}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quest.conceitos.map((c) => (
                <span key={c} className="rounded bg-realce px-2 py-0.5 text-[11px] text-suave">
                  {c}
                </span>
              ))}
            </div>
            <button
              onClick={() => aceitarMissao(quest._id)}
              className="mt-4 rounded-md bg-verde px-4 py-2 text-[13px] font-semibold text-black hover:brightness-110"
            >
              {p?.concluida ? 'Revisitar o projeto' : p ? (questAtivaId === quest._id ? 'Voltar para a IDE' : 'Continuar missão') : 'Aceitar missão e abrir a IDE'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
