'use client';

import { useEffect, useRef, useState } from 'react';
import { etapaAtual, useJogo } from '@/game/state/store';
import {
  INSTANCIAS,
  META_DISPONIBILIDADE,
  META_RETENTADAS,
  TICKS,
  TICK_DA_QUEDA,
  simularBalanceador,
  type ConfigBalanceador,
  type ResultadoBalanceador,
} from '@/game/sim/balanceador';
import { CAPACIDADE, HORA_DA_FALHA, META, ORCAMENTO, PRECO_HORA, TRAFEGO, simularBlackFriday, type ConfigBlackFriday, type ResultadoBlackFriday } from '@/game/sim/blackfriday';

/** Avança um contador de 0 a `total` enquanto `rodando` for verdadeiro. */
function useRelogio(total: number, intervaloMs: number) {
  const [passo, setPasso] = useState(-1);
  const [rodando, setRodando] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);
  const iniciar = (aoTerminar: () => void) => {
    if (timer.current) clearInterval(timer.current);
    setPasso(0);
    setRodando(true);
    let atual = 0;
    timer.current = setInterval(() => {
      atual++;
      if (atual >= total) {
        clearInterval(timer.current!);
        timer.current = null;
        setRodando(false);
        setPasso(total - 1);
        aoTerminar();
      } else setPasso(atual);
    }, intervaloMs);
  };
  return { passo, rodando, iniciar };
}

function Medidor({ rotulo, valor, bom, meta }: { rotulo: string; valor: string; bom: boolean | null; meta: string }) {
  return (
    <div className="rounded-md border border-borda bg-painel2 px-3 py-2">
      <div className="text-[10.5px] uppercase tracking-wider text-suave">{rotulo}</div>
      <div className={`font-mono text-[20px] font-semibold tabular-nums ${bom === null ? 'text-texto' : bom ? 'text-verde' : 'text-vermelho'}`}>{valor}</div>
      <div className="text-[11px] text-suave">{meta}</div>
    </div>
  );
}

function Veredito({ aprovado, texto, aoContinuar }: { aprovado: boolean; texto: string; aoContinuar: () => void }) {
  return (
    <div className={`surgir rounded-md border p-3 ${aprovado ? 'border-verde/50 bg-verde/10' : 'border-vermelho/40 bg-vermelho/10'}`} data-testid="veredito">
      <div className={`text-[12px] font-semibold uppercase tracking-wider ${aprovado ? 'text-verde' : 'text-vermelho'}`}>{aprovado ? 'Meta atingida' : 'Meta não atingida'}</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-texto">{texto}</p>
      {aprovado ? (
        <button onClick={aoContinuar} className="mt-2.5 rounded bg-verde px-3 py-1.5 text-[12.5px] font-semibold text-black hover:brightness-110">
          Aprovar e continuar
        </button>
      ) : (
        <p className="mt-1.5 text-[12px] text-suave">Ajuste a configuração e rode de novo.</p>
      )}
    </div>
  );
}

const Chave = ({ ligado, aoMudar, titulo, descricao, desabilitado }: { ligado: boolean; aoMudar: (v: boolean) => void; titulo: string; descricao: string; desabilitado: boolean }) => (
  <label className={`flex cursor-pointer items-start gap-2.5 rounded-md border border-borda bg-painel2 p-2.5 ${desabilitado ? 'opacity-60' : 'hover:border-verde/50'}`}>
    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#3ddc84]" checked={ligado} disabled={desabilitado} onChange={(e) => aoMudar(e.target.checked)} />
    <span>
      <span className="block text-[12.5px] font-semibold text-texto">{titulo}</span>
      <span className="block text-[11.5px] leading-snug text-suave">{descricao}</span>
    </span>
  </label>
);

// ---------------------------------------------------------------- Balanceador

