'use client';

import { useJogo } from '@/game/state/store';
import { ehSensivel, ignorado } from '@/game/shell/shell';

const Arquivo = ({ nome, cor, selo }: { nome: string; cor: string; selo?: string }) => (
  <li className={`flex items-center justify-between gap-2 rounded border px-2 py-0.5 font-mono text-[11.5px] ${cor}`}>
    <span className="truncate">{nome}</span>
    {selo && <span className="shrink-0 text-[10px]">{selo}</span>}
  </li>
);

const Coluna = ({ titulo, sub, children, vazio }: { titulo: string; sub: string; children: React.ReactNode; vazio?: string }) => (
  <section className="flex min-w-0 flex-1 flex-col rounded-md border border-borda bg-painel">
    <header className="border-b border-borda px-2.5 py-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-texto">{titulo}</div>
      <div className="font-mono text-[10.5px] text-suave">{sub}</div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto p-2">{children || <p className="text-[11.5px] text-suave">{vazio}</p>}</div>
  </section>
);

/** As quatro áreas do Git e o grafo de commits, atualizados a cada comando do terminal. */
export function GitPanel() {
  const questId = useJogo((s) => s.questAtivaId);
  const arquivos = useJogo((s) => (s.questAtivaId ? s.arquivos[s.questAtivaId] : undefined));
  const git = useJogo((s) => (s.questAtivaId ? s.shell[s.questAtivaId]?.git : undefined));

  if (!questId || !arquivos || !git) return <p className="p-3 text-suave">Abra uma missão para ver o repositório.</p>;
  if (!git.iniciado) {
    return (
      <div className="p-4 text-[12.5px] leading-relaxed text-suave">
        Esta pasta ainda não é um repositório Git. Rode <code className="inline">git init</code> no terminal para começar a versionar — este painel passa a mostrar para onde cada arquivo vai a cada comando.
      </div>
    );
  }

  const gitignore = arquivos['.gitignore'];
  const head = git.commits[git.commits.length - 1]?.arvore ?? {};
  const noDisco = Object.keys(arquivos).sort();
  const pendentes = noDisco.filter((f) => !(f in git.indice) ? !ignorado(f, gitignore) : git.indice[f] !== arquivos[f]);
  const ignorados = noDisco.filter((f) => !(f in git.indice) && ignorado(f, gitignore));
  const preparados = [...new Set([...Object.keys(git.indice), ...Object.keys(head)])].filter((f) => git.indice[f] !== head[f]).sort();
  const segredoPreparado = Object.keys(git.indice).filter(ehSensivel);
  const seta = <div className="flex shrink-0 items-center text-[18px] text-borda">→</div>;

  return (
    <div className="flex h-full flex-col gap-2 p-2.5" data-testid="git-panel">
      {segredoPreparado.length > 0 && (
        <div className="shrink-0 rounded border border-vermelho/50 bg-vermelho/10 px-2.5 py-1.5 text-[12px] text-vermelho">
          ⚠ <span className="font-mono">{segredoPreparado.join(', ')}</span> está sendo rastreado pelo Git. Credenciais não podem ir para o repositório: <span className="font-mono">.gitignore</span> + <span className="font-mono">git rm --cached</span>.
        </div>
      )}
      <div className="flex min-h-0 flex-1 gap-1.5">
        <Coluna titulo="Working directory" sub="seus arquivos no disco" vazio="Nada a adicionar: tudo igual ao staging.">
          {(pendentes.length > 0 || ignorados.length > 0) && (
            <ul className="space-y-1">
              {pendentes.map((f) => (
                <Arquivo key={f} nome={f} cor={ehSensivel(f) ? 'border-vermelho/50 text-vermelho' : 'border-ambar/40 text-ambar'} selo={f in git.indice ? 'modificado' : ehSensivel(f) ? '⚠ segredo' : 'novo'} />
              ))}
              {ignorados.map((f) => (
                <Arquivo key={f} nome={f} cor="border-borda text-suave" selo="ignorado" />
              ))}
            </ul>
          )}
        </Coluna>
        {seta}
        <Coluna titulo="Staging area" sub="git add" vazio="Vazio. Use git add para preparar o próximo commit.">
          {preparados.length > 0 && (
            <ul className="space-y-1">
              {preparados.map((f) => (
                <Arquivo key={f} nome={f} cor={ehSensivel(f) ? 'border-vermelho/50 text-vermelho' : 'border-verde/40 text-verde'} selo={!(f in git.indice) ? 'removido' : f in head ? 'alterado' : 'novo'} />
              ))}
            </ul>
          )}
        </Coluna>
        {seta}
        <Coluna titulo="Repositório local" sub="git commit · branch main" vazio="Nenhum commit ainda.">
          {git.commits.length > 0 && (
            <ol className="relative ml-2 border-l-2 border-borda">
              {[...git.commits].reverse().map((c, i) => {
                const indice = git.commits.length - 1 - i;
                const enviado = indice < git.enviados;
                return (
                  <li key={c.hash} className="relative pb-2.5 pl-4">
                    <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 ${enviado ? 'border-azul bg-azul' : 'border-verde bg-fundo'}`} />
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11.5px]">
                      <span className="text-ambar">{c.hash}</span>
                      {i === 0 && <span className="rounded bg-verde/20 px-1 text-[10px] text-verde">HEAD → main</span>}
                      {indice === git.enviados - 1 && <span className="rounded bg-azul/20 px-1 text-[10px] text-azul">origin/main</span>}
                    </div>
                    <div className="text-[12px] text-texto">{c.mensagem}</div>
                    <div className="text-[10.5px] text-suave">
                      {Object.keys(c.arvore).length} arquivo(s){Object.keys(c.arvore).some(ehSensivel) && <span className="text-vermelho"> · contém segredo</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Coluna>
        {seta}
        <Coluna titulo="Remoto (GitHub)" sub={git.remoto ? git.remoto.replace('https://', '') : 'git remote add origin <url>'} vazio={git.remoto ? 'Nada enviado ainda. Use git push.' : 'Nenhum remoto configurado.'}>
          {git.enviados > 0 && (
            <div className="text-[12px] text-texto">
              <div className="font-mono text-[20px] font-semibold text-azul">{git.enviados}</div>
              commit(s) publicados em <span className="font-mono text-azul">origin/main</span>
              {git.commits.length > git.enviados && <div className="mt-1.5 text-ambar">{git.commits.length - git.enviados} commit(s) local(is) aguardando push</div>}
            </div>
          )}
        </Coluna>
      </div>
    </div>
  );
}
