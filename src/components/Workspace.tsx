'use client';

import { useEffect } from 'react';
import { caixaDeEntrada, etapaAtual, useJogo, type PainelLateral } from '@/game/state/store';
import { ReviewPane } from './ReviewPane';
import { SimPane } from './SimPane';
import { GitPanel } from './GitPanel';
import { InfraPanel } from './InfraPanel';
import { CareerPanel } from './CareerPanel';
import { aquecerPython } from '@/game/runtime/pythonBrowser';
import { TopBar } from './TopBar';
import { Inbox, EmailView } from './Mail';
import { Explorer } from './Explorer';
import { EditorPane } from './EditorPane';
import { TerminalPane } from './TerminalPane';
import { TestResults } from './TestResults';
import { DataInspector } from './DataInspector';
import { MentorPanel } from './MentorPanel';
import { Celebracao } from './Celebracao';
import type { AbaInferior } from '@/game/state/store';

const ABAS: { id: AbaInferior; rotulo: string }[] = [
  { id: 'terminal', rotulo: 'Terminal' },
  { id: 'testes', rotulo: 'Testes' },
  { id: 'dados', rotulo: 'Data Inspector' },
  { id: 'git', rotulo: 'Git' },
  { id: 'infra', rotulo: 'Contêineres' },
];

function BarraDeAtividades() {
  const painel = useJogo((s) => s.painelLateral);
  const setPainel = useJogo((s) => s.setPainelLateral);
  const progresso = useJogo((s) => s.progresso);
  const lidos = useJogo((s) => s.lidos);
  const naoLidos = caixaDeEntrada({ progresso }).filter((e) => !lidos.includes(e.id) && !(e.questId && progresso[e.questId])).length;
  const item = (id: PainelLateral, titulo: string, icone: React.ReactNode) => (
    <button
      title={titulo}
      aria-label={titulo}
      aria-pressed={painel === id}
      onClick={() => setPainel(id)}
      className={`relative flex h-11 w-full items-center justify-center border-l-2 ${painel === id ? 'border-verde text-white' : 'border-transparent text-suave hover:text-texto'}`}
    >
      {icone}
      {id === 'inbox' && naoLidos > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-verde" />}
    </button>
  );
  return (
    <nav className="flex w-11 shrink-0 flex-col border-r border-borda bg-painel" aria-label="Módulos">
      {item(
        'inbox',
        'MailClient — Caixa de entrada',
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
      )}
      {item(
        'explorer',
        'Explorer — Arquivos do projeto',
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h6l2 3h8v13H4z" /></svg>,
      )}
      {item(
        'carreira',
        'Carreira — trilha e conquistas',
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8" /></svg>,
      )}
    </nav>
  );
}

export default function Workspace() {
  const painel = useJogo((s) => s.painelLateral);
  const emailAberto = useJogo((s) => s.emailAberto);
  const abaInferior = useJogo((s) => s.abaInferior);
  const setAbaInferior = useJogo((s) => s.setAbaInferior);
  const falhas = useJogo((s) => s.resultado?.testes.filter((t) => !t.ok).length ?? 0);
  const atividade = useJogo((s) => (s.verEtapa ? (etapaAtual(s)?.etapa.tipo ?? null) : null));

  useEffect(() => {
    // Sobe o Pyodide em segundo plano para o primeiro "Rodar testes" ser rápido.
    aquecerPython().catch(() => undefined);
  }, []);

  return (
    <div className="flex h-screen min-w-[1100px] flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <BarraDeAtividades />
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-borda bg-painel">{painel === 'inbox' ? <Inbox /> : painel === 'carreira' ? <CareerPanel /> : <Explorer />}</aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <section className="min-h-0 flex-1">{emailAberto ? <EmailView /> : atividade === 'SIMULACAO' ? <SimPane /> : atividade === 'REVISAO_CODIGO' ? <ReviewPane /> : <EditorPane />}</section>

          <section className="flex h-[38%] min-h-[180px] flex-col border-t border-borda bg-fundo">
            <div role="tablist" className="flex shrink-0 items-center gap-1 border-b border-borda bg-painel px-2">
              {ABAS.map((a) => (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={abaInferior === a.id}
                  onClick={() => setAbaInferior(a.id)}
                  className={`border-b-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider ${abaInferior === a.id ? 'border-verde text-white' : 'border-transparent text-suave hover:text-texto'}`}
                >
                  {a.rotulo}
                  {a.id === 'testes' && falhas > 0 && <span className="ml-1.5 rounded-full bg-vermelho/20 px-1.5 text-vermelho">{falhas}</span>}
                </button>
              ))}
            </div>
            <div className="relative min-h-0 flex-1">
              {/* O terminal fica sempre montado para preservar o histórico. */}
              <div className={`absolute inset-0 ${abaInferior === 'terminal' ? '' : 'invisible'}`}>
                <TerminalPane visivel={abaInferior === 'terminal'} />
              </div>
              {abaInferior === 'testes' && <div className="absolute inset-0 overflow-auto"><TestResults /></div>}
              {abaInferior === 'dados' && <div className="absolute inset-0"><DataInspector /></div>}
              {abaInferior === 'git' && <div className="absolute inset-0"><GitPanel /></div>}
              {abaInferior === 'infra' && <div className="absolute inset-0"><InfraPanel /></div>}
            </div>
          </section>
        </main>

        <aside className="flex w-[370px] shrink-0 flex-col border-l border-borda bg-painel">
          <MentorPanel />
        </aside>
      </div>
      <Celebracao />
    </div>
  );
}
