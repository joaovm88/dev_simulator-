'use client';

import { useEffect, useState } from 'react';
import { questPorId } from '@/game/quests';
import { useJogo } from '@/game/state/store';
import { bancosDa } from '@/game/runtime/bancos';
import { carregarSQL } from '@/game/runtime/sqlBrowser';
import { novoBancoSQL } from '@/game/validators';
import { formatarMongo } from '@/game/runtime/mongoSim';

type Selecao = { tipo: 'resultado' } | { tipo: 'tabela'; nome: string } | { tipo: 'colecao'; banco: string; nome: string };

function Grade({ colunas, linhas }: { colunas: string[]; linhas: unknown[][] }) {
  if (colunas.length === 0) return <p className="p-3 text-suave">Sem linhas.</p>;
  return (
    <table className="w-max min-w-full border-collapse font-mono text-[12px]">
      <thead className="sticky top-0 bg-painel2">
        <tr>
          {colunas.map((c, i) => (
            <th key={i} className="border-b border-r border-borda px-3 py-1 text-left font-semibold text-suave">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l, i) => (
          <tr key={i} className="odd:bg-painel/60">
            {l.map((v, j) => (
              <td key={j} className={`border-b border-r border-borda/60 px-3 py-1 ${typeof v === 'number' ? 'text-right tabular-nums text-azul' : ''}`}>
                {v === null ? <span className="italic text-suave">NULL</span> : String(v)}
              </td>
            ))}
          </tr>
        ))}
        {linhas.length === 0 && (
          <tr>
            <td colSpan={colunas.length} className="px-3 py-2 text-suave">
              (tabela vazia)
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function DataInspector() {
  const questId = useJogo((s) => s.questAtivaId);
  const versao = useJogo((s) => s.dadosVersao);
  const consulta = useJogo((s) => s.consultaSQL);
  const [selecao, setSelecao] = useState<Selecao>({ tipo: 'resultado' });
  const [sql, setSql] = useState('');
  const [, forcar] = useState(0);
  const quest = questPorId(questId);

  // Missões SQL que já partem de um esquema pronto (ex.: Pl 04) mostram as tabelas de saída.
  useEffect(() => {
    if (!quest) return;
    const bancos = bancosDa(quest._id);
    if (bancos.sql) return;
    const comSetup = quest.etapas.find((e) => e.tipo === 'IMPLEMENTACAO_SQL' && e.setupSQL);
    if (!comSetup || comSetup.tipo !== 'IMPLEMENTACAO_SQL') return;
    let cancelado = false;
    carregarSQL().then((SQL) => {
      if (cancelado || bancos.sql) return;
      bancos.sql = novoBancoSQL(SQL, comSetup.setupSQL);
      forcar((n) => n + 1);
    });
    return () => {
      cancelado = true;
    };
  }, [quest]);

  useEffect(() => {
    if (consulta) setSelecao({ tipo: 'resultado' });
  }, [consulta, versao]);

  if (!quest) return <p className="p-3 text-suave">Abra uma missão para inspecionar os bancos de dados do projeto.</p>;

  const bancos = bancosDa(quest._id);
  let tabelas: string[] = [];
  try {
    tabelas = (bancos.sql?.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")[0]?.values ?? []).map((v) => String(v[0]));
  } catch {
    /* banco fechado */
  }
  const colecoes = Object.entries(bancos.mongo.bancos).flatMap(([banco, cs]) => Object.keys(cs).map((nome) => ({ banco, nome })));

  const rodarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sql.trim()) return;
    try {
      bancos.sql ??= novoBancoSQL(await carregarSQL());
      const r = bancos.sql.exec(sql);
      const ultimo = r[r.length - 1];
      useJogo.setState((s) => ({
        dadosVersao: s.dadosVersao + 1,
        consultaSQL: ultimo ? { colunas: ultimo.columns, linhas: ultimo.values as unknown[][] } : { colunas: ['resultado'], linhas: [['Comando executado.']] },
      }));
    } catch (erro) {
      useJogo.setState({ consultaSQL: { colunas: ['erro'], linhas: [[(erro as Error).message]] } });
    }
  };

  let conteudo: React.ReactNode;
  if (selecao.tipo === 'tabela' && tabelas.includes(selecao.nome)) {
    const r = bancos.sql!.exec(`SELECT * FROM "${selecao.nome}" LIMIT 200`)[0];
    const colunas = r?.columns ?? (bancos.sql!.exec(`PRAGMA table_info("${selecao.nome}")`)[0]?.values ?? []).map((v) => String(v[1]));
    conteudo = <Grade colunas={colunas} linhas={(r?.values ?? []) as unknown[][]} />;
  } else if (selecao.tipo === 'colecao' && bancos.mongo.bancos[selecao.banco]?.[selecao.nome]) {
    const docs = bancos.mongo.bancos[selecao.banco][selecao.nome].docs;
    conteudo = (
      <div className="space-y-2 p-3">
        {docs.length === 0 && <p className="text-suave">(coleção vazia)</p>}
        {docs.map((d, i) => (
          <pre key={i} className="overflow-x-auto rounded border border-borda bg-painel p-2 font-mono text-[12px] leading-5 text-[#b8f5d2]">
            {formatarMongo(JSON.parse(JSON.stringify(d)))}
          </pre>
        ))}
      </div>
    );
  } else if (consulta) {
    conteudo = <Grade colunas={consulta.colunas} linhas={consulta.linhas} />;
  } else {
    conteudo = (
      <p className="p-3 leading-relaxed text-suave">
        Abra um arquivo <code className="inline">.sql</code> ou <code className="inline">.mongodb.js</code> e clique em <span className="text-texto">▶ Executar</span> para carregar o banco. As tabelas e coleções aparecem na lista ao lado.
      </p>
    );
  }

  const item = (ativo: boolean, rotulo: string, icone: string, onClick: () => void, chave: string) => (
    <li key={chave}>
      <button onClick={onClick} className={`block w-full truncate px-3 py-1 text-left font-mono text-[12px] ${ativo ? 'bg-realce text-white' : 'text-texto hover:bg-painel2'}`}>
        <span className="mr-1.5 text-suave">{icone}</span>
        {rotulo}
      </button>
    </li>
  );

  return (
    <div className="flex h-full" data-versao={versao}>
      <div className="w-48 shrink-0 overflow-y-auto border-r border-borda bg-painel py-1">
        <ul>{item(selecao.tipo === 'resultado', 'Último resultado', '▸', () => setSelecao({ tipo: 'resultado' }), 'res')}</ul>
        <h3 className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-suave">SQL · tabelas</h3>
        <ul>
          {tabelas.map((t) => item(selecao.tipo === 'tabela' && selecao.nome === t, t, '▦', () => setSelecao({ tipo: 'tabela', nome: t }), 't' + t))}
          {tabelas.length === 0 && <li className="px-3 py-0.5 text-[11px] text-suave">—</li>}
        </ul>
        <h3 className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-suave">MongoDB · coleções</h3>
        <ul>
          {colecoes.map((c) =>
            item(selecao.tipo === 'colecao' && selecao.nome === c.nome && selecao.banco === c.banco, `${c.banco}.${c.nome}`, '{}', () => setSelecao({ tipo: 'colecao', ...c }), 'c' + c.banco + c.nome),
          )}
          {colecoes.length === 0 && <li className="px-3 py-0.5 text-[11px] text-suave">—</li>}
        </ul>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <form onSubmit={rodarConsulta} className="flex shrink-0 gap-2 border-b border-borda bg-painel px-2 py-1.5">
          <input
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Consulta SQL avulsa, ex.: SELECT * FROM funcionario WHERE salario > 5000"
            aria-label="Consulta SQL"
            spellCheck={false}
            className="min-w-0 flex-1 rounded border border-borda bg-fundo px-2 py-1 font-mono text-[12px] text-white outline-none focus:border-verde/60"
          />
          <button className="rounded border border-borda px-3 text-[12px] hover:bg-realce">Consultar</button>
        </form>
        <div className="min-h-0 flex-1 overflow-auto">{conteudo}</div>
      </div>
    </div>
  );
}
