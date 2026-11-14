'use client';

import { useEffect, useRef } from 'react';
import Editor, { loader, type Monaco, type OnMount } from '@monaco-editor/react';
import { etapaAtual, useJogo } from '@/game/state/store';
import { pedirComando } from '@/game/runtime/bus';
import { executavel, linguagemDe } from './ui';
import { ClozePane } from './ClozePane';
import { lacunasDa } from '@/game/lacunas';
import { GLOSSARIO, explicar } from '@/game/glossario';
import { BONUS_MODO_LIVRE } from '@/game/state/store';

let lenteRegistrada = false;

// Monaco servido de /public (copiado no postinstall), sem CDN.
loader.config({ paths: { vs: '/monaco/vs' } });

function configurarMonaco(monaco: Monaco) {
  monaco.editor.defineTheme('devos', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0a0e13',
      'editor.lineHighlightBackground': '#10151c',
      'editorLineNumber.foreground': '#3b4656',
      'editorLineNumber.activeForeground': '#8391a5',
      'editorCursor.foreground': '#3ddc84',
      'editor.selectionBackground': '#1f4a35',
    },
  });
  // Lente de sintaxe: passar o mouse sobre uma palavra-chave explica o que ela faz.
  if (!lenteRegistrada) {
    lenteRegistrada = true;
    for (const linguagem of Object.keys(GLOSSARIO)) {
      monaco.languages.registerHoverProvider(linguagem, {
        provideHover(modelo: { getLineContent(n: number): string }, posicao: { lineNumber: number; column: number }) {
          const e = explicar(linguagem, modelo.getLineContent(posicao.lineNumber), posicao.column);
          return e ? { contents: [{ value: `**\`${e.termo}\`** · dev_IA` }, { value: e.texto }] } : null;
        },
      });
    }
  }
  // Os arquivos .ts/.tsx das missões não têm node_modules: desliga a checagem
  // semântica para não sublinhar imports de "react" em vermelho.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ts = (monaco as any).typescript ?? (monaco.languages as any).typescript;
    ts?.typescriptDefaults?.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
    ts?.javascriptDefaults?.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
  } catch {
    /* API ausente nesta versão do Monaco: segue sem o ajuste */
  }
}

