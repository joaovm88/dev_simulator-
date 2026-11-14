import type {
  Etapa,
  EtapaCodigo,
  EtapaMongo,
  EtapaSQL,
  Regra,
  ResultadoTeste,
  ResultadoValidacao,
} from '../types';
import type { ExecutorPython, PayloadPython } from '../runtime/pythonHarness';
import { MongoSim } from '../runtime/mongoSim';
import { pacotesInstalados } from '../shell/pacotes';
import type { SqlJsStatic, Database } from 'sql.js';

export interface Runtimes {
  python: ExecutorPython;
  sql: () => Promise<SqlJsStatic>;
}

export interface ContextoValidacao {
  files: Record<string, string>;
  pip: string[];
  comandos: string[];
}

// ---------- Regras estruturais ----------

function semComentarios(caminho: string, texto: string): string {
  if (/\.(java|kt|ts|tsx|js|cs)$/.test(caminho)) return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  if (/\.sql$/.test(caminho)) return texto.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/(\.py|\.ya?ml|Dockerfile|\.gitignore|\.env)$/.test(caminho)) return texto.replace(/^\s*#.*$/gm, '');
  return texto;
}

export function avaliarRegras(regras: Regra[], files: Record<string, string>): ResultadoTeste[] {
  return regras.map((r) => {
    const bruto = files[r.arquivo];
    if (bruto === undefined) {
      return { nome: r.nome, ok: false, detalhe: `O arquivo \`${r.arquivo}\` ainda não existe no projeto.`, arquivo: r.arquivo };
    }
    const achou = new RegExp(r.padrao, r.flags ?? 'm').test(semComentarios(r.arquivo, bruto));
    const ok = achou === (r.deveExistir ?? true);
    return { nome: r.nome, ok, detalhe: ok ? undefined : r.dica, arquivo: r.arquivo };
  });
}

// ---------- Python ----------

async function validarCodigo(etapa: EtapaCodigo, ctx: ContextoValidacao, rt: Runtimes): Promise<ResultadoTeste[]> {
  const testes: NonNullable<PayloadPython['testes']> = [
    ...(etapa.casosDeTeste ?? []).map((c) => ({
      tipo: 'caso' as const,
      nome: `${etapa.funcaoAlvo}(${c.input.map((i) => JSON.stringify(i)).join(', ')})`,
      funcao: etapa.funcaoAlvo!,
      input: c.input,
      esperado: c.outputEsperado,
    })),
    ...(etapa.testes ?? []).map((t) => ({ tipo: 'codigo' as const, nome: t.nome, codigo: t.codigo })),
  ];
  const estaticos = avaliarRegras(etapa.regras ?? [], ctx.files);
  if (testes.length === 0) return estaticos;
  const resp = await rt.python({
    modo: 'testes',
    files: ctx.files,
    pacotes: pacotesInstalados(ctx.pip),
    arquivo: etapa.arquivo,
    testes,
  });
  const dinamicos = (resp.testes ?? []).map<ResultadoTeste>((t) => ({
    nome: t.nome,
    ok: t.ok,
    detalhe: t.erro ? `${t.erro.tipo}: ${t.erro.mensagem}` : undefined,
    arquivo: t.erro?.arquivo ?? undefined,
    linha: t.erro?.linha ?? undefined,
    saida: t.saida || undefined,
  }));
  return [...estaticos, ...dinamicos];
}

// ---------- SQL ----------

export function novoBancoSQL(SQL: SqlJsStatic, setup?: string): Database {
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  // Atalhos de dialeto Oracle usados nas missões.
  db.create_function('TO_DATE', (data: string) => data);
  db.create_function('NVL', (a: unknown, b: unknown) => (a ?? b) as string);
  if (setup) db.run(setup);
  return db;
}

/** Devolve a primeira instrução UPDATE/DELETE sem WHERE, se houver. */
export function semWhere(script: string): string | null {
  const limpo = semComentarios('x.sql', script);
  for (const instrucao of limpo.split(';')) {
    const s = instrucao.trim();
    if (/^(update|delete)\b/i.test(s) && !/\bwhere\b/i.test(s)) return s.replace(/\s+/g, ' ');
  }
  return null;
}

const normalizarLinhas = (linhas: unknown[][], ordenado: boolean) => {
  const txt = linhas.map((l) => JSON.stringify(l));
  return ordenado ? txt : [...txt].sort();
};

