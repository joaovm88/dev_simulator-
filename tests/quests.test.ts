import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import initSqlJs from 'sql.js';
import { QUESTS } from '@/game/quests';
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
      if (etapa.tipo === 'DECISAO_ARQUITETURAL') continue;
      const comandos: string[] = [];
      const ctx = () => ({ files: s.files, pip: s.estado().pip, comandos });

      const antes = await validarEtapa(etapa, ctx(), rt);
      expect(antes.ok, `${quest.codigo} etapa ${etapa.ordem} não deveria passar antes da solução`).toBe(false);

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