export function EditorPane() {
  const questAtivaId = useJogo((s) => s.questAtivaId);
  const abas = useJogo((s) => s.abas);
  const arquivoAtivo = useJogo((s) => s.arquivoAtivo);
  const conteudo = useJogo((s) => (s.questAtivaId && s.arquivoAtivo ? s.arquivos[s.questAtivaId]?.[s.arquivoAtivo] : undefined));
  const resultado = useJogo((s) => s.resultado);
  const validando = useJogo((s) => s.validando);
  const atual = useJogo(etapaAtualEstavel);
  const modelo = useJogo((s) => {
    const a = etapaAtual(s);
    return (a && !a.progresso.modoLivre && lacunasDa(a.etapa).find((l) => l.arquivo === s.arquivoAtivo)) || null;
  });
  const guiavel = useJogo((s) => {
    const a = etapaAtual(s);
    return !!a && lacunasDa(a.etapa).some((l) => l.arquivo === s.arquivoAtivo);
  });
  const alternarModoLivre = useJogo((s) => s.alternarModoLivre);
  const { abrirArquivo, fecharAba, editarArquivo, validar, executarArquivoDeDados, setAbaInferior } = useJogo.getState();
  const refs = useRef<{ editor: Parameters<OnMount>[0]; monaco: Monaco } | null>(null);

  // Marca no editor a linha apontada pelo Test Runner.
  useEffect(() => {
    const r = refs.current;
    const modelo = r?.editor.getModel();
    if (!r || !modelo) return;
    const marcadores = (resultado?.testes ?? [])
      .filter((t) => !t.ok && t.linha && t.arquivo === arquivoAtivo)
      .map((t) => ({
        severity: r.monaco.MarkerSeverity.Error,
        message: `${t.nome}\n${t.detalhe ?? ''}`,
        startLineNumber: t.linha!,
        endLineNumber: t.linha!,
        startColumn: 1,
        endColumn: modelo.getLineMaxColumn(Math.min(t.linha!, modelo.getLineCount())),
      }));
    r.monaco.editor.setModelMarkers(modelo, 'devos', marcadores);
  }, [resultado, arquivoAtivo, conteudo === undefined]);

  if (!questAtivaId || !arquivoAtivo || conteudo === undefined) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-fundo text-suave">
        <div className="font-mono text-2xl text-borda">{'{ }'}</div>
        <p>{questAtivaId ? 'Selecione um arquivo no Explorer.' : 'Aceite uma missão na caixa de entrada para abrir o projeto.'}</p>
      </div>
    );
  }

  const podeValidar = atual !== null && /^(IMPLEMENTACAO|VALIDACAO)/.test(atual);
  const executar = () => {
    if (arquivoAtivo.endsWith('.py')) {
      setAbaInferior('terminal');
      pedirComando(`python ${arquivoAtivo}`);
    } else void executarArquivoDeDados(arquivoAtivo);
  };

  return (
    <div className="flex h-full flex-col bg-fundo">
      <div className="flex shrink-0 items-stretch border-b border-borda bg-painel">
        <div role="tablist" className="flex min-w-0 flex-1 overflow-x-auto">
          {abas.map((a) => (
            <div key={a} className={`group flex shrink-0 items-center border-r border-borda ${a === arquivoAtivo ? 'bg-fundo text-white' : 'text-suave hover:text-texto'}`}>
              <button role="tab" aria-selected={a === arquivoAtivo} title={a} onClick={() => abrirArquivo(a)} className="py-1.5 pl-3 pr-1 font-mono text-[12px]">
                {a.split('/').pop()}
              </button>
              <button aria-label={`Fechar ${a}`} onClick={() => fecharAba(a)} className="pr-2 text-suave opacity-0 hover:text-white group-hover:opacity-100 focus:opacity-100">
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 px-2">
          {guiavel && (
            <button onClick={alternarModoLivre} title={modelo ? `Dispensar as lacunas e escrever o código inteiro: +${BONUS_MODO_LIVRE} XP` : 'Voltar ao código com lacunas'} className="rounded border border-ambar/50 px-2.5 py-1 text-[12px] text-ambar hover:bg-ambar/10">
              {modelo ? `✍ Escrever do zero (+${BONUS_MODO_LIVRE} XP)` : '🧩 Modo guiado'}
            </button>
          )}
          {executavel(arquivoAtivo) && !modelo && (
            <button onClick={executar} title="Executa o arquivo aberto" className="rounded border border-borda px-2.5 py-1 text-[12px] text-texto hover:bg-realce">
              ▶ Executar
            </button>
          )}
          <button
            onClick={() => void validar()}
            disabled={!podeValidar || validando}
            title="Ctrl+Enter"
            className="rounded bg-verde px-3 py-1 text-[12px] font-semibold text-black hover:brightness-110 disabled:bg-realce disabled:text-suave"
          >
            {validando ? 'Validando…' : '✓ Rodar testes'}
          </button>
        </div>
      </div>
      <div className="px-3 py-1 font-mono text-[11px] text-suave">{arquivoAtivo.split('/').join(' › ')}</div>
      <div className="min-h-0 flex-1">
        {modelo ? (
          <ClozePane modelo={modelo} />
        ) : (
        <Editor
          theme="devos"
          path={`${questAtivaId}/${arquivoAtivo}`}
          language={linguagemDe(arquivoAtivo)}
          value={conteudo}
          onChange={(v) => editarArquivo(arquivoAtivo, v ?? '')}
          beforeMount={configurarMonaco}
          onMount={(editor, monaco) => {
            refs.current = { editor, monaco };
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void useJogo.getState().validar());
          }}
          loading={<span className="font-mono text-suave">carregando editor…</span>}
          options={{
            fontSize: 13,
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: /\.(py|java)$/.test(arquivoAtivo) ? 4 : 2,
            insertSpaces: true,
            renderLineHighlight: 'line',
            padding: { top: 6 },
            wordWrap: /\.(md|json)$/.test(arquivoAtivo) ? 'on' : 'off',
          }}
        />
        )}
      </div>
    </div>
  );
}

/** Seletor que devolve um valor primitivo (evita re-render a cada tecla). */
const etapaAtualEstavel = (s: Parameters<typeof etapaAtual>[0]) => etapaAtual(s)?.etapa.tipo ?? null;