function Balanceador({ relatar }: { relatar: (ok: boolean, resumo: string, diag: string) => void }) {
  const [cfg, setCfg] = useState<ConfigBalanceador>({ roteamento: 'fixo', heartbeat: false, retry: false });
  const [res, setRes] = useState<ResultadoBalanceador | null>(null);
  const { passo, rodando, iniciar } = useRelogio(TICKS, 170);
  const terminou = res !== null && !rodando && passo === TICKS - 1;

  const rodar = () => {
    const r = simularBalanceador(cfg);
    setRes(r);
    iniciar(() => {
      if (!r.aprovado) relatar(false, `Teste de carga: ${r.disponibilidade}% de disponibilidade, ${r.retentadas}% com retry`, r.diagnostico);
    });
  };

  const ate = res ? res.ticks.slice(0, passo + 1) : [];
  const reqs = ate.flatMap((t) => t.reqs);
  const falhas = reqs.filter((q) => !q.ok).length;
  const lentas = reqs.filter((q) => q.retentada && q.ok).length;
  const disp = reqs.length ? Math.round(((reqs.length - falhas) / reqs.length) * 1000) / 10 : null;
  const tick = res?.ticks[passo];
  const Y = [40, 110, 180];

  return (
    <div className="grid h-full grid-cols-[250px_1fr] gap-4 overflow-auto p-4">
      <div className="space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-suave">Configuração do gateway</div>
        <div className="rounded-md border border-borda bg-painel2 p-2.5">
          <div className="mb-1.5 text-[12.5px] font-semibold text-texto">Roteamento</div>
          {(['fixo', 'roundrobin'] as const).map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 py-0.5 text-[12px] text-texto">
              <input type="radio" name="rot" className="accent-[#3ddc84]" checked={cfg.roteamento === r} disabled={rodando} onChange={() => setCfg({ ...cfg, roteamento: r })} />
              {r === 'fixo' ? 'Endereço fixo (tudo na 58817)' : 'Round-Robin entre as instâncias'}
            </label>
          ))}
        </div>
        <Chave ligado={cfg.heartbeat} aoMudar={(v) => setCfg({ ...cfg, heartbeat: v })} desabilitado={rodando} titulo="Service Discovery + heartbeat" descricao="Instâncias que param de responder saem do registro (Eureka)." />
        <Chave ligado={cfg.retry} aoMudar={(v) => setCfg({ ...cfg, retry: v })} desabilitado={rodando} titulo="Retry em outra instância" descricao="Se a chamada falhar, o gateway reenvia para outra instância." />
        <button onClick={rodar} disabled={rodando} className="w-full rounded-md bg-verde px-3 py-2 text-[13px] font-semibold text-black hover:brightness-110 disabled:opacity-60">
          {rodando ? 'Teste em andamento…' : res ? '↻ Rodar o teste de novo' : '▶ Iniciar teste de carga'}
        </button>
      </div>

      <div className="min-w-0 space-y-3">
        <svg viewBox="0 0 620 220" className="max-h-[190px] w-full rounded-md border border-borda bg-painel" role="img" aria-label="Topologia: clientes, API Gateway e três instâncias do serviço de pedidos">
          <rect x="16" y="85" width="92" height="50" rx="8" fill="#171d26" stroke="#252e3a" />
          <text x="62" y="115" textAnchor="middle" fill="#d7dee8" fontSize="12">Clientes</text>
          <line x1="108" y1="110" x2="200" y2="110" stroke="#5aa9ff" strokeWidth="2" />
          <rect x="200" y="78" width="118" height="64" rx="8" fill="#171d26" stroke="#5aa9ff" />
          <text x="259" y="106" textAnchor="middle" fill="#d7dee8" fontSize="12" fontWeight="600">API Gateway</text>
          <text x="259" y="124" textAnchor="middle" fill="#8391a5" fontSize="10">{cfg.roteamento === 'fixo' ? 'endereço fixo' : 'round-robin'}</text>
          {INSTANCIAS.map((porta, i) => {
            const viva = tick ? tick.viva[porta] : true;
            const registrada = tick ? tick.registrada[porta] : true;
            const doTick = tick?.reqs.filter((q) => q.porta === porta) ?? [];
            const usada = cfg.roteamento === 'roundrobin' || porta === 58817;
            return (
              <g key={porta}>
                <line x1="318" y1="110" x2="452" y2={Y[i]} stroke={!usada || !registrada ? '#252e3a' : viva ? '#3ddc84' : '#ff6b6b'} strokeWidth={doTick.length ? 2.5 : 1.2} strokeDasharray={registrada ? undefined : '4 4'} />
                <rect x="452" y={Y[i] - 24} width="152" height="48" rx="8" fill={viva ? '#171d26' : '#3a1717'} stroke={viva ? '#3ddc84' : '#ff6b6b'} />
                <text x="528" y={Y[i] - 4} textAnchor="middle" fill="#d7dee8" fontSize="12" fontFamily="monospace">pedidos :{porta}</text>
                <text x="528" y={Y[i] + 13} textAnchor="middle" fill={viva ? '#8391a5' : '#ff6b6b'} fontSize="10">
                  {!viva ? (registrada ? 'FORA DO AR · no registro' : 'removida do registro') : 'saudável'}
                </text>
                {doTick.slice(0, 8).map((q, k) => (
                  <circle key={k} cx={336 + k * 13} cy={110 + ((Y[i] - 110) * (336 + k * 13 - 318)) / 134} r="4" fill={q.ok ? '#3ddc84' : '#ff6b6b'} />
                ))}
              </g>
            );
          })}
        </svg>

        <div>
          <div className="mb-1 flex justify-between text-[11px] text-suave">
            <span>Linha do tempo do teste</span>
            <span>💥 a instância 58817 cai no ciclo {TICK_DA_QUEDA + 1}</span>
          </div>
          <div className="flex gap-[3px]" data-testid="linha-do-tempo">
            {Array.from({ length: TICKS }, (_, t) => {
              const dados = t <= passo ? res?.ticks[t] : undefined;
              const cor = !dados ? 'bg-realce' : dados.reqs.some((q) => !q.ok) ? 'bg-vermelho' : dados.reqs.some((q) => q.retentada) ? 'bg-ambar' : 'bg-verde';
              return <div key={t} className={`h-5 flex-1 rounded-sm ${cor} ${t === TICK_DA_QUEDA ? 'ring-1 ring-white' : ''}`} />;
            })}
          </div>
          <div className="mt-1 flex gap-4 text-[11px] text-suave">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-verde" />tudo certo</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-ambar" />salvo por retry (lento)</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-vermelho" />requisições perdidas</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Medidor rotulo="Disponibilidade" valor={disp === null ? '—' : `${disp}%`} bom={disp === null ? null : disp >= META_DISPONIBILIDADE} meta={`meta: ≥ ${META_DISPONIBILIDADE}%`} />
          <Medidor rotulo="Requisições perdidas" valor={String(falhas)} bom={reqs.length ? falhas === 0 : null} meta={`de ${reqs.length} enviadas`} />
          <Medidor rotulo="Com retry (lentas)" valor={reqs.length ? `${Math.round((lentas / reqs.length) * 1000) / 10}%` : '—'} bom={reqs.length ? (lentas / reqs.length) * 100 <= META_RETENTADAS : null} meta={`meta: ≤ ${META_RETENTADAS}%`} />
        </div>

        {terminou && res && <Veredito aprovado={res.aprovado} texto={res.diagnostico} aoContinuar={() => relatar(true, `Teste de carga aprovado: ${res.disponibilidade}% de disponibilidade com a 58817 fora do ar`, res.diagnostico)} />}
      </div>
    </div>
  );
}

