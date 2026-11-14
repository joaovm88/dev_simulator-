import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import initSqlJs from 'sql.js';
import { QUESTS, arquivoDaEtapa } from '@/game/quests';
import { LACUNAS } from '@/game/quests/lacunas';
import { gabarito, idsDoModelo, lacunasDa, montar } from '@/game/lacunas';
import { simularBalanceador } from '@/game/sim/balanceador';
import { simularBlackFriday, type ConfigBlackFriday } from '@/game/sim/blackfriday';
import { analisarDockerfile } from '@/game/sim/docker';
import { PYTHON_HARNESS, type ExecutorPython } from '@/game/runtime/pythonHarness';
import { MongoSim } from '@/game/runtime/mongoSim';
import { Shell, estadoInicialShell, type ShellEstado } from '@/game/shell/shell';
import { validarEtapa, type Runtimes } from '@/game/validators';
import type { Quest } from '@/game/types';
import { SOLUCOES } from './solucoes';

let rt: Runtimes;

beforeAll(async () => {
  const py = await loadPyodide();
  py.runPython(PYTHON_HARNESS);
  const executar = py.globals.get('_executar');
  const python: ExecutorPython = async (payload) => JSON.parse(executar(JSON.stringify(payload)));
  const SQL = await initSqlJs();
  rt = { python, sql: async () => SQL };
});

function sessao(quest: Quest) {
  const files: Record<string, string> = Object.fromEntries(quest.arquivosIniciaisIDE.map((a) => [a.caminho, a.conteudo]));
  let estado: ShellEstado = estadoInicialShell(quest.repoPronto);
  const mongo = new MongoSim();
  const shell = new Shell({
    ler: () => files,
    escrever: (c, v) => void (files[c] = v),
    apagar: (c) => void delete files[c],
    estado: () => structuredClone(estado),
    salvar: (e) => void (estado = e),
    python: (p) => rt.python(p),
    mongo: () => mongo,
  });
  return { files, shell, estado: () => estado };
}

