// Shell simulado do Integrated Terminal. `python` executa de verdade (Pyodide);
// pip, git, npm, docker e kubectl são simulações didáticas com estado.
import type { ExecutorPython } from '../runtime/pythonHarness';
import { formatarMongo, type MongoSim } from '../runtime/mongoSim';
import { IMAGENS_PUBLICAS, PACOTES_PIP, VERSOES_NPM, pacotesInstalados } from './pacotes';

export interface Commit {
  hash: string;
  mensagem: string;
  arvore: Record<string, string>;
}

export interface ShellEstado {
  pip: string[];
  git: { iniciado: boolean; remoto: string | null; indice: Record<string, string>; commits: Commit[]; enviados: number };
  docker: { imagens: string[]; containers: { id: string; imagem: string; nome: string; portas: string }[] };
  k8s: string[];
}

export const estadoInicialShell = (repoPronto = false): ShellEstado => ({
  pip: [],
  git: {
    iniciado: repoPronto,
    remoto: repoPronto ? 'https://github.com/nexustech/projeto.git' : null,
    indice: {},
    commits: [],
    enviados: 0,
  },
  docker: { imagens: [], containers: [] },
  k8s: [],
});

export interface ShellCtx {
  ler(): Record<string, string>;
  escrever(caminho: string, conteudo: string): void;
  apagar(caminho: string): void;
  estado(): ShellEstado;
  salvar(e: ShellEstado): void;
  python: ExecutorPython;
  mongo(): MongoSim;
}

export type EventoShell = 'SEGREDO_NO_PUSH';

export interface ResultadoShell {
  saida: string;
  codigo: number;
  limpar?: boolean;
  evento?: EventoShell;
}

const c = {
  verde: (s: string) => `\x1b[32m${s}\x1b[0m`,
  vermelho: (s: string) => `\x1b[31m${s}\x1b[0m`,
  amarelo: (s: string) => `\x1b[33m${s}\x1b[0m`,
  ciano: (s: string) => `\x1b[36m${s}\x1b[0m`,
  cinza: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

const ok = (saida = ''): ResultadoShell => ({ saida, codigo: 0 });
const falha = (saida: string, codigo = 1): ResultadoShell => ({ saida, codigo });

export function tokenizar(linha: string): string[] {
  const out: string[] = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(linha))) out.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : (m[2] ?? m[3]));
  return out;
}

/** Divide por `&&` respeitando aspas. */
function encadeados(linha: string): string[] {
  const partes: string[] = [];
  let atual = '';
  let aspas: string | null = null;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (aspas) {
      if (ch === aspas) aspas = null;
    } else if (ch === '"' || ch === "'") aspas = ch;
    else if (ch === '&' && linha[i + 1] === '&') {
      partes.push(atual);
      atual = '';
      i++;
      continue;
    }
    atual += ch;
  }
  partes.push(atual);
  return partes.map((p) => p.trim()).filter(Boolean);
}

const SENSIVEIS = [/(^|\/)\.env(\..+)?$/, /google-services\.json$/, /\.pem$/, /(^|\/)credentials(\.\w+)?$/, /id_rsa$/];
export const ehSensivel = (caminho: string) => SENSIVEIS.some((r) => r.test(caminho));