async function validarSQL(etapa: EtapaSQL, ctx: ContextoValidacao, rt: Runtimes): Promise<ResultadoTeste[]> {
  const SQL = await rt.sql();
  const script = ctx.files[etapa.arquivo] ?? '';
  const out: ResultadoTeste[] = avaliarRegras(etapa.regras ?? [], ctx.files);
  const perigosa = semWhere(script);
  if (perigosa) {
    return [
      ...out,
      {
        nome: 'Transação segura',
        ok: false,
        arquivo: etapa.arquivo,
        detalhe: `Congelei a transação: \`${perigosa}\` não tem cláusula WHERE e afetaria TODAS as linhas da tabela. Em produção, um ROLLBACK antes do COMMIT restauraria o estado original. Adicione o WHERE e rode de novo.`,
      },
    ];
  }
  const db = novoBancoSQL(SQL, etapa.setupSQL);
  try {
    let resultados;
    try {
      resultados = db.exec(script);
      out.push({ nome: `Executar ${etapa.arquivo}`, ok: true });
    } catch (e) {
      out.push({ nome: `Executar ${etapa.arquivo}`, ok: false, arquivo: etapa.arquivo, detalhe: `Erro do banco: ${(e as Error).message}` });
      return out;
    }
    if (etapa.resultadoEsperado) {
      const ordenado = etapa.resultadoEsperado.ordenado ?? false;
      const ultimo = resultados[resultados.length - 1];
      const obtido = normalizarLinhas((ultimo?.values ?? []) as unknown[][], ordenado);
      const esperado = normalizarLinhas(etapa.resultadoEsperado.linhas, ordenado);
      const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
      out.push({
        nome: 'Resultado da consulta',
        ok,
        arquivo: etapa.arquivo,
        detalhe: ok
          ? undefined
          : !ultimo
            ? 'O script não retornou linhas. O último comando precisa ser o SELECT pedido.'
            : `A consulta retornou ${ultimo.values.length} linha(s) com colunas (${ultimo.columns.join(', ')}), mas o resultado não confere com o esperado (${esperado.length} linha(s))${ordenado ? ', na ordem pedida' : ''}.`,
      });
    }
    for (const v of etapa.verificacoes ?? []) {
      try {
        const r = db.exec(v.sql);
        if (v.deveFalhar) {
          out.push({ nome: v.nome, ok: false, detalhe: v.dica ?? 'O banco aceitou um dado que deveria ser rejeitado.' });
          continue;
        }
        const ok =
          v.esperado === undefined ||
          JSON.stringify(normalizarLinhas((r[0]?.values ?? []) as unknown[][], false)) === JSON.stringify(normalizarLinhas(v.esperado, false));
        out.push({ nome: v.nome, ok, detalhe: ok ? undefined : v.dica });
      } catch (e) {
        if (v.deveFalhar) out.push({ nome: v.nome, ok: true });
        else out.push({ nome: v.nome, ok: false, detalhe: `${v.dica ?? ''} (${(e as Error).message})`.trim() });
      }
    }
  } finally {
    db.close();
  }
  return out;
}

// ---------- MongoDB ----------

function validarMongo(etapa: EtapaMongo, ctx: ContextoValidacao): ResultadoTeste[] {
  const out = avaliarRegras(etapa.regras ?? [], ctx.files);
  const sim = new MongoSim();
  try {
    sim.executar(ctx.files[etapa.arquivo] ?? '');
    out.push({ nome: `Executar ${etapa.arquivo}`, ok: true });
  } catch (e) {
    out.push({ nome: `Executar ${etapa.arquivo}`, ok: false, arquivo: etapa.arquivo, detalhe: (e as Error).message });
    return out;
  }
  for (const v of etapa.verificacoes) {
    const n = sim.colecao(v.colecao, etapa.banco).countDocuments(v.filtro);
    out.push({ nome: v.nome, ok: n === v.contagem, detalhe: n === v.contagem ? undefined : `${v.dica ?? ''} (encontrei ${n}, esperava ${v.contagem})`.trim() });
  }
  for (const r of etapa.devemSerRejeitados ?? []) {
    try {
      sim.colecao(r.colecao, etapa.banco).insertOne(structuredClone(r.documento));
      out.push({ nome: r.nome, ok: false, detalhe: r.dica ?? 'O validador aceitou um documento inválido.' });
    } catch {
      out.push({ nome: r.nome, ok: true });
    }
  }
  return out;
}

// ---------- Terminal ----------

export function comandosPendentes(etapa: Extract<Etapa, { tipo: 'COMANDO_TERMINAL' }>, comandos: string[]) {
  return etapa.comandos.filter((c) => !comandos.some((x) => new RegExp(c.padrao).test(x)));
}

// ---------- Fachada ----------

export async function validarEtapa(etapa: Etapa, ctx: ContextoValidacao, rt: Runtimes): Promise<ResultadoValidacao> {
  let testes: ResultadoTeste[];
  switch (etapa.tipo) {
    case 'IMPLEMENTACAO_CODIGO':
      testes = await validarCodigo(etapa, ctx, rt);
      break;
    case 'IMPLEMENTACAO_SQL':
      testes = await validarSQL(etapa, ctx, rt);
      break;
    case 'IMPLEMENTACAO_MONGO':
      testes = validarMongo(etapa, ctx);
      break;
    case 'VALIDACAO_ESTATICA':
      testes = avaliarRegras(etapa.regras, ctx.files);
      break;
    case 'COMANDO_TERMINAL': {
      const pendentes = comandosPendentes(etapa, ctx.comandos);
      testes = [
        ...etapa.comandos.map((c) => ({
          nome: c.descricao,
          ok: !pendentes.includes(c),
          detalhe: pendentes.includes(c) ? 'Ainda não executado com sucesso no terminal.' : undefined,
        })),
        ...avaliarRegras(etapa.regras ?? [], ctx.files),
      ];
      break;
    }
    case 'DECISAO_ARQUITETURAL':
    case 'REVISAO_CODIGO':
    case 'SIMULACAO':
      // Resolvidas pela interação do jogador (ver store).
      testes = [];
      break;
  }
  return { ok: testes.every((t) => t.ok), testes };
}