// --------------------------------------------------------------- Black Friday

function Deslizante({ rotulo, valor, min, max, aoMudar, desabilitado, sufixo }: { rotulo: string; valor: number; min: number; max: number; aoMudar: (v: number) => void; desabilitado: boolean; sufixo: string }) {
  return (
    <label className="block rounded-md border border-borda bg-painel2 p-2.5">
      <span className="flex justify-between text-[12.5px] text-texto">
        <span className="font-semibold">{rotulo}</span>
        <span className="font-mono tabular-nums">
          {valor} {sufixo}
        </span>
      </span>
      <input type="range" min={min} max={max} value={valor} disabled={desabilitado} onChange={(e) => aoMudar(Number(e.target.value))} className="mt-1.5 w-full accent-[#3ddc84]" aria-label={rotulo} />
    </label>
  );
}

function BlackFriday({ relatar }: { relatar: (ok: boolean, resumo: string, diag: string) => void }) {
  const [cfg, setCfg] = useState<ConfigBlackFriday>({ modo: 'fixo', fixas: 10, minimo: 1, maximo: 30 });
  const [res, setRes] = useState<ResultadoBlackFriday | null>(null);
  const { passo, rodando, iniciar } = useRelogio(24, 190);
  const terminou = res !== null && !rodando && passo === 23;

  const rodar = () => {
    const r = simularBlackFriday(cfg);
    setRes(r);
    iniciar(() => {
      if (!r.aprovado) relatar(false, `Black Friday: ${r.disponibilidade}% de disponibilidade, custo de R$ ${r.custo}`, r.diagnostico);
    });
  };

  const horas = res ? res.horas.slice(0, passo + 1) : [];
  const atual = horas[horas.length - 1];
  const total = horas.reduce((t, h) => t + h.rps, 0);
  const perdidas = horas.reduce((t, h) => t + h.perdidas, 0);
  const disp = total ? Math.floor(((total - perdidas) / total) * 10000) / 100 : null;
  const custo = atual?.custoAcumulado ?? 0;

  const W = 640, H = 230, BASE = 195, ESC = 165 / 6000, L = 36, PASSO = (W - L - 8) / 24;
  const y = (v: number) => BASE - Math.min(v, 6400) * ESC;

  return (
    <div className="grid h-full grid-cols-[250px_1fr] gap-4 overflow-auto p-4">
      <div className="space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-suave">Estratégia de capacidade</div>
        <div className="rounded-md border border-borda bg-painel2 p-2.5">
          {(['fixo', 'elastico'] as const).map((m) => (
            <label key={m} className="flex cursor-pointer items-start gap-2 py-1 text-[12px] text-texto">
              <input type="radio" name="modo" className="mt-0.5 accent-[#3ddc84]" checked={cfg.modo === m} disabled={rodando} onChange={() => setCfg({ ...cfg, modo: m })} />
              <span>
                <span className="block font-semibold">{m === 'fixo' ? 'Servidores fixos' : 'Auto scaling (elástico)'}</span>
                <span className="block text-[11.5px] text-suave">{m === 'fixo' ? 'Mesma quantidade ligada as 24 horas.' : 'Cria e remove instâncias conforme a demanda.'}</span>
              </span>
            </label>
          ))}
        </div>
        {cfg.modo === 'fixo' ? (
          <Deslizante rotulo="Servidores" valor={cfg.fixas} min={1} max={60} sufixo="inst." desabilitado={rodando} aoMudar={(v) => setCfg({ ...cfg, fixas: v })} />
        ) : (
          <>
            <Deslizante rotulo="Mínimo" valor={cfg.minimo} min={1} max={20} sufixo="inst." desabilitado={rodando} aoMudar={(v) => setCfg({ ...cfg, minimo: v })} />
            <Deslizante rotulo="Máximo" valor={cfg.maximo} min={10} max={60} sufixo="inst." desabilitado={rodando} aoMudar={(v) => setCfg({ ...cfg, maximo: v })} />
          </>
        )}
        <p className="text-[11.5px] leading-snug text-suave">
          Cada instância atende {CAPACIDADE} req/s e custa R$ {PRECO_HORA}/hora.
        </p>
        <button onClick={rodar} disabled={rodando} className="w-full rounded-md bg-verde px-3 py-2 text-[13px] font-semibold text-black hover:brightness-110 disabled:opacity-60">
          {rodando ? 'Black Friday em andamento…' : res ? '↻ Rodar o dia de novo' : '▶ Iniciar a Black Friday'}
        </button>
      </div>

      <div className="min-w-0 space-y-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-md border border-borda bg-painel" role="img" aria-label="Tráfego por hora e capacidade provisionada">
          {[0, 2000, 4000, 6000].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#1e2632" />
              <text x={L - 5} y={y(v) + 3} textAnchor="end" fill="#8391a5" fontSize="9">{v / 1000}k</text>
            </g>
          ))}
          {TRAFEGO.map((rps, h) => {
            const dados = horas[h];
            const x = L + h * PASSO;
            return (
              <g key={h}>
                <rect x={x + 2} y={y(rps)} width={PASSO - 4} height={BASE - y(rps)} rx="2" fill={dados ? '#2b6cb0' : '#1e2632'} />
                {dados && dados.perdidas > 0 && <rect x={x + 2} y={y(rps)} width={PASSO - 4} height={y(dados.atendidas) - y(rps)} rx="2" fill="#ff6b6b" />}
                {dados && <line x1={x} x2={x + PASSO} y1={y(dados.capacidade)} y2={y(dados.capacidade)} stroke="#3ddc84" strokeWidth="2.5" />}
                {h % 3 === 0 && <text x={x + PASSO / 2} y={BASE + 13} textAnchor="middle" fill="#8391a5" fontSize="9">{String(h).padStart(2, '0')}h</text>}
                {h === HORA_DA_FALHA && <text x={x + PASSO / 2} y={BASE + 26} textAnchor="middle" fill="#f2c14e" fontSize="9">⚡ falha</text>}
              </g>
            );
          })}
          <text x={W - 10} y="14" textAnchor="end" fill="#8391a5" fontSize="10">
            <tspan fill="#2b6cb0">■</tspan> tráfego (req/s)  <tspan fill="#3ddc84">▬</tspan> capacidade  <tspan fill="#ff6b6b">■</tspan> requisições perdidas
          </text>
        </svg>

        <div className="grid grid-cols-3 gap-2.5">
          <Medidor rotulo="Disponibilidade" valor={disp === null ? '—' : `${disp}%`} bom={disp === null ? null : disp >= META} meta={`meta: ≥ ${META}%`} />
          <Medidor rotulo="Custo acumulado" valor={`R$ ${custo}`} bom={atual ? custo <= ORCAMENTO : null} meta={`orçamento: R$ ${ORCAMENTO}`} />
          <Medidor rotulo="Instâncias agora" valor={atual ? String(atual.instancias) : '—'} bom={null} meta={atual ? `${String(atual.hora).padStart(2, '0')}h · ${atual.rps} req/s` : 'aguardando início'} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-realce" aria-hidden>
          <div className={`h-full transition-all ${custo > ORCAMENTO ? 'bg-vermelho' : 'bg-verde'}`} style={{ width: `${Math.min(100, (custo / ORCAMENTO) * 100)}%` }} />
        </div>

        {terminou && res && <Veredito aprovado={res.aprovado} texto={res.diagnostico} aoContinuar={() => relatar(true, `Black Friday concluída: ${res.disponibilidade}% de disponibilidade por R$ ${res.custo}`, res.diagnostico)} />}
      </div>
    </div>
  );
}

export function SimPane() {
  const progresso = useJogo((s) => s.progresso);
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const relatar = useJogo((s) => s.relatarSimulacao);
  const atual = etapaAtual({ progresso, questAtivaId });
  if (!atual || atual.etapa.tipo !== 'SIMULACAO') return null;
  return (
    <div className="flex h-full flex-col bg-fundo">
      <div className="shrink-0 border-b border-borda bg-painel px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-vermelho">Sala de Guerra</div>
        <div className="text-[13px] font-semibold text-white">{atual.etapa.titulo}</div>
      </div>
      <div className="min-h-0 flex-1">{atual.etapa.simulador === 'balanceador' ? <Balanceador relatar={relatar} /> : <BlackFriday relatar={relatar} />}</div>
    </div>
  );
}
