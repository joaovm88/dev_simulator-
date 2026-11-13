'use client';

import { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import { useJogo } from '@/game/state/store';
import { Shell, estadoInicialShell } from '@/game/shell/shell';
import { executarPython } from '@/game/runtime/pythonBrowser';
import { bancosDa } from '@/game/runtime/bancos';
import { aoPedirComando } from '@/game/runtime/bus';

const PROMPT = '\x1b[32mdev@nexustech\x1b[0m:\x1b[34m~/projeto\x1b[0m$ ';

export function TerminalPane({ visivel }: { visivel: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const ajuste = useRef<FitAddon | null>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    let descartado = false;
    let limpar = () => {};

    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import('@xterm/xterm'), import('@xterm/addon-fit')]);
      if (descartado || !caixa.current) return;

      const term = new Terminal({
        fontSize: 13,
        fontFamily: "ui-monospace, 'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace",
        cursorBlink: true,
        convertEol: true,
        theme: { background: '#0a0e13', foreground: '#d7dee8', cursor: '#3ddc84', selectionBackground: '#1f4a35' },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(caixa.current);
      ajuste.current = fit;
      termRef.current = term;
      const ajustar = () => {
        if (caixa.current && caixa.current.offsetWidth > 0) fit.fit();
      };
      ajustar();
      const observador = new ResizeObserver(ajustar);
      observador.observe(caixa.current);

      const jogo = useJogo.getState;
      const shell = new Shell({
        ler: () => jogo().arquivos[jogo().questAtivaId ?? ''] ?? {},
        escrever: (c, v) => jogo().editarArquivo(c, v),
        apagar: (c) => jogo().apagarArquivo(c),
        estado: () => structuredClone(jogo().shell[jogo().questAtivaId ?? ''] ?? estadoInicialShell()),
        salvar: (e) => jogo().salvarShell(e),
        python: executarPython,
        mongo: () => bancosDa(jogo().questAtivaId ?? '_').mongo,
      });

      let linha = '';
      let ocupado = false;
      const historico: string[] = [];
      let pos = 0;

      const trocarLinha = (nova: string) => {
        term.write('\b \b'.repeat(linha.length) + nova);
        linha = nova;
      };

      const rodar = async (comando: string) => {
        const cmd = comando.trim();
        term.write('\r\n');
        if (cmd) {
          historico.push(cmd);
          pos = historico.length;
          if (!jogo().questAtivaId && !/^(help|clear|cls)$/.test(cmd)) {
            term.writeln('\x1b[33mNenhum projeto aberto. Aceite uma missão na caixa de entrada primeiro.\x1b[0m');
          } else {
            ocupado = true;
            try {
              const r = await shell.executar(cmd);
              if (r.limpar) term.clear();
              else if (r.saida) term.writeln(r.saida);
              if (/^(db\.|use\s)/.test(cmd)) useJogo.setState((s) => ({ dadosVersao: s.dadosVersao + 1 }));
              jogo().registrarComandos(r.sucedidos, r.evento);
            } catch (e) {
              term.writeln(`\x1b[31m${(e as Error).message}\x1b[0m`);
            } finally {
              ocupado = false;
            }
          }
        }
        linha = '';
        term.write(PROMPT);
      };

      term.writeln('\x1b[32mdev_OS shell\x1b[0m — digite \x1b[36mhelp\x1b[0m para ver os comandos disponíveis.');
      term.write(PROMPT);

      const entrada = term.onData((dados) => {
        if (ocupado) return;
        switch (dados) {
          case '\r':
            void rodar(linha);
            return;
          case '\x7f':
            if (linha) trocarLinha(linha.slice(0, -1));
            return;
          case '\x03':
            term.write('^C\r\n' + PROMPT);
            linha = '';
            return;
          case '\x0c':
            term.clear();
            return;
          case '\x1b[A':
            if (pos > 0) trocarLinha(historico[--pos]);
            return;
          case '\x1b[B':
            if (pos < historico.length) trocarLinha(historico[++pos] ?? '');
            return;
        }
        if (dados.startsWith('\x1b')) return;
        // Texto digitado ou colado (apenas a primeira linha).
        const texto = dados.split(/[\r\n]/)[0].replace(/[\x00-\x1f]/g, '');
        linha += texto;
        term.write(texto);
      });

      const sairDoBus = aoPedirComando((comando) => {
        if (ocupado) return;
        trocarLinha(comando);
        void rodar(comando);
      });

      limpar = () => {
        sairDoBus();
        entrada.dispose();
        observador.disconnect();
        term.dispose();
      };
    })();

    return () => {
      descartado = true;
      limpar();
    };
  }, []);

  useEffect(() => {
    if (!visivel) return;
    ajuste.current?.fit();
    termRef.current?.focus();
  }, [visivel]);

  return <div ref={caixa} data-testid="terminal" className="h-full w-full px-2 pt-1" onClick={() => termRef.current?.focus()} />;
}