export function ignorado(caminho: string, gitignore: string | undefined): boolean {
  if (!gitignore) return false;
  const nome = caminho.split('/').pop()!;
  return gitignore
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .some((padrao) => {
      const p = padrao.replace(/^\//, '');
      if (p.endsWith('/')) return caminho.startsWith(p) || caminho.includes('/' + p);
      const re = new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
      return re.test(nome) || re.test(caminho) || caminho.startsWith(p + '/');
    });
}

const hash = () => Math.random().toString(16).slice(2, 9).padEnd(7, '0');

function diff(a: Record<string, string>, b: Record<string, string>) {
  const novos = Object.keys(a).filter((k) => !(k in b));
  const alterados = Object.keys(a).filter((k) => k in b && a[k] !== b[k]);
  const removidos = Object.keys(b).filter((k) => !(k in a));
  return { novos, alterados, removidos, vazio: novos.length + alterados.length + removidos.length === 0 };
}

const AJUDA = [
  c.verde('dev_OS shell') + ' — comandos disponíveis:',
  '  ls, cat <arq>, touch <arq>, rm <arq>, echo "txt" > <arq>, pwd, clear',
  '  python <arq.py> | python --version       (execução real via WebAssembly)',
  '  pip install <pacote> | pip list',
  '  git init|status|add|commit|remote|push|log|rm --cached',
  '  npm init -y | npm install <pkg> | npx tsc',
  '  docker build|images|run|ps|push   ·   kubectl apply|get',
  '  mongosh: use <db>, show collections, db.<colecao>.find({...})',
].join('\n');

export class Shell {
  constructor(private ctx: ShellCtx) {}

  /** Executa uma linha (com suporte a `&&`). Devolve também os comandos bem-sucedidos. */
  async executar(linha: string): Promise<ResultadoShell & { sucedidos: string[] }> {
    const saidas: string[] = [];
    const sucedidos: string[] = [];
    let ultimo: ResultadoShell = ok();
    for (const cmd of encadeados(linha)) {
      try {
        ultimo = await this.um(cmd);
      } catch (e) {
        ultimo = falha(c.vermelho((e as Error).message));
      }
      if (ultimo.saida) saidas.push(ultimo.saida);
      if (ultimo.codigo !== 0) break;
      sucedidos.push(cmd);
    }
    return { ...ultimo, saida: saidas.join('\n'), sucedidos };
  }

  private async um(cmd: string): Promise<ResultadoShell> {
    if (/^(db\.|use\s|show\s)/.test(cmd)) return this.mongosh(cmd);
    const [bin, ...args] = tokenizar(cmd);
    switch (bin) {
      case 'help':
        return ok(AJUDA);
      case 'clear':
      case 'cls':
        return { saida: '', codigo: 0, limpar: true };
      case 'pwd':
        return ok('/home/dev/projeto');
      case 'whoami':
        return ok('dev');
      case 'ls':
      case 'dir':
        return this.ls(args.find((a) => !a.startsWith('-')));
      case 'cat':
      case 'type': {
        const conteudo = this.ctx.ler()[this.caminho(args[0])];
        return conteudo === undefined ? falha(`cat: ${args[0]}: Arquivo não encontrado`) : ok(conteudo.replace(/\n$/, ''));
      }
      case 'touch':
        if (!args[0]) return falha('touch: faltou o nome do arquivo');
        if (this.ctx.ler()[this.caminho(args[0])] === undefined) this.ctx.escrever(this.caminho(args[0]), '');
        return ok();
      case 'mkdir':
        return ok();
      case 'rm': {
        const alvo = this.caminho(args.find((a) => !a.startsWith('-')) ?? '');
        if (this.ctx.ler()[alvo] === undefined) return falha(`rm: ${alvo}: Arquivo não encontrado`);
        this.ctx.apagar(alvo);
        return ok();
      }
      case 'echo':
        return this.echo(cmd);
      case 'python':
      case 'python3':
      case 'py':
        return this.python(args);
      case 'pip':
      case 'pip3':
        return this.pip(args);
      case 'git':
        return this.git(args);
      case 'npm':
        return this.npm(args);
      case 'npx':
        return this.npx(args);
      case 'node':
        return args[0] === '-v' || args[0] === '--version' ? ok('v22.21.0') : falha('node: neste sandbox use `python` para executar código ou `npx tsc` para compilar TypeScript.');
      case 'docker':
        return this.docker(args);
      case 'kubectl':
        return this.kubectl(args);
      case 'mongosh':
        return ok(c.cinza('Conectado a mongodb://localhost:27017 (simulado). Digite os comandos direto: use loja · show collections · db.produtos.find()'));
      default:
        return falha(`${bin}: comando não encontrado. Digite ${c.ciano('help')} para ver os comandos.`, 127);
    }
  }

  private caminho(p: string) {
    return (p ?? '').replace(/^\.\//, '').replace(/\\/g, '/');
  }

  private ls(dir?: string): ResultadoShell {
    const base = dir && dir !== '.' ? this.caminho(dir).replace(/\/$/, '') + '/' : '';
    const itens = new Set<string>();
    for (const arq of Object.keys(this.ctx.ler())) {
      if (!arq.startsWith(base)) continue;
      const resto = arq.slice(base.length).split('/');
      itens.add(resto.length > 1 ? c.ciano(resto[0] + '/') : resto[0]);
    }
    if (itens.size === 0 && base) return falha(`ls: ${dir}: Diretório não encontrado`);
    return ok([...itens].sort().join('  '));
  }

  private echo(cmd: string): ResultadoShell {
    const m = cmd.match(/^echo\s+([\s\S]*?)\s*(>>?)\s*(\S+)\s*$/);
    if (!m) return ok(tokenizar(cmd).slice(1).join(' '));
    const texto = tokenizar(m[1]).join(' ') + '\n';
    const alvo = this.caminho(m[3]);
    const anterior = this.ctx.ler()[alvo] ?? '';
    this.ctx.escrever(alvo, m[2] === '>>' ? anterior + (anterior && !anterior.endsWith('\n') ? '\n' : '') + texto : texto);
    return ok();
  }

  private async python(args: string[]): Promise<ResultadoShell> {
    if (args[0] === '--version' || args[0] === '-V') return ok('Python 3.14 (Pyodide · WebAssembly)');
    if (args[0] === '-m' && args[1] === 'pip') return this.pip(args.slice(2));
    if (!args[0]) return falha('O modo interativo (REPL) não está disponível. Use: python <arquivo.py>');
    const arquivo = this.caminho(args[0]);
    const files = this.ctx.ler();
    if (files[arquivo] === undefined) return falha(`python: can't open file '${args[0]}': [Errno 2] No such file or directory`, 2);
    const r = await this.ctx.python({ modo: 'script', files, pacotes: pacotesInstalados(this.ctx.estado().pip), arquivo });
    const saida = (r.saida ?? '').replace(/\n$/, '');
    if (!r.erro) return ok(saida);
    const onde = r.erro.arquivo ? `  File "${r.erro.arquivo}", line ${r.erro.linha}\n` : '';
    return falha([saida, c.vermelho(`Traceback (most recent call last):\n${onde}${r.erro.tipo}: ${r.erro.mensagem}`)].filter(Boolean).join('\n'));
  }

  private pip(args: string[]): ResultadoShell {
    const est = this.ctx.estado();
    const [sub, ...resto] = args;
    if (sub === '--version') return ok('pip 25.2 (python 3.14)');
    if (sub === 'list' || sub === 'freeze') {
      const sep = sub === 'list' ? ' ' : '==';
      return ok(est.pip.map((p) => `${p}${sep}${PACOTES_PIP[p].versao}`).join('\n') || c.cinza('(nenhum pacote externo instalado)'));
    }
    if (sub === 'install') {
      const nomes = resto.filter((a) => !a.startsWith('-')).map((n) => n.toLowerCase().split('==')[0]);
      if (nomes.length === 0) return falha('ERROR: You must give at least one requirement to install');
      const linhas: string[] = [];
      for (const n of nomes) {
        const pacote = PACOTES_PIP[n];
        if (!pacote) {
          return falha(
            c.vermelho(`ERROR: Could not find a version that satisfies the requirement ${n}\nERROR: No matching distribution found for ${n}`) +
              c.cinza(`\n(índice interno do sandbox: ${Object.keys(PACOTES_PIP).join(', ')})`),
          );
        }
        if (est.pip.includes(n)) linhas.push(`Requirement already satisfied: ${n} (${pacote.versao})`);
        else {
          linhas.push(`Collecting ${n}\n  Downloading ${n}-${pacote.versao}-py3-none-any.whl\nInstalling collected packages: ${n}\n${c.verde(`Successfully installed ${n}-${pacote.versao}`)}`);
          est.pip = [...est.pip, n];
        }
      }
      this.ctx.salvar(est);
      return ok(linhas.join('\n'));
    }
    if (sub === 'uninstall') {
      est.pip = est.pip.filter((p) => !resto.includes(p));
      this.ctx.salvar(est);
      return ok('Successfully uninstalled');
    }
    return falha('Uso: pip install <pacote> | pip list');
  }

  private git(args: string[]): ResultadoShell {
    const est = this.ctx.estado();
    const g = est.git;
    const [sub, ...resto] = args;
    if (sub === '--version') return ok('git version 2.51.0');
    if (sub === 'init') {
      if (g.iniciado) return ok('Reinitialized existing Git repository in /home/dev/projeto/.git/');
      g.iniciado = true;
      this.ctx.salvar(est);
      return ok('Initialized empty Git repository in /home/dev/projeto/.git/');
    }
    if (sub === 'clone') return falha('fatal: neste sandbox o projeto já está na sua máquina. Use `git init` (ou siga direto com add/commit).');
    if (!g.iniciado) return falha('fatal: not a git repository (or any of the parent directories): .git', 128);

    const files = this.ctx.ler();
    const gitignore = files['.gitignore'];
    const head = g.commits[g.commits.length - 1]?.arvore ?? {};
    const rastreaveis = Object.fromEntries(Object.entries(files).filter(([k]) => !ignorado(k, gitignore) || k in g.indice));

    switch (sub) {
      case 'status': {
        const preparado = diff(g.indice, head);
        const pendente = diff(rastreaveis, g.indice);
        const linhas = ['On branch main'];
        if (!preparado.vazio) {
          linhas.push('Changes to be committed:');
          preparado.novos.forEach((f) => linhas.push(c.verde(`\tnew file:   ${f}`)));
          preparado.alterados.forEach((f) => linhas.push(c.verde(`\tmodified:   ${f}`)));
          preparado.removidos.forEach((f) => linhas.push(c.verde(`\tdeleted:    ${f}`)));
        }
        if (pendente.alterados.length) {
          linhas.push('Changes not staged for commit:');
          pendente.alterados.forEach((f) => linhas.push(c.vermelho(`\tmodified:   ${f}`)));
        }
        if (pendente.novos.length) {
          linhas.push('Untracked files:');
          pendente.novos.forEach((f) => linhas.push(c.vermelho(`\t${f}`)));
        }
        if (preparado.vazio && pendente.vazio) linhas.push('nothing to commit, working tree clean');
        return ok(linhas.join('\n'));
      }
      case 'add': {
        if (resto.length === 0) return falha('Nothing specified, nothing added.\nDica: use `git add .` para preparar tudo.');
        const tudo = resto.some((a) => a === '.' || a === '-A' || a === '--all');
        const alvos = resto.map((a) => this.caminho(a).replace(/\/$/, ''));
        const entra = (k: string) => tudo || alvos.some((a) => k === a || k.startsWith(a + '/'));
        if (!tudo) {
          const inexistente = alvos.find((a) => !Object.keys(files).some((k) => k === a || k.startsWith(a + '/')));
          if (inexistente) return falha(`fatal: pathspec '${inexistente}' did not match any files`, 128);
        }
        for (const [k, v] of Object.entries(files)) {
          if (entra(k) && (!ignorado(k, gitignore) || k in g.indice)) g.indice[k] = v;
        }
        for (const k of Object.keys(g.indice)) if (entra(k) && !(k in files)) delete g.indice[k];
        this.ctx.salvar(est);
        return ok();
      }
      case 'rm': {
        if (!resto.includes('--cached')) return falha('Neste sandbox use `git rm --cached <arquivo>` (tira do índice e mantém o arquivo no disco).');
        const alvo = this.caminho(resto.find((a) => !a.startsWith('-')) ?? '');
        if (!(alvo in g.indice)) return falha(`fatal: pathspec '${alvo}' did not match any files`, 128);
        delete g.indice[alvo];
        this.ctx.salvar(est);
        return ok(`rm '${alvo}'`);
      }
      case 'commit': {
        const i = resto.findIndex((a) => a === '-m' || a === '-am');
        const mensagem = i >= 0 ? resto[i + 1] : undefined;
        if (!mensagem) return falha('Informe a mensagem: git commit -m "descrição da mudança"');
        const d = diff(g.indice, head);
        if (d.vazio) return falha('On branch main\nnothing to commit (use "git add" para preparar as mudanças)');
        const novo: Commit = { hash: hash(), mensagem, arvore: { ...g.indice } };
        g.commits = [...g.commits, novo];
        this.ctx.salvar(est);
        const n = d.novos.length + d.alterados.length + d.removidos.length;
        return ok(`[main ${novo.hash}] ${mensagem}\n ${n} file${n > 1 ? 's' : ''} changed`);
      }
      case 'log':
        if (g.commits.length === 0) return falha("fatal: your current branch 'main' does not have any commits yet", 128);
        return ok([...g.commits].reverse().map((k) => `${c.amarelo(k.hash)} ${k.mensagem}`).join('\n'));
      case 'branch':
        return ok(g.commits.length ? `* ${c.verde('main')}` : '');
      case 'remote': {
        if (resto[0] === 'add') {
          if (!resto[2]) return falha('Uso: git remote add origin <url>');
          if (g.remoto) return falha(`error: remote ${resto[1]} already exists.`, 3);
          g.remoto = resto[2];
          this.ctx.salvar(est);
          return ok();
        }
        return ok(g.remoto ? `origin\t${g.remoto} (fetch)\norigin\t${g.remoto} (push)` : '');
      }
      case 'push': {
        if (!g.remoto) return falha("fatal: 'origin' does not appear to be a git repository\nDica: git remote add origin <url>", 128);
        if (g.commits.length === 0) return falha('error: src refspec main does not match any\nDica: faça um commit antes do push.');
        if (g.commits.length === g.enviados) return ok('Everything up-to-date');
        const segredo = Object.keys(head).find(ehSensivel);
        if (segredo) {
          return {
            codigo: 1,
            evento: 'SEGREDO_NO_PUSH',
            saida: c.vermelho(
              `remote: error: GH013: Repository rule violations found for refs/heads/main.\nremote: - PUSH BLOQUEADO: segredo detectado em '${segredo}'\n ! [remote rejected] main -> main (push declined due to secret scanning)\nerror: failed to push some refs to '${g.remoto}'`,
            ),
          };
        }
        const n = g.commits.length - g.enviados;
        g.enviados = g.commits.length;
        this.ctx.salvar(est);
        return ok(`Enumerating objects: done.\nWriting objects: 100% (${n} commit${n > 1 ? 's' : ''}), done.\nTo ${g.remoto}\n   ${c.verde('main -> main')}`);
      }
      default:
        return falha(`git: '${sub ?? ''}' não é suportado neste sandbox. Veja \`help\`.`);
    }
  }

  private npm(args: string[]): ResultadoShell {
    const files = this.ctx.ler();
    const [sub, ...resto] = args;
    if (sub === '-v' || sub === '--version') return ok('11.6.2');
    if (sub === 'init') {
      if (files['package.json']) return falha('package.json já existe neste projeto.');
      const pkg = { name: 'projeto', version: '1.0.0', main: 'index.js', scripts: { build: 'tsc' }, license: 'ISC' };
      this.ctx.escrever('package.json', JSON.stringify(pkg, null, 2) + '\n');
      return ok(`Wrote to /home/dev/projeto/package.json`);
    }
    if (!files['package.json']) return falha(c.vermelho('npm error code ENOENT\nnpm error enoent Could not read package.json') + '\nDica: rode `npm init -y` primeiro.', 254);
    let pkg: Record<string, Record<string, string>>;
    try {
      pkg = JSON.parse(files['package.json']);
    } catch {
      return falha(c.vermelho('npm error code EJSONPARSE — o package.json não é um JSON válido.'));
    }
    if (sub === 'install' || sub === 'i' || sub === 'add') {
      const dev = resto.some((a) => a === '-D' || a === '--save-dev');
      const nomes = resto.filter((a) => !a.startsWith('-'));
      const chave = dev ? 'devDependencies' : 'dependencies';
      for (const n of nomes) {
        const [nome] = n.startsWith('@') ? ['@' + n.slice(1).split('@')[0]] : [n.split('@')[0]];
        pkg[chave] = { ...(pkg[chave] ?? {}), [nome]: '^' + (VERSOES_NPM[nome] ?? '1.0.0') };
      }
      this.ctx.escrever('package.json', JSON.stringify(pkg, null, 2) + '\n');
      return ok(`\nadded ${Math.max(nomes.length, 1) * 7 + 3} packages, and audited ${Math.max(nomes.length, 1) * 7 + 4} packages in 2s\n\nfound ${c.verde('0')} vulnerabilities`);
    }
    if (sub === 'run') {
      const script = pkg.scripts?.[resto[0]];
      if (!script) return falha(c.vermelho(`npm error Missing script: "${resto[0]}"`));
      if (script.startsWith('tsc')) return this.tsc([]);
      return ok(`> ${script}\n${c.verde('✓ concluído')}`);
    }
    return falha('Uso: npm init -y | npm install <pacote> | npm run <script>');
  }

  private npx(args: string[]): ResultadoShell {
    if (args[0] === 'tsc') return this.tsc(args.slice(1));
    return falha(`npx: '${args[0] ?? ''}' não está disponível neste sandbox.`);
  }

  private tsc(args: string[]): ResultadoShell {
    const files = this.ctx.ler();
    const pkg = files['package.json'] ?? '';
    if (!/"typescript"/.test(pkg)) return falha(c.vermelho('This is not the tsc command you are looking for') + '\nDica: instale o compilador com `npm install -D typescript`.');
    if (args[0] === '--init') {
      this.ctx.escrever('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'commonjs', strict: true, outDir: 'dist' } }, null, 2) + '\n');
      return ok('Created a new tsconfig.json');
    }
    const fontes = Object.keys(files).filter((f) => /\.tsx?$/.test(f));
    if (fontes.length === 0) return falha(c.vermelho('error TS18003: No inputs were found.'), 2);
    return ok(c.verde(`✓ ${fontes.length} arquivo(s) TypeScript verificados — 0 erros`));
  }

  private docker(args: string[]): ResultadoShell {
    const est = this.ctx.estado();
    const d = est.docker;
    const files = this.ctx.ler();
    const [sub, ...resto] = args;
    const valor = (flag: string) => {
      const i = resto.indexOf(flag);
      return i >= 0 ? resto[i + 1] : undefined;
    };
    switch (sub) {
      case '--version':
      case '-v':
        return ok('Docker version 28.5.1, build e180ab8');
      case 'build': {
        const tag = valor('-t') ?? valor('--tag');
        if (!tag) return falha('Dê um nome à imagem: docker build -t usuario/app:1.0 .');
        const dockerfile = files['Dockerfile'];
        if (dockerfile === undefined) return falha(c.vermelho('ERROR: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory'));
        const passos = dockerfile.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
        if (!/^FROM\s+\S+/i.test(passos[0] ?? '')) return falha(c.vermelho('ERROR: failed to solve: no build stage in current context (o Dockerfile precisa começar com FROM)'));
        if (!d.imagens.includes(tag)) d.imagens = [...d.imagens, tag];
        this.ctx.salvar(est);
        return ok(
          [`[+] Building 3.2s (${passos.length}/${passos.length}) FINISHED`, ...passos.map((p, i) => c.cinza(` => [${i + 1}/${passos.length}] ${p}`)), ` => naming to docker.io/${tag}`, c.verde('Successfully built ' + hash())].join('\n'),
        );
      }
      case 'images':
        return ok(['REPOSITORY:TAG', ...d.imagens].join('\n'));
      case 'run': {
        const comValor = new Set(['-p', '-e', '--name', '-v', '--network', '--env', '--publish']);
        let imagem: string | undefined;
        for (let i = 0; i < resto.length; i++) {
          if (comValor.has(resto[i])) i++;
          else if (!resto[i].startsWith('-')) {
            imagem = resto[i];
            break;
          }
        }
        if (!imagem) return falha('Uso: docker run -d -p 8080:8080 --name app usuario/app:1.0');
        const publica = IMAGENS_PUBLICAS.includes(imagem.split(':')[0]);
        if (!d.imagens.includes(imagem) && !publica) return falha(c.vermelho(`Unable to find image '${imagem}' locally\ndocker: Error response from daemon: pull access denied for ${imagem}`), 125);
        const id = hash() + hash();
        d.containers = [...d.containers, { id, imagem, nome: valor('--name') ?? 'container_' + id.slice(0, 4), portas: valor('-p') ?? '' }];
        this.ctx.salvar(est);
        return ok((publica && !d.imagens.includes(imagem) ? c.cinza(`Unable to find image '${imagem}' locally\nlatest: Pulling from library/${imagem.split(':')[0]}\nStatus: Downloaded newer image\n`) : '') + id);
      }
      case 'ps':
        return ok(['CONTAINER ID   IMAGE   PORTS   NAMES', ...d.containers.map((k) => `${k.id.slice(0, 12)}   ${k.imagem}   ${k.portas}   ${k.nome}`)].join('\n'));
      case 'stop':
      case 'rm': {
        d.containers = d.containers.filter((k) => k.nome !== resto[0] && !k.id.startsWith(resto[0] ?? '-'));
        this.ctx.salvar(est);
        return ok(resto[0] ?? '');
      }
      case 'push': {
        const img = resto[0];
        if (!img || !d.imagens.includes(img)) return falha(c.vermelho(`An image does not exist locally with the tag: ${img ?? ''}`));
        if (!img.includes('/')) return falha(c.vermelho('denied: requested access to the resource is denied') + '\nDica: no Docker Hub a imagem precisa do namespace: usuario/app:tag.');
        return ok(`The push refers to repository [docker.io/${img.split(':')[0]}]\n${c.verde('latest: digest: sha256:' + hash() + hash() + ' pushed')}`);
      }
      default:
        return falha(`docker: '${sub ?? ''}' não é suportado neste sandbox. Veja \`help\`.`);
    }
  }

  private kubectl(args: string[]): ResultadoShell {
    const est = this.ctx.estado();
    const files = this.ctx.ler();
    if (args[0] === 'apply') {
      const arq = this.caminho(args[args.indexOf('-f') + 1] ?? '');
      const yaml = files[arq];
      if (args.indexOf('-f') < 0 || yaml === undefined) return falha(c.vermelho(`error: the path "${arq}" does not exist`));
      const recursos = [...yaml.matchAll(/^kind:\s*(\w+)[\s\S]*?^\s+name:\s*([\w-]+)/gm)].map((m) => `${m[1].toLowerCase()}/${m[2]}`);
      if (recursos.length === 0) return falha(c.vermelho('error: no objects passed to apply (faltam `kind:` e `metadata.name`)'));
      est.k8s = [...new Set([...est.k8s, ...recursos])];
      this.ctx.salvar(est);
      return ok(recursos.map((r) => `${r} ${c.verde('created')}`).join('\n'));
    }
    if (args[0] === 'get') {
      const tipo = (args[1] ?? '').replace(/s$/, '');
      if (tipo === 'pod') {
        const deps = est.k8s.filter((r) => r.startsWith('deployment/'));
        return ok(['NAME   READY   STATUS', ...deps.flatMap((dep) => [1, 2].map((i) => `${dep.split('/')[1]}-${hash().slice(0, 5)}-${i}   1/1   ${c.verde('Running')}`))].join('\n'));
      }
      return ok(['NAME', ...est.k8s.filter((r) => !tipo || tipo === 'all' || r.startsWith(tipo))].join('\n'));
    }
    return falha('Uso: kubectl apply -f <arquivo.yaml> | kubectl get pods');
  }

  private mongosh(cmd: string): ResultadoShell {
    try {
      return ok(formatarMongo(this.ctx.mongo().executar(cmd, true) ?? ''));
    } catch (e) {
      return falha(c.vermelho((e as Error).message));
    }
  }
}
