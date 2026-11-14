'use client';

import { useEffect, useRef, useState } from 'react';
import { useJogo } from '@/game/state/store';
import { analisarDockerfile } from '@/game/sim/docker';

function Camadas({ dockerfile }: { dockerfile: string }) {
  const a = analisarDockerfile(dockerfile);
  const maior = Math.max(...a.camadas.map((c) => c.tamanhoMB), 1);
  return (
    <div data-testid="camadas">
      <div className="mb-2 grid grid-cols-3 gap-2">
        {[
          ['Tamanho da imagem', a.tamanhoMB >= 1000 ? `${(a.tamanhoMB / 1000).toFixed(2)} GB` : `${Math.round(a.tamanhoMB)} MB`, a.tamanhoMB < 400],
          ['Primeiro build', `${Math.round(a.buildSegundos)} s`, null],
          ['Rebuild após mudar o código', `${Math.round(a.rebuildSegundos * 10) / 10} s`, a.rebuildSegundos < 10],
        ].map(([rotulo, valor, bom]) => (
          <div key={rotulo as string} className="rounded-md border border-borda bg-painel2 px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-suave">{rotulo}</div>
            <div className={`font-mono text-[16px] font-semibold tabular-nums ${bom === null ? 'text-texto' : bom ? 'text-verde' : 'text-vermelho'}`}>{valor}</div>
          </div>
        ))}
      </div>
      <div className="mb-1 flex justify-between text-[10.5px] text-suave">
        <span>Camadas da imagem (da base para o topo)</span>
        <span>
          <span className="text-verde">■</span> vem do cache no rebuild · <span className="text-ambar">■</span> refeita a cada mudança de código
        </span>
      </div>
      <ol className="space-y-1">
        {a.camadas.map((c, i) => (
          <li key={i} className={`relative overflow-hidden rounded border px-2 py-1 ${c.alerta ? 'border-vermelho/50' : 'border-borda'}`}>
            <div className={`absolute inset-y-0 left-0 ${c.cache ? 'bg-verde/15' : 'bg-ambar/20'}`} style={{ width: `${Math.max(2, (c.tamanhoMB / maior) * 100)}%` }} />
            <div className="relative flex items-center justify-between gap-3 font-mono text-[11.5px]">
              <span className="truncate text-texto">{c.instrucao}</span>
              <span className="shrink-0 tabular-nums text-suave">
                {c.tamanhoMB >= 1 ? `${Math.round(c.tamanhoMB)} MB` : '~0 MB'} · {c.cache ? <span className="text-verde">cache</span> : <span className="text-ambar">{c.segundos}s</span>}
              </span>
            </div>
            {c.alerta && <div className="relative text-[11px] text-vermelho">⚠ {c.alerta}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Cluster({ replicas, aplicado }: { replicas: number; aplicado: boolean }) {
  const [mortos, setMortos] = useState<Record<number, boolean>>({});
  const [reinicios, setReinicios] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!aplicado) {
    return (
      <p className="text-[12px] leading-relaxed text-suave">
        Nenhum Deployment aplicado no cluster. Depois de completar o manifesto, rode <code className="inline">kubectl apply -f k8s/deployment.yaml</code>.
      </p>
    );
  }
  const derrubar = (i: number) => {
    if (mortos[i]) return;
    setMortos((m) => ({ ...m, [i]: true }));
    timers.current.push(
      setTimeout(() => {
        setMortos((m) => ({ ...m, [i]: false }));
        setReinicios((n) => n + 1);
      }, 1800),
    );
  };
  const vivos = Array.from({ length: replicas }, (_, i) => i).filter((i) => !mortos[i]).length;
  return (
    <div data-testid="cluster">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="text-texto">
          deployment/<span className="font-mono">pedidos</span> · desejado <span className="font-mono text-verde">{replicas}</span> · no ar{' '}
          <span className={`font-mono ${vivos === replicas ? 'text-verde' : 'text-ambar'}`}>{vivos}</span>
        </span>
        <span className="text-suave">pods recriados pelo Kubernetes: <span className="font-mono text-texto">{reinicios}</span></span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: replicas }, (_, i) => (
          <button
            key={i}
            onClick={() => derrubar(i)}
            title="Clique para derrubar este pod"
            className={`w-32 rounded-md border p-2 text-left transition-colors ${mortos[i] ? 'border-vermelho/60 bg-vermelho/15' : 'border-verde/50 bg-verde/10 hover:border-vermelho/60'}`}
          >
            <div className="font-mono text-[11.5px] text-texto">pedidos-{(i + 10).toString(36)}x{i}</div>
            <div className={`text-[11px] ${mortos[i] ? 'text-vermelho' : 'text-verde'}`}>{mortos[i] ? 'Terminating → recriando…' : 'Running · 1/1'}</div>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-suave">Clique em um pod para derrubá-lo. O Deployment é declarativo: o Kubernetes sempre volta ao número desejado de réplicas.</p>
    </div>
  );
}

export function InfraPanel() {
  const arquivos = useJogo((s) => (s.questAtivaId ? s.arquivos[s.questAtivaId] : undefined));
  const shell = useJogo((s) => (s.questAtivaId ? s.shell[s.questAtivaId] : undefined));
  const dockerfile = arquivos?.['Dockerfile'];
  const manifesto = arquivos && Object.entries(arquivos).find(([c, v]) => /\.ya?ml$/.test(c) && /kind:\s*Deployment/.test(v))?.[1];

  if (dockerfile === undefined && !manifesto) {
    return (
      <p className="p-4 text-[12.5px] leading-relaxed text-suave">
        Este projeto ainda não tem <code className="inline">Dockerfile</code> nem manifesto do Kubernetes. Nas missões de conteinerização, este painel mostra as camadas da imagem (tamanho e cache) e os pods do cluster.
      </p>
    );
  }
  const replicas = Number(manifesto?.match(/^\s*replicas:\s*(\d+)/m)?.[1] ?? 1);
  return (
    <div className="grid h-full grid-cols-2 gap-3 overflow-auto p-2.5">
      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-texto">Docker · imagem</h3>
        {dockerfile !== undefined ? <Camadas dockerfile={dockerfile} /> : <p className="text-[12px] text-suave">Sem Dockerfile.</p>}
        {shell && shell.docker.imagens.length > 0 && <p className="mt-2 font-mono text-[11px] text-suave">imagens locais: {shell.docker.imagens.join(', ')}</p>}
      </section>
      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-texto">Kubernetes · cluster</h3>
        {manifesto ? <Cluster replicas={replicas} aplicado={!!shell?.k8s.some((r) => r.startsWith('deployment/'))} /> : <p className="text-[12px] text-suave">Sem manifesto de Deployment.</p>}
      </section>
    </div>
  );
}