describe('catálogo de missões', () => {
  it('tem 15 missões em ordem, com ids únicos', () => {
    expect(QUESTS.map((q) => q.ordemTrilha)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(new Set(QUESTS.map((q) => q._id)).size).toBe(15);
  });

  it('toda decisão tem exatamente uma opção correta e etapas numeradas', () => {
    for (const q of QUESTS) {
      expect(q.etapas.map((e) => e.ordem), q._id).toEqual(q.etapas.map((_, i) => i + 1));
      for (const e of q.etapas) {
        if (e.tipo === 'DECISAO_ARQUITETURAL') expect(e.opcoes.filter((o) => o.correta).length, `${q._id} etapa ${e.ordem}`).toBe(1);
      }
    }
  });
});

describe.each(QUESTS.map((q) => [q.codigo, q] as const))('%s — jogável do início ao fim', (_codigo, quest) => {
  it('o código inicial falha e a solução de referência passa em cada etapa', async () => {
    const sol = SOLUCOES[quest._id];
    expect(sol, 'solução de referência ausente').toBeDefined();
    const s = sessao(quest);

    for (const etapa of quest.etapas) {
      if (etapa.tipo === 'DECISAO_ARQUITETURAL' || etapa.tipo === 'REVISAO_CODIGO' || etapa.tipo === 'SIMULACAO') continue;
      const comandos: string[] = [];
      const ctx = () => ({ files: s.files, pip: s.estado().pip, comandos });

      const antes = await validarEtapa(etapa, ctx(), rt);
      expect(antes.ok, `${quest.codigo} etapa ${etapa.ordem} não deveria passar antes da solução`).toBe(false);

      // Modo guiado: o gabarito das lacunas, sozinho, precisa passar na validação.
      const modelos = lacunasDa(etapa);
      if (modelos.length > 0) {
        const guiado = { ...s.files, ...Object.fromEntries(modelos.map((l) => [l.arquivo, montar(l, gabarito(modelos))])) };
        const r = await validarEtapa(etapa, { ...ctx(), files: guiado }, rt);
        expect(r.testes.filter((t) => !t.ok).map((t) => `✗ lacunas · ${t.nome}: ${t.detalhe}`), `${quest.codigo} etapa ${etapa.ordem}`).toEqual([]);
      }

      Object.assign(s.files, sol.arquivos?.[etapa.ordem] ?? {});
      for (const cmd of sol.comandos?.[etapa.ordem] ?? []) {
        const r = await s.shell.executar(cmd);
        expect(r.codigo, `${quest.codigo} etapa ${etapa.ordem}: "${cmd}" falhou:\n${r.saida}`).toBe(0);
        comandos.push(...r.sucedidos);
      }

      const depois = await validarEtapa(etapa, ctx(), rt);
      const falhas = depois.testes.filter((t) => !t.ok).map((t) => `✗ ${t.nome}: ${t.detalhe}`);
      expect(falhas, `${quest.codigo} etapa ${etapa.ordem}`).toEqual([]);
      expect(depois.ok).toBe(true);
    }
  });
});

describe('modo guiado (lacunas)', () => {
  it('todas as chaves de LACUNAS pertencem a alguma etapa', () => {
    const usadas = QUESTS.flatMap((q) => q.etapas.filter((e) => lacunasDa(e).length > 0).map((e) => `${q._id}:${arquivoDaEtapa(e)}`));
    expect(Object.keys(LACUNAS).sort()).toEqual(usadas.sort());
  });

  it('toda etapa de código (exceto terminal) tem modo guiado', () => {
    const sem = QUESTS.flatMap((q) =>
      q.etapas.filter((e) => /^(IMPLEMENTACAO|VALIDACAO)/.test(e.tipo) && lacunasDa(e).length === 0).map((e) => `${q.codigo} etapa ${e.ordem}`),
    );
    expect(sem).toEqual([]);
  });

  it('cada lacuna tem exatamente uma opção correta, textos distintos e marcador no modelo', () => {
    for (const [chave, modelos] of Object.entries(LACUNAS)) {
      for (const l of modelos) {
        expect(idsDoModelo(l).sort(), `${chave} (${l.arquivo})`).toEqual(Object.keys(l.slots).sort());
        for (const [id, ops] of Object.entries(l.slots)) {
          expect(ops.filter((o) => o.correta).length, `${chave} #${id}`).toBe(1);
          expect(new Set(ops.map((o) => o.texto)).size, `${chave} #${id}`).toBe(ops.length);
          expect(ops.every((o) => o.explica.length > 15), `${chave} #${id}`).toBe(true);
        }
      }
    }
  });

  it('uma lacuna preenchida com "nada" remove a linha', () => {
    const l = LACUNAS['quest_sr_03_docker_kubernetes:Dockerfile'][0];
    const texto = montar(l, gabarito([l]));
    expect(texto).not.toMatch(/PASSWORD/);
    expect(texto).toMatch(/^EXPOSE 8000$/m);
  });
});

describe('revisão de código', () => {
  it('os problemas apontam para linhas não vazias do código', () => {
    const revisoes = QUESTS.flatMap((q) => q.etapas.filter((e) => e.tipo === 'REVISAO_CODIGO'));
    expect(revisoes.length).toBe(3);
    for (const e of revisoes) {
      if (e.tipo !== 'REVISAO_CODIGO') continue;
      const linhas = e.codigo.split('\n');
      for (const p of e.problemas) expect(linhas[p.linha - 1]?.trim(), `${e.titulo} linha ${p.linha}`).toBeTruthy();
    }
  });
});

describe('simuladores', () => {
  it('balanceador: só a arquitetura completa atinge a meta', () => {
    const r = (roteamento: 'fixo' | 'roundrobin', heartbeat: boolean, retry: boolean) => simularBalanceador({ roteamento, heartbeat, retry });
    expect(r('fixo', false, false).aprovado).toBe(false);
    expect(r('fixo', true, true).aprovado).toBe(false);
    expect(r('roundrobin', false, false).aprovado).toBe(false);
    expect(r('roundrobin', true, false).aprovado).toBe(false);
    expect(r('roundrobin', false, true)).toMatchObject({ disponibilidade: 100, aprovado: false });
    const ideal = r('roundrobin', true, true);
    expect(ideal.aprovado).toBe(true);
    expect(ideal.falhas).toBe(0);
    // Depois da detecção, a instância morta não recebe mais nada.
    expect(ideal.ticks.at(-1)!.reqs.some((q) => q.porta === 58817)).toBe(false);
  });

  it('black friday: elástico com mínimo 2 e máximo 50 fecha a conta', () => {
    const r = (c: Partial<ConfigBlackFriday>) => simularBlackFriday({ modo: 'elastico', fixas: 10, minimo: 2, maximo: 50, ...c });
    expect(r({})).toMatchObject({ aprovado: true, custo: 488, disponibilidade: 100 });
    expect(r({ modo: 'fixo', fixas: 50 }).aprovado).toBe(false); // estoura o orçamento
    expect(r({ modo: 'fixo', fixas: 10 }).aprovado).toBe(false); // cai no pico
    expect(r({ maximo: 40 }).aprovado).toBe(false); // teto baixo
    expect(r({ minimo: 1 }).aprovado).toBe(false); // ponto único de falha às 04h
    expect(r({ minimo: 10 }).aprovado).toBe(false); // ociosidade cara
  });

  it('docker: o Dockerfile corrigido é menor, reconstrói mais rápido e não tem alertas', () => {
    const quest = QUESTS.find((q) => q.codigo === 'Sr 03')!;
    const ruim = analisarDockerfile(quest.arquivosIniciaisIDE.find((a) => a.caminho === 'Dockerfile')!.conteudo);
    const l = LACUNAS['quest_sr_03_docker_kubernetes:Dockerfile'][0];
    const bom = analisarDockerfile(montar(l, gabarito([l])));
    expect(ruim.alertas.length).toBe(3);
    expect(bom.alertas).toEqual([]);
    expect(bom.tamanhoMB).toBeLessThan(ruim.tamanhoMB / 4);
    expect(bom.rebuildSegundos).toBeLessThan(ruim.rebuildSegundos / 10);
  });
});

describe('eventos de mentoria', () => {
  it('Jr 05: push com .env no commit é bloqueado e corrigido com .gitignore + git rm --cached', async () => {
    const quest = QUESTS.find((q) => q.codigo === 'Jr 05')!;
    const s = sessao(quest);
    for (const cmd of ['git init', 'git add .', 'git commit -m "tudo"', 'git remote add origin https://github.com/nexustech/x.git']) {
      expect((await s.shell.executar(cmd)).codigo).toBe(0);
    }
    const bloqueado = await s.shell.executar('git push -u origin main');
    expect(bloqueado.codigo).toBe(1);
    expect(bloqueado.evento).toBe('SEGREDO_NO_PUSH');

    const conserto = await s.shell.executar('echo ".env" > .gitignore && git rm --cached .env && git add . && git commit -m "remove segredo" && git push');
    expect(conserto.codigo, conserto.saida).toBe(0);
    expect(s.files['.env']).toBeDefined();
  });

  it('Pl 04: UPDATE sem WHERE congela a transação', async () => {
    const quest = QUESTS.find((q) => q.codigo === 'Pl 04')!;
    const etapa = quest.etapas[0];
    const files = { 'sql/01_carga.sql': 'UPDATE funcionario SET salario = salario * 1.10;' };
    const r = await validarEtapa(etapa, { files, pip: [], comandos: [] }, rt);
    expect(r.ok).toBe(false);
    expect(r.testes.at(-1)?.detalhe).toMatch(/WHERE/);
  });

  it('Jr 04: importar geopy sem pip install falha com ModuleNotFoundError', async () => {
    const quest = QUESTS.find((q) => q.codigo === 'Jr 04')!;
    const s = sessao(quest);
    const r = await s.shell.executar('python src/wazeyes.py');
    expect(r.codigo).toBe(1);
    expect(r.saida).toMatch(/ModuleNotFoundError/);
  });

  it('terminal: python executa de verdade e aponta a linha do erro', async () => {
    const s = sessao(QUESTS[0]);
    s.files['ok.py'] = 'print(sum(range(5)))\n';
    s.files['bug.py'] = 'x = 1\nprint(x / 0)\n';
    expect((await s.shell.executar('python ok.py')).saida).toBe('10');
    const bug = await s.shell.executar('python bug.py');
    expect(bug.saida).toMatch(/line 2/);
    expect(bug.saida).toMatch(/ZeroDivisionError/);
  });

  it('mongosh no terminal consulta documentos aninhados', async () => {
    const s = sessao(QUESTS[0]);
    await s.shell.executar('use loja');
    await s.shell.executar('db.produtos.insertOne({ nome: "Guitarra", atributos: { cordas: 6 } })');
    const r = await s.shell.executar('db.produtos.find({ "atributos.cordas": { $gte: 6 } }).count()');
    expect(r.saida).toBe('1');
    const doc = await s.shell.executar('db.produtos.findOne({})');
    expect(doc.saida).toMatch(/"_id": ObjectId\("[0-9a-f]{24}"\)/);
  });
});
