'use client';

import { useState } from 'react';
import { questPorId } from '@/game/quests';
import { useJogo } from '@/game/state/store';

interface No {
  nome: string;
  caminho: string;
  filhos: No[];
  arquivo: boolean;
}

function montarArvore(caminhos: string[]): No[] {
  const raiz: No = { nome: '', caminho: '', filhos: [], arquivo: false };
  for (const caminho of caminhos) {
    let atual = raiz;
    const partes = caminho.split('/');
    partes.forEach((nome, i) => {
      const parcial = partes.slice(0, i + 1).join('/');
      let filho = atual.filhos.find((f) => f.nome === nome);
      if (!filho) atual.filhos.push((filho = { nome, caminho: parcial, filhos: [], arquivo: i === partes.length - 1 }));
      atual = filho;
    });
  }
  const ordenar = (n: No) => {
    n.filhos.sort((a, b) => Number(a.arquivo) - Number(b.arquivo) || a.nome.localeCompare(b.nome));
    n.filhos.forEach(ordenar);
  };
  ordenar(raiz);
  return raiz.filhos;
}

const COR_EXT: Record<string, string> = { py: 'text-azul', sql: 'text-ambar', java: 'text-vermelho', ts: 'text-azul', tsx: 'text-azul', js: 'text-ambar', json: 'text-ambar', yaml: 'text-vermelho', md: 'text-suave' };

export function Explorer() {
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const arquivos = useJogo((s) => (s.questAtivaId ? s.arquivos[s.questAtivaId] : undefined));
  const arquivoAtivo = useJogo((s) => s.arquivoAtivo);
  const emailAberto = useJogo((s) => s.emailAberto);
  const abrirArquivo = useJogo((s) => s.abrirArquivo);
  const criarArquivo = useJogo((s) => s.criarArquivo);
  const apagarArquivo = useJogo((s) => s.apagarArquivo);
  const [novo, setNovo] = useState<string | null>(null);
  const quest = questPorId(questAtivaId);

  if (!quest || !arquivos) {
    return <p className="px-3 py-4 text-[12px] leading-relaxed text-suave">Nenhum projeto aberto. Aceite uma missão na caixa de entrada para montar o workspace.</p>;
  }
  const originais = new Set(quest.arquivosIniciaisIDE.map((a) => a.caminho));

  const linha = (no: No, nivel: number): React.ReactNode => {
    const recuo = { paddingLeft: 12 + nivel * 12 };
    if (!no.arquivo) {
      return (
        <li key={no.caminho}>
          <div style={recuo} className="flex items-center gap-1 py-0.5 text-[12px] text-suave">
            <span className="text-[9px]">▾</span>
            {no.nome}
          </div>
          <ul>{no.filhos.map((f) => linha(f, nivel + 1))}</ul>
        </li>
      );
    }
    const ativo = !emailAberto && arquivoAtivo === no.caminho;
    return (
      <li key={no.caminho} className={`group flex items-center ${ativo ? 'bg-realce text-white' : 'text-texto hover:bg-painel2'}`}>
        <button style={recuo} onClick={() => abrirArquivo(no.caminho)} className="min-w-0 flex-1 truncate py-0.5 text-left font-mono text-[12px]">
          <span aria-hidden className={`mr-1.5 ${COR_EXT[no.nome.split('.').pop() ?? ''] ?? 'text-suave'}`}>●</span>
          {no.nome}
        </button>
        {!originais.has(no.caminho) && (
          <button aria-label={`Apagar ${no.caminho}`} title="Apagar arquivo" onClick={() => apagarArquivo(no.caminho)} className="px-2 text-suave opacity-0 hover:text-vermelho group-hover:opacity-100 focus:opacity-100">
            ×
          </button>
        )}
      </li>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-suave">Explorer · {quest.codigo}</h2>
        <button aria-label="Novo arquivo" title="Novo arquivo" onClick={() => setNovo('')} className="rounded px-1.5 text-[15px] leading-none text-suave hover:bg-realce hover:text-white">
          +
        </button>
      </div>
      {novo !== null && (
        <form
          className="px-3 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            criarArquivo(novo);
            setNovo(null);
          }}
        >
          <input
            autoFocus
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onBlur={() => setNovo(null)}
            onKeyDown={(e) => e.key === 'Escape' && setNovo(null)}
            placeholder="ex.: .gitignore"
            aria-label="Nome do novo arquivo"
            className="w-full rounded border border-verde/50 bg-fundo px-2 py-1 font-mono text-[12px] text-white outline-none"
          />
        </form>
      )}
      <ul>{montarArvore(Object.keys(arquivos)).map((n) => linha(n, 0))}</ul>
    </div>
  );
}
