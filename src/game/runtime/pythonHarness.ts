// Harness Python carregado uma vez no Pyodide (navegador ou Node, nos testes).
// Expõe `_executar(payload_json) -> json`, usado tanto pelo `python arquivo.py`
// do terminal quanto pelo Test Runner das missões.

export interface PayloadPython {
  modo: 'script' | 'testes';
  /** Arquivos do workspace do jogador: caminho -> conteúdo. */
  files: Record<string, string>;
  /** Pacotes "instalados" via pip (stubs): caminho -> conteúdo. */
  pacotes: Record<string, string>;
  arquivo: string;
  testes?: (
    | { tipo: 'caso'; nome: string; funcao: string; input: unknown[]; esperado: unknown }
    | { tipo: 'codigo'; nome: string; codigo: string }
  )[];
}

export interface ErroPython {
  tipo: string;
  mensagem: string;
  arquivo: string | null;
  linha: number | null;
}

export interface RespostaPython {
  saida?: string;
  erro?: ErroPython | null;
  testes?: { nome: string; ok: boolean; saida: string; erro?: ErroPython }[];
}

export type ExecutorPython = (payload: PayloadPython) => Promise<RespostaPython>;

export const PYTHON_HARNESS = String.raw`
import sys, os, io, json, shutil, traceback, importlib, importlib.util, builtins, runpy

_WS = '/ws'
_SITE = '/ws_site'

def _input_bloqueado(prompt=''):
    raise EOFError('input() interativo não está disponível no sandbox do dev_OS. '
                   'Receba os valores como parâmetros de função.')

def _do_workspace(m):
    arq = getattr(m, '__file__', None) or ''
    if arq.startswith(_WS):
        return True
    try:
        return any(str(p).startswith(_WS) for p in getattr(m, '__path__', []))
    except Exception:
        return False

def _gravar(base, arquivos):
    for caminho, conteudo in arquivos.items():
        destino = os.path.join(base, caminho)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'w', encoding='utf-8') as f:
            f.write(conteudo)

def _preparar(files, pacotes):
    os.chdir('/')
    for d in (_WS, _SITE):
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d)
    _gravar(_WS, files)
    _gravar(_SITE, pacotes)
    for nome in list(sys.modules):
        if _do_workspace(sys.modules[nome]):
            del sys.modules[nome]
    sys.path[:] = [p for p in sys.path if not p.startswith(_WS)]
    sys.path[0:0] = [_WS, _WS + '/src', _SITE]
    os.chdir(_WS)
    importlib.invalidate_caches()
    builtins.input = _input_bloqueado

def _erro(e):
    arquivo, linha = None, None
    mensagem = str(e)
    if isinstance(e, SyntaxError) and (e.filename or '').startswith(_WS + '/'):
        arquivo, linha, mensagem = e.filename, e.lineno, e.msg
    else:
        for fr in reversed(traceback.extract_tb(e.__traceback__)):
            if fr.filename.startswith(_WS + '/'):
                arquivo, linha = fr.filename, fr.lineno
                break
    if arquivo:
        arquivo = arquivo[len(_WS) + 1:]
    return {'tipo': type(e).__name__, 'mensagem': mensagem, 'arquivo': arquivo, 'linha': linha}

def carregar(caminho):
    """Importa um arquivo do workspace do jogador como módulo."""
    completo = os.path.join(_WS, caminho)
    if not os.path.exists(completo):
        raise AssertionError('O arquivo ' + caminho + ' não existe no projeto.')
    nome = '_devos_' + caminho.replace('/', '_').replace('.', '_')
    spec = importlib.util.spec_from_file_location(nome, completo)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[nome] = mod
    spec.loader.exec_module(mod)
    return mod

def _norm(v):
    if isinstance(v, (tuple, list)):
        return [_norm(x) for x in v]
    if isinstance(v, dict):
        return {k: _norm(x) for k, x in v.items()}
    return v

def _executar(payload_json):
    p = json.loads(payload_json)
    files, pacotes = p['files'], p.get('pacotes', {})
    saida_original = sys.stdout, sys.stderr

    if p['modo'] == 'script':
        _preparar(files, pacotes)
        buf = io.StringIO()
        sys.stdout = sys.stderr = buf
        erro = None
        try:
            runpy.run_path(os.path.join(_WS, p['arquivo']), run_name='__main__')
        except SystemExit:
            pass
        except BaseException as e:
            erro = _erro(e)
        finally:
            sys.stdout, sys.stderr = saida_original
        return json.dumps({'saida': buf.getvalue(), 'erro': erro})

    resultados = []
    for t in p['testes']:
        _preparar(files, pacotes)
        buf = io.StringIO()
        sys.stdout = sys.stderr = buf
        r = {'nome': t['nome'], 'ok': False}
        try:
            if t['tipo'] == 'caso':
                mod = carregar(p['arquivo'])
                fn = getattr(mod, t['funcao'], None)
                if fn is None:
                    raise AssertionError('A função ' + t['funcao'] + ' não foi encontrada em ' + p['arquivo'] + '.')
                obtido = fn(*t['input'])
                if _norm(obtido) != t['esperado']:
                    raise AssertionError('Esperado ' + repr(t['esperado']) + ', mas a função retornou ' + repr(obtido) + '.')
            else:
                ns = {'carregar': carregar, '__name__': '__teste__'}
                exec(compile(t['codigo'], '<teste>', 'exec'), ns)
            r['ok'] = True
        except BaseException as e:
            r['erro'] = _erro(e)
        finally:
            sys.stdout, sys.stderr = saida_original
        r['saida'] = buf.getvalue()[-1500:]
        resultados.append(r)
    return json.dumps({'testes': resultados})
`;
