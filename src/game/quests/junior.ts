import type { Quest } from '../types';

const py = String.raw;
const TECH_LEAD = 'marcos.silva@nexustech.dev (Tech Lead)';

export const JUNIOR: Quest[] = [
  {
    _id: 'quest_jr_01_bitmed_triagem',
    codigo: 'Jr 01',
    titulo: 'Setup & Triagem Hospitalar',
    nivelCarreira: 'JUNIOR',
    ordemTrilha: 1,
    recompensaXP: 50,
    conceitos: ['PVM e bytecode', 'PATH', 'Tipos básicos', 'if / elif / else', 'for e range'],
    email: {
      remetente: TECH_LEAD,
      assunto: '[Onboarding #01] Automação da Triagem - Clínica BitMed',
      corpo:
        'Bem-vindo à NexusTech! Nosso cliente, a Clínica BitMed, precisa de uma função em Python que receba a idade do paciente e se há suspeita de doença infectocontagiosa (True/False).\n\nPacientes com 65 anos ou mais têm prioridade. Se houver suspeita infectocontagiosa, devem ir para a "Sala Amarela"; caso contrário, "Sala Branca".\n\nA dev_IA, nossa mentora de pair programming, vai te acompanhar no painel à direita. Antes de codar, confirme que o seu ambiente Python está funcionando.\n\nAbs,\nMarcos',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'src/triagem.py',
        linguagem: 'python',
        conteudo: py`def classificar_paciente(idade: int, suspeita_infecto: bool) -> str:
    # TODO: Implemente a lógica de decisão abaixo
    pass


def contar_prioritarios(idades: list) -> int:
    # TODO: percorra a lista e conte quantos pacientes têm 65 anos ou mais
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Como o Python executa o seu código',
        mensagemIA:
          'Oi! Eu sou a dev_IA. Antes de abrir o editor, quero que você entenda o que acontece quando roda `python triagem.py`. Qual destas descrições é a correta?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'O código-fonte é compilado para bytecode (.pyc) e esse bytecode é interpretado pela PVM (Python Virtual Machine).',
            correta: true,
            feedbackIA:
              'Isso! O Python é híbrido: compila para bytecode e a PVM interpreta. É por isso que o mesmo .py roda em Windows, Linux e Mac — basta ter a PVM instalada.',
          },
          {
            id: 'opt_b',
            texto: 'O código é compilado direto para código de máquina, gerando um executável nativo como em C.',
            correta: false,
            feedbackIA:
              'Esse é o modelo de linguagens compiladas como C. O Python não gera executável nativo: ele gera um bytecode intermediário que precisa da PVM para rodar.',
          },
          {
            id: 'opt_c',
            texto: 'Cada linha é lida e executada como texto puro, sem nenhuma etapa de compilação.',
            correta: false,
            feedbackIA:
              'Quase: existe sim uma etapa de compilação, só que para bytecode (os arquivos .pyc dentro de __pycache__). Quem interpreta esse bytecode é a PVM.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Verificar a instalação',
        mensagemIA:
          'Agora vá ao **Terminal** (painel de baixo) e confirme que o Python responde: `python --version`.\n\nNa sua máquina real, se esse comando falhar com “python não é reconhecido”, quase sempre é porque a opção **Add Python to PATH** não foi marcada no instalador: o PATH é a lista de pastas onde o sistema procura executáveis.',
        comandos: [{ padrao: '^(python|python3|py) (--version|-V)$', descricao: 'python --version' }],
        dicas: ['Clique no terminal, digite `python --version` e pressione Enter.'],
      },
      {
        ordem: 3,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Estrutura de decisão',
        mensagemIA:
          'Antes de escrevermos o código em `src/triagem.py`, precisamos avaliar duas condições ao mesmo tempo: a idade do paciente E a suspeita de doença. Qual estrutura condicional do Python é a mais limpa para múltiplos cenários mutuamente exclusivos?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Utilizar estruturas encadeadas com if, elif e else.',
            correta: true,
            feedbackIA: 'Perfeito! O uso de `if / elif / else` evita verificações desnecessárias assim que a primeira condição verdadeira é atendida.',
          },
          {
            id: 'opt_b',
            texto: 'Utilizar um laço de repetição infinito while True.',
            correta: false,
            feedbackIA:
              'Cuidado! Um laço `while` serve para repetir instruções enquanto uma condição for verdadeira. Para tomada de decisão única, precisamos de desvio condicional (`if/elif/else`).',
          },
          {
            id: 'opt_c',
            texto: 'Escrever quatro blocos if independentes, um para cada combinação.',
            correta: false,
            feedbackIA:
              'Funciona, mas o Python testaria as quatro condições sempre, mesmo depois de achar a certa — e fica fácil duas delas ficarem verdadeiras por engano. Com `elif`, os cenários são mutuamente exclusivos.',
          },
        ],
      },
      {
        ordem: 4,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Entrada de dados e tipos',
        mensagemIA:
          'Uma pegadinha clássica do primeiro dia. Na recepção, a idade será lida com `idade = input("Idade: ")` e depois comparada com `idade >= 65`. O que acontece?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Funciona normalmente: o Python converte o texto para número sozinho.',
            correta: false,
            feedbackIA: 'O Python é fortemente tipado: ele não converte `str` em `int` por conta própria. Essa comparação lança um `TypeError`.',
          },
          {
            id: 'opt_b',
            texto: 'Dá TypeError: input() sempre devolve str; é preciso converter com int(input(...)).',
            correta: true,
            feedbackIA:
              'Exato. `input()` sempre devolve `str`. Use `int()` para idades e `float()` para valores com casas decimais. Por isso nossa função já recebe `idade: int` pronta.',
          },
          {
            id: 'opt_c',
            texto: 'A comparação é feita em ordem alfabética e devolve False.',
            correta: false,
            feedbackIA: 'Comparar `str` com `int` nem chega a acontecer: o Python 3 lança `TypeError`. A saída é converter antes: `int(input(...))`.',
          },
        ],
      },
      {
        ordem: 5,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Implementar a triagem',
        arquivo: 'src/triagem.py',
        funcaoAlvo: 'classificar_paciente',
        mensagemIA:
          'Agora implemente `classificar_paciente(idade, suspeita_infecto)` no editor. O retorno é um texto no formato `"<Sala> - <Fila>"`:\n\n• Sala: `Sala Amarela` (com suspeita) ou `Sala Branca` (sem)\n• Fila: `Prioridade` (65 anos ou mais) ou `Comum`\n\nLembre-se dos dois pontos (`:`) após cada condição e da indentação de 4 espaços! Quando terminar, clique em **Rodar testes**.',
        casosDeTeste: [
          { input: [70, true], outputEsperado: 'Sala Amarela - Prioridade' },
          { input: [70, false], outputEsperado: 'Sala Branca - Prioridade' },
          { input: [30, true], outputEsperado: 'Sala Amarela - Comum' },
          { input: [30, false], outputEsperado: 'Sala Branca - Comum' },
          { input: [65, false], outputEsperado: 'Sala Branca - Prioridade' },
          { input: [64, true], outputEsperado: 'Sala Amarela - Comum' },
        ],
        dicas: [
          'Combine as condições com `and`: `if idade >= 65 and suspeita_infecto:`.',
          'Atenção ao limite: 65 anos já é prioridade, então use `>=` e não `>`.',
          'Esqueleto:\nif idade >= 65 and suspeita_infecto:\n    return "Sala Amarela - Prioridade"\nelif idade >= 65:\n    return "Sala Branca - Prioridade"\nelif suspeita_infecto:\n    ...\nelse:\n    ...',
        ],
      },
      {
        ordem: 6,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Laço de repetição',
        arquivo: 'src/triagem.py',
        funcaoAlvo: 'contar_prioritarios',
        mensagemIA:
          'A recepção quer saber quantos pacientes prioritários há na fila. Implemente `contar_prioritarios(idades)`: receba uma lista de idades e devolva quantas são 65 ou mais.\n\nAqui sim cabe um laço: use `for idade in idades:` com um contador.',
        casosDeTeste: [
          { input: [[70, 30, 65, 12]], outputEsperado: 2 },
          { input: [[]], outputEsperado: 0 },
          { input: [[64, 64]], outputEsperado: 0 },
          { input: [[90, 80, 70]], outputEsperado: 3 },
        ],
        dicas: [
          'Comece com `total = 0` antes do laço e faça `return total` depois dele (fora do bloco do `for`).',
          'for idade in idades:\n    if idade >= 65:\n        total += 1',
        ],
      },
    ],
  },

  {
    _id: 'quest_jr_02_inventario_acesso',
    codigo: 'Jr 02',
    titulo: 'Inventário & Controle de Acesso',
    nivelCarreira: 'JUNIOR',
    ordemTrilha: 2,
    recompensaXP: 60,
    conceitos: ['Listas', 'Dicionários O(1)', 'Tuplas', 'Funções (def)', 'Módulos e import'],
    email: {
      remetente: 'paula.reis@nexustech.dev (Infraestrutura)',
      assunto: '[Infra] Inventário de ativos e bug de logins duplicados',
      corpo:
        'Olá! Aqui é a Paula, da Infra.\n\nPrecisamos de um script para cadastrar os ativos de rede e calcular a depreciação dos equipamentos.\n\nTambém temos um bug chato no controle de acesso: quando duas pessoas escolhem o mesmo login, o cadastro da segunda sobrescreve o da primeira. Isso não pode acontecer.\n\nO Marcos pediu para as contas reutilizáveis ficarem em um módulo separado (`Funcoes.py`).\n\nObrigada!',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'src/Funcoes.py',
        linguagem: 'python',
        conteudo: py`# Módulo de funções reutilizáveis do inventário.


def calcular_depreciacao(valor: float, anos: int, taxa: float) -> float:
    # TODO: o equipamento perde 'taxa' (ex.: 0.10 = 10%) do valor a cada ano.
    # Devolva o valor final arredondado com 2 casas: round(x, 2)
    pass


def resumo_valores(valores: list) -> tuple:
    # TODO: devolva uma TUPLA (maior, menor, soma) usando max(), min() e sum()
    pass
`,
      },
      {
        caminho: 'src/inventario.py',
        linguagem: 'python',
        conteudo: py`# TODO: importe as funções do módulo Funcoes


def cadastrar_login(usuarios: dict, login: str, nome: str) -> bool:
    # TODO: se o login já existir, NÃO sobrescreva: devolva False.
    # Caso contrário, cadastre (usuarios[login] = nome) e devolva True.
    pass


def valor_total_depreciado(ativos: list, anos: int, taxa: float) -> float:
    # 'ativos' é uma lista de dicionários: [{"nome": "Switch", "valor": 1000.0}, ...]
    # TODO: some o valor depreciado de cada ativo usando calcular_depreciacao
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Lista ou dicionário?',
        mensagemIA:
          'Vamos atacar o bug dos logins. Hoje os usuários ficam em uma lista: `[["ana", "Ana Lima"], ["ana", "Ana Souza"]]`. Precisamos garantir login único e achar um usuário rápido, mesmo com 50 mil cadastros. Qual estrutura você escolhe?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Continuar com a lista e percorrer tudo com for antes de cada cadastro.',
            correta: false,
            feedbackIA:
              'Funciona, mas é busca linear: no pior caso você olha os 50 mil itens a cada cadastro — complexidade O(n). Há uma estrutura que resolve unicidade e busca de uma vez.',
          },
          {
            id: 'opt_b',
            texto: 'Um dicionário com o login como chave: {"ana": "Ana Lima"}.',
            correta: true,
            feedbackIA:
              'Isso! Chaves de `dict` são únicas e o acesso por chave é O(1) em média (tabela hash), contra O(n) da busca em lista. Só cuidado: `usuarios[login] = nome` sobrescreve em silêncio — é exatamente o bug atual. Cheque com `if login in usuarios` antes.',
          },
          {
            id: 'opt_c',
            texto: 'Uma tupla, porque é imutável e protege os dados.',
            correta: false,
            feedbackIA:
              'Tuplas são ótimas para proteger registros que não mudam (integridade), mas justamente por serem imutáveis não dá para cadastrar novos usuários nelas. E a busca continuaria O(n).',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Módulo Funcoes.py',
        arquivo: 'src/Funcoes.py',
        mensagemIA:
          'Princípio de Clean Code: blocos que se repetem viram funções, e funções reutilizáveis vão para um módulo próprio. Abra `src/Funcoes.py` e implemente:\n\n• `calcular_depreciacao(valor, anos, taxa)` — a cada ano o valor é multiplicado por `(1 - taxa)`. Arredonde com `round(x, 2)`.\n• `resumo_valores(valores)` — devolve a tupla `(maior, menor, soma)`.',
        casosDeTeste: [],
        testes: [
          {
            nome: 'calcular_depreciacao(1000, 2, 0.10) == 810.0',
            codigo: py`f = carregar("src/Funcoes.py")
r = f.calcular_depreciacao(1000, 2, 0.10)
assert r == 810.0, f"Esperado 810.0 (1000 -> 900 -> 810), veio {r!r}."`,
          },
          {
            nome: 'calcular_depreciacao com 0 anos devolve o valor original',
            codigo: py`f = carregar("src/Funcoes.py")
r = f.calcular_depreciacao(2500.5, 0, 0.2)
assert r == 2500.5, f"Com 0 anos o valor não muda. Veio {r!r}."`,
          },
          {
            nome: 'resumo_valores devolve a tupla (maior, menor, soma)',
            codigo: py`f = carregar("src/Funcoes.py")
r = f.resumo_valores([10, 50, 20])
assert isinstance(r, tuple), f"O retorno deve ser uma tupla, veio {type(r).__name__}."
assert r == (50, 10, 80), f"Esperado (50, 10, 80), veio {r!r}."`,
          },
        ],
        dicas: [
          'Potência em Python é `**`: `valor * (1 - taxa) ** anos`.',
          'Para devolver uma tupla basta separar por vírgulas: `return max(valores), min(valores), sum(valores)`.',
        ],
      },
      {
        ordem: 3,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Corrigir o cadastro e usar o módulo',
        arquivo: 'src/inventario.py',
        mensagemIA:
          'Agora o `src/inventario.py`:\n\n1. Importe o módulo no topo: `from Funcoes import *`.\n2. `cadastrar_login` não pode sobrescrever um login existente (devolve `False` nesse caso).\n3. `valor_total_depreciado` soma a depreciação de todos os ativos reaproveitando `calcular_depreciacao` — nada de copiar a fórmula!',
        regras: [
          {
            nome: 'Importa o módulo Funcoes',
            arquivo: 'src/inventario.py',
            padrao: '^\\s*(from\\s+Funcoes\\s+import|import\\s+Funcoes)',
            dica: 'Reaproveite o módulo: adicione `from Funcoes import *` no topo de `src/inventario.py`.',
          },
        ],
        testes: [
          {
            nome: 'Login novo é cadastrado',
            codigo: py`m = carregar("src/inventario.py")
usuarios = {}
assert m.cadastrar_login(usuarios, "ana", "Ana Lima") is True, "Um login novo deve devolver True."
assert usuarios == {"ana": "Ana Lima"}, f"O dicionário deveria conter o novo login. Está assim: {usuarios!r}"`,
          },
          {
            nome: 'Login repetido não sobrescreve o anterior',
            codigo: py`m = carregar("src/inventario.py")
usuarios = {"ana": "Ana Lima"}
assert m.cadastrar_login(usuarios, "ana", "Ana Souza") is False, "Login repetido deve devolver False."
assert usuarios["ana"] == "Ana Lima", "O cadastro original foi sobrescrito! Cheque com 'if login in usuarios' antes de gravar."`,
          },
          {
            nome: 'valor_total_depreciado soma todos os ativos',
            codigo: py`m = carregar("src/inventario.py")
ativos = [{"nome": "Switch", "valor": 1000.0}, {"nome": "Roteador", "valor": 500.0}]
r = m.valor_total_depreciado(ativos, 2, 0.10)
assert r == 1215.0, f"Esperado 1215.0 (810.0 + 405.0), veio {r!r}."
assert m.valor_total_depreciado([], 3, 0.5) == 0, "Lista vazia deve somar 0."`,
          },
        ],
        dicas: [
          'O operador `in` testa se a chave existe: `if login in usuarios: return False`.',
          'Use um acumulador: `total = 0`, depois `for ativo in ativos: total += calcular_depreciacao(ativo["valor"], anos, taxa)` e por fim `return round(total, 2)`.',
        ],
      },
    ],
  },

  {
    _id: 'quest_jr_03_relatorios_json',
    codigo: 'Jr 03',
    titulo: 'Relatórios Persistentes & JSON',
    nivelCarreira: 'JUNIOR',
    ordemTrilha: 3,
    recompensaXP: 70,
    conceitos: ['Strings (split)', 'with open()', "Modos 'r', 'w', 'a'", 'CSV', 'JSON'],
    email: {
      remetente: 'diretoria@nexustech.dev (Diretoria)',
      assunto: 'Os dados do inventário sumiram de novo',
      corpo:
        'Bom dia.\n\nToda vez que o computador da infraestrutura é desligado, o inventário inteiro se perde, porque fica só na memória RAM.\n\nPrecisamos que os dados sobrevivam ao desligamento e possam ser lidos pelo painel web da empresa (que consome JSON) e pelo financeiro (que abre planilhas .csv separadas por ponto e vírgula).\n\nConto com vocês.',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'src/relatorios.py',
        linguagem: 'python',
        conteudo: py`import json
import os


def registrar_log(caminho: str, mensagem: str) -> None:
    # TODO: acrescente a mensagem ao final do arquivo, uma por linha
    pass


def exportar_csv(ativos: list, caminho: str) -> None:
    # 'ativos' = [{"nome": "Switch", "valor": 1000.0}, ...]
    # TODO: gere o arquivo com o cabeçalho "nome;valor" e uma linha por ativo
    pass


def parse_linha(linha: str) -> dict:
    # TODO: transforme "Switch;1000.0" em {"nome": "Switch", "valor": 1000.0}
    pass


def salvar_json(ativos: list, caminho: str) -> None:
    # TODO: grave a lista de ativos como JSON
    pass


def carregar_json(caminho: str) -> list:
    # TODO: leia a lista do arquivo JSON. Se o arquivo não existir, devolva []
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Modo de abertura do arquivo',
        mensagemIA:
          'Vamos gravar um log com cada cadastro feito. Pense comigo: se usarmos o modo `\'w\'` em `open("log.txt", "w")` a cada novo cadastro, o que acontecerá com os registros anteriores?',
        opcoes: [
          {
            id: 'opt_a',
            texto: "Serão apagados: 'w' é escrita destrutiva. Para acumular registros, o modo certo é 'a' (append).",
            correta: true,
            feedbackIA:
              "Exato! `'w'` trunca o arquivo toda vez que abre. `'a'` posiciona no final e preserva o histórico. E `'r'` é só leitura. Use sempre `with open(...) as f:` — ele fecha o arquivo sozinho, mesmo se der erro.",
          },
          {
            id: 'opt_b',
            texto: "Nada: 'w' escreve no final do arquivo e mantém o que já existia.",
            correta: false,
            feedbackIA: "Cuidado, esse é o comportamento do modo `'a'` (append). O `'w'` zera o arquivo no momento em que ele é aberto — você perderia o log inteiro a cada cadastro.",
          },
          {
            id: 'opt_c',
            texto: "O Python lança um erro, porque o arquivo já existe.",
            correta: false,
            feedbackIA: "Esse é o comportamento do modo exclusivo `'x'`. O `'w'` não reclama: ele apaga silenciosamente o conteúdo anterior, o que é bem mais perigoso.",
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Log e planilha CSV',
        arquivo: 'src/relatorios.py',
        mensagemIA:
          'Implemente em `src/relatorios.py`:\n\n• `registrar_log(caminho, mensagem)` — acrescenta a mensagem em uma nova linha (termine com `\\n`).\n• `exportar_csv(ativos, caminho)` — primeira linha `nome;valor`, depois uma linha por ativo, ex.: `Switch;1000.0`.\n• `parse_linha(linha)` — o caminho inverso: quebra a linha com `split(";")` e devolve o dicionário, com `valor` convertido para `float`.',
        testes: [
          {
            nome: 'registrar_log acumula as mensagens',
            codigo: py`m = carregar("src/relatorios.py")
m.registrar_log("log.txt", "cadastro: Switch")
m.registrar_log("log.txt", "cadastro: Roteador")
with open("log.txt", encoding="utf-8") as f:
    linhas = f.read().splitlines()
assert linhas == ["cadastro: Switch", "cadastro: Roteador"], f"O log deveria ter as duas linhas, mas ficou: {linhas!r}. Você abriu com o modo 'a' e terminou cada mensagem com \\n?"`,
          },
          {
            nome: 'exportar_csv gera cabeçalho e linhas com ;',
            codigo: py`m = carregar("src/relatorios.py")
m.exportar_csv([{"nome": "Switch", "valor": 1000.0}, {"nome": "Roteador", "valor": 499.9}], "ativos.csv")
with open("ativos.csv", encoding="utf-8") as f:
    linhas = f.read().splitlines()
assert linhas == ["nome;valor", "Switch;1000.0", "Roteador;499.9"], f"Conteúdo inesperado no CSV: {linhas!r}"`,
          },
          {
            nome: 'exportar_csv sobrescreve a planilha anterior',
            codigo: py`m = carregar("src/relatorios.py")
m.exportar_csv([{"nome": "A", "valor": 1.0}], "ativos.csv")
m.exportar_csv([{"nome": "B", "valor": 2.0}], "ativos.csv")
with open("ativos.csv", encoding="utf-8") as f:
    linhas = f.read().splitlines()
assert linhas == ["nome;valor", "B;2.0"], f"A planilha é um retrato atual: deve ser regravada com 'w'. Ficou: {linhas!r}"`,
          },
          {
            nome: 'parse_linha converte texto em dicionário',
            codigo: py`m = carregar("src/relatorios.py")
r = m.parse_linha("Notebook;3500.5\n")
assert r == {"nome": "Notebook", "valor": 3500.5}, f"Esperado {{'nome': 'Notebook', 'valor': 3500.5}}, veio {r!r}. Use strip() para tirar o \\n e float() no valor."`,
          },
        ],
        dicas: [
          'Log: `with open(caminho, "a", encoding="utf-8") as f: f.write(mensagem + "\\n")`.',
          'CSV: abra com `"w"`, escreva `"nome;valor\\n"` e depois, no `for`, `f.write(f"{ativo[\'nome\']};{ativo[\'valor\']}\\n")`.',
          'parse_linha: `partes = linha.strip().split(";")` e devolva `{"nome": partes[0], "valor": float(partes[1])}`.',
        ],
      },
      {
        ordem: 3,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Interoperabilidade',
        mensagemIA:
          'O painel web da empresa é feito em JavaScript e precisa ler o inventário. Como gravar a lista de dicionários para que outro sistema, em outra linguagem, consiga ler?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'f.write(str(ativos)) — grava a representação do Python.',
            correta: false,
            feedbackIA:
              "`str(ativos)` gera aspas simples e `True`/`None`, que não são JSON válido: o `JSON.parse` do painel quebraria. Precisamos de um formato padrão entre linguagens.",
          },
          {
            id: 'opt_b',
            texto: 'json.dump / json.dumps — serializa no formato JSON, padrão entre linguagens.',
            correta: true,
            feedbackIA:
              'Isso. JSON é o idioma comum das APIs. `json.dump(obj, f)` grava direto no arquivo, `json.dumps(obj)` devolve a string, e `json.load(f)` / `json.loads(s)` fazem o caminho de volta.',
          },
          {
            id: 'opt_c',
            texto: 'Gerar um relatório .html com uma tabela.',
            correta: false,
            feedbackIA: 'HTML é ótimo para pessoas lerem no navegador, mas péssimo para outro programa extrair dados. Para integração entre sistemas, use JSON.',
          },
        ],
      },
      {
        ordem: 4,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Persistência em JSON',
        arquivo: 'src/relatorios.py',
        mensagemIA:
          'Última parte: implemente `salvar_json(ativos, caminho)` e `carregar_json(caminho)`.\n\nAtenção ao primeiro uso do sistema: se o arquivo ainda não existe, `carregar_json` deve devolver uma lista vazia em vez de quebrar com `FileNotFoundError`.',
        testes: [
          {
            nome: 'salvar_json grava JSON válido',
            codigo: py`import json
m = carregar("src/relatorios.py")
ativos = [{"nome": "Switch", "valor": 1000.0}]
m.salvar_json(ativos, "inventario.json")
with open("inventario.json", encoding="utf-8") as f:
    texto = f.read()
try:
    lido = json.loads(texto)
except Exception:
    raise AssertionError(f"O arquivo não contém JSON válido: {texto[:60]!r}. Use json.dump(ativos, f).")
assert lido == ativos, f"O conteúdo gravado difere do original: {lido!r}"`,
          },
          {
            nome: 'carregar_json devolve o que foi salvo',
            codigo: py`m = carregar("src/relatorios.py")
ativos = [{"nome": "Switch", "valor": 1000.0}, {"nome": "Câmera", "valor": 250.75}]
m.salvar_json(ativos, "inventario.json")
r = m.carregar_json("inventario.json")
assert r == ativos, f"Esperado {ativos!r}, veio {r!r}."`,
          },
          {
            nome: 'carregar_json devolve [] quando o arquivo não existe',
            codigo: py`m = carregar("src/relatorios.py")
r = m.carregar_json("nao_existe.json")
assert r == [], f"Sem arquivo, o retorno deve ser [] (veio {r!r})."`,
          },
        ],
        dicas: [
          'Salvar: `with open(caminho, "w", encoding="utf-8") as f: json.dump(ativos, f)`.',
          'Para o arquivo inexistente: `if not os.path.exists(caminho): return []` (ou um `try/except FileNotFoundError`).',
        ],
      },
    ],
  },

  {
    _id: 'quest_jr_04_wazeyes',
    codigo: 'Jr 04',
    titulo: 'Projeto Wazeyes (Pacotes & SO)',
    nivelCarreira: 'JUNIOR',
    ordemTrilha: 4,
    recompensaXP: 80,
    conceitos: ['pip', 'Bibliotecas externas', 'Tratamento de exceções', 'platform e os', 'JSON'],
    email: {
      remetente: TECH_LEAD,
      assunto: '[Acessibilidade/IoT] Projeto Wazeyes - geolocalização para o wearable',
      corpo:
        'Fala!\n\nEntrou um projeto muito bacana: o Wazeyes, um dispositivo wearable para pessoas com deficiência visual.\n\nO aparelho grava um endereço em `entrada.json` e espera receber as coordenadas geográficas em `saida.json`. Para converter endereço em latitude/longitude vamos usar a biblioteca geopy (geocoder Nominatim).\n\nDois cuidados: o serviço tem limite de consultas (erro OVER_QUERY_LIMIT) e precisamos registrar em qual sistema operacional o script está rodando, para o suporte.\n\nAbs,\nMarcos',
    },
    arquivosIniciaisIDE: [
      { caminho: 'entrada.json', linguagem: 'json', conteudo: '{\n  "endereco": "Avenida Paulista, 1000, Sao Paulo"\n}\n' },
      {
        caminho: 'src/wazeyes.py',
        linguagem: 'python',
        conteudo: py`import json

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderQuotaExceeded


def geocodificar(endereco: str):
    geolocalizador = Nominatim(user_agent="wazeyes-nexustech")
    # TODO: chame geolocalizador.geocode(endereco)
    #  - encontrou   -> devolva {"latitude": ..., "longitude": ...}
    #  - devolveu None (endereço desconhecido) -> devolva None
    #  - lançou GeocoderQuotaExceeded -> devolva {"erro": "OVER_QUERY_LIMIT"}
    pass


def processar(arquivo_entrada: str, arquivo_saida: str) -> None:
    # TODO: leia o campo "endereco" do JSON de entrada, geocodifique e grave
    # no JSON de saída: {"endereco": ..., "latitude": ..., "longitude": ...}
    pass


if __name__ == "__main__":
    processar("entrada.json", "saida.json")
    print("saida.json gerado!")
`,
      },
      {
        caminho: 'src/sistema.py',
        linguagem: 'python',
        conteudo: py`import os
import platform


def info_sistema() -> dict:
    # TODO: devolva um dicionário com as chaves:
    #   "sistema"   -> platform.system()
    #   "python"    -> platform.python_version()
    #   "diretorio" -> os.getcwd()
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Biblioteca padrão vs. externa',
        mensagemIA:
          'O script usa `json`, `os`, `platform` e `geopy`. Antes de rodar, quais delas você precisa instalar?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Todas: cada import precisa de um pip install correspondente.',
            correta: false,
            feedbackIA: '`json`, `os` e `platform` fazem parte da biblioteca padrão: já vêm junto com a PVM. Tentar `pip install json` daria erro.',
          },
          {
            id: 'opt_b',
            texto: 'Apenas geopy: as outras fazem parte da biblioteca padrão que acompanha a PVM.',
            correta: true,
            feedbackIA:
              'Isso! A biblioteca padrão (“batteries included”) vem com o Python. Já a `geopy` é mantida pela comunidade e publicada no PyPI: o `pip` baixa e instala. Em projetos reais, registre as dependências em um `requirements.txt`.',
          },
          {
            id: 'opt_c',
            texto: 'Nenhuma: o Python baixa bibliotecas automaticamente no primeiro import.',
            correta: false,
            feedbackIA: 'Quem dera! Um import de pacote não instalado falha com `ModuleNotFoundError`. Experimente rodar `python src/wazeyes.py` agora no terminal para ver.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Instalar a dependência',
        mensagemIA:
          'No terminal, instale a biblioteca com o gerenciador de pacotes: `pip install geopy`. Depois confira com `pip list`.',
        comandos: [{ padrao: '^(pip|pip3|python -m pip) install .*\\bgeopy\\b', descricao: 'pip install geopy' }],
        dicas: ['Digite `pip install geopy` no terminal e pressione Enter.'],
      },
      {
        ordem: 3,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Geocodificação com tratamento de limite',
        arquivo: 'src/wazeyes.py',
        mensagemIA:
          'Implemente `geocodificar` e `processar` em `src/wazeyes.py`.\n\n`geolocalizador.geocode(endereco)` devolve um objeto com `.latitude` e `.longitude` — ou `None` quando não encontra. Quando o limite de consultas estoura, ele lança `GeocoderQuotaExceeded`: capture com `try/except` para o wearable não travar.\n\nPara testar manualmente: `python src/wazeyes.py` e depois `cat saida.json`.',
        testes: [
          {
            nome: 'Endereço conhecido devolve latitude e longitude',
            codigo: py`m = carregar("src/wazeyes.py")
r = m.geocodificar("Avenida Paulista, 1000, Sao Paulo")
assert r == {"latitude": -23.5647, "longitude": -46.6527}, f"Retorno inesperado: {r!r}"`,
          },
          {
            nome: 'Endereço desconhecido devolve None',
            codigo: py`m = carregar("src/wazeyes.py")
r = m.geocodificar("Rua Que Nao Existe, 0")
assert r is None, f"Quando o geocode devolve None, a função também deve devolver None (veio {r!r})."`,
          },
          {
            nome: 'OVER_QUERY_LIMIT é tratado sem quebrar',
            codigo: py`m = carregar("src/wazeyes.py")
r = m.geocodificar("endereco que estoura o limite")
assert r == {"erro": "OVER_QUERY_LIMIT"}, f"Esperado {{'erro': 'OVER_QUERY_LIMIT'}}, veio {r!r}."`,
          },
          {
            nome: 'processar lê entrada.json e grava saida.json',
            codigo: py`import json
m = carregar("src/wazeyes.py")
with open("in.json", "w", encoding="utf-8") as f:
    json.dump({"endereco": "Praca da Se, Sao Paulo"}, f)
m.processar("in.json", "out.json")
with open("out.json", encoding="utf-8") as f:
    r = json.load(f)
assert r == {"endereco": "Praca da Se, Sao Paulo", "latitude": -23.5503, "longitude": -46.6339}, f"saida inesperada: {r!r}"`,
          },
        ],
        dicas: [
          'Estrutura:\ntry:\n    local = geolocalizador.geocode(endereco)\nexcept GeocoderQuotaExceeded:\n    return {"erro": "OVER_QUERY_LIMIT"}',
          'Depois do try: `if local is None: return None` e por fim `return {"latitude": local.latitude, "longitude": local.longitude}`.',
          'Em `processar`: leia com `json.load`, monte `saida = {"endereco": endereco}`, junte as coordenadas com `saida.update(geocodificar(endereco))` e grave com `json.dump`.',
        ],
      },
      {
        ordem: 4,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Inspeção do sistema operacional',
        arquivo: 'src/sistema.py',
        mensagemIA:
          'Para o suporte saber onde o script roda, implemente `info_sistema()` em `src/sistema.py` usando os módulos `platform` e `os` da biblioteca padrão.\n\nCuriosidade: aqui no dev_OS o seu Python roda em WebAssembly dentro do navegador, então `platform.system()` responde `Emscripten`. Na sua máquina seria `Windows`, `Linux` ou `Darwin` (macOS).',
        testes: [
          {
            nome: 'info_sistema devolve sistema, python e diretorio',
            codigo: py`import os, platform
m = carregar("src/sistema.py")
r = m.info_sistema()
assert isinstance(r, dict), f"O retorno deve ser um dicionário (veio {type(r).__name__})."
assert r.get("sistema") == platform.system(), f"'sistema' deveria ser platform.system() = {platform.system()!r}, veio {r.get('sistema')!r}."
assert r.get("python") == platform.python_version(), f"'python' deveria ser platform.python_version(), veio {r.get('python')!r}."
assert r.get("diretorio") == os.getcwd(), f"'diretorio' deveria ser os.getcwd(), veio {r.get('diretorio')!r}."`,
          },
        ],
        dicas: ['return {"sistema": platform.system(), "python": platform.python_version(), "diretorio": os.getcwd()}'],
      },
    ],
  },

  {
    _id: 'quest_jr_05_git_rede',
    codigo: 'Jr 05',
    titulo: 'Git, GitHub & Diagnóstico de Rede',
    nivelCarreira: 'JUNIOR',
    ordemTrilha: 5,
    recompensaXP: 100,
    boss: true,
    conceitos: ['git init / add / commit / push', '.gitignore', 'socket', 'TCP vs UDP', 'DNS e Port Scan'],
    email: {
      remetente: TECH_LEAD,
      assunto: '[Boss Challenge] Monitor de rede + seu primeiro push no repositório oficial',
      corpo:
        'Chegou a hora do seu projeto integrador de Júnior.\n\n1) Crie um monitor de portas e servidores usando a biblioteca nativa `socket`: precisamos saber se as portas dos nossos servidores (22, 80, 443...) estão respondendo.\n\n2) Versione tudo no repositório oficial da NexusTech no GitHub.\n\nATENÇÃO: o projeto tem um arquivo `.env` com a chave da API de monitoramento. Segredos NUNCA sobem para o repositório.\n\nEntregando isso, sua promoção a Pleno está garantida.\n\nMarcos',
    },
    arquivosIniciaisIDE: [
      { caminho: '.env', linguagem: 'plaintext', conteudo: 'MONITOR_API_KEY=nx_live_4f9a1c77e2b84d0fa1b6\n' },
      { caminho: 'README.md', linguagem: 'markdown', conteudo: '# Monitor de Rede NexusTech\n\nVerifica portas TCP e resolve nomes DNS dos servidores.\n' },
      {
        caminho: 'src/monitor.py',
        linguagem: 'python',
        conteudo: py`import socket


def verificar_porta(host: str, porta: int, timeout: float = 1.0) -> bool:
    # TODO: crie um socket TCP (socket.AF_INET, socket.SOCK_STREAM),
    # configure o timeout e use connect_ex((host, porta)).
    # connect_ex devolve 0 quando a conexão é aceita. Feche o socket no final.
    pass


def escanear(host: str, portas: list) -> list:
    # TODO: devolva a lista apenas com as portas abertas (Port Scan)
    pass


def resolver_dns(nome: str):
    # TODO: devolva o IP com socket.gethostbyname(nome).
    # Se o nome não existir (socket.gaierror), devolva None.
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'TCP ou UDP?',
        mensagemIA:
          'Para saber se a porta 443 de um servidor está aceitando conexões, que tipo de socket devemos abrir?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'TCP (SOCK_STREAM): orientado a conexão — o handshake confirma se a porta aceita a conexão.',
            correta: true,
            feedbackIA:
              'Exato. O TCP faz o three-way handshake: se a porta responde, sabemos que há um serviço ouvindo. É assim que funciona um Port Scan. O TCP garante entrega e ordem — usado em HTTP, SSH e bancos de dados.',
          },
          {
            id: 'opt_b',
            texto: 'UDP (SOCK_DGRAM): mais rápido, envia datagramas sem estabelecer conexão.',
            correta: false,
            feedbackIA:
              'O UDP é rápido justamente por não ter conexão nem confirmação de entrega (ótimo para streaming, jogos e DNS). Mas sem handshake não dá para saber se a porta “aceitou” algo. Para testar serviço ouvindo, precisamos de TCP.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Monitor de portas e DNS',
        arquivo: 'src/monitor.py',
        mensagemIA:
          'Implemente as três funções de `src/monitor.py`:\n\n• `verificar_porta(host, porta, timeout)` → `True` se a porta TCP aceitar conexão.\n• `escanear(host, portas)` → lista das portas abertas.\n• `resolver_dns(nome)` → IP do servidor, ou `None` se o nome não existir.\n\nComo o sandbox não tem acesso à rede real, o Test Runner simula os servidores da NexusTech.',
        testes: [
          {
            nome: 'verificar_porta usa TCP e detecta porta aberta/fechada',
            codigo: py`import socket
_original = socket.socket
criados = []
class SocketFalso:
    def __init__(self, familia=None, tipo=None, *a, **k):
        assert tipo == socket.SOCK_STREAM, "Use socket.SOCK_STREAM (TCP) para testar conexões."
        self.fechado = False
        criados.append(self)
    def settimeout(self, t): pass
    def connect_ex(self, endereco): return 0 if endereco[1] in (22, 443) else 111
    def connect(self, endereco):
        if endereco[1] not in (22, 443): raise ConnectionRefusedError("Connection refused")
    def close(self): self.fechado = True
    def __enter__(self): return self
    def __exit__(self, *a): self.close()
socket.socket = SocketFalso
try:
    m = carregar("src/monitor.py")
    assert m.verificar_porta("10.0.0.5", 443) is True, "A porta 443 está aberta: o retorno deveria ser True."
    assert m.verificar_porta("10.0.0.5", 8080) is False, "A porta 8080 está fechada: o retorno deveria ser False."
    assert criados and all(s.fechado for s in criados), "Feche o socket com close() (ou use 'with') para não vazar conexões."
finally:
    socket.socket = _original`,
          },
          {
            nome: 'escanear devolve somente as portas abertas',
            codigo: py`import socket
_original = socket.socket
class SocketFalso:
    def __init__(self, *a, **k): pass
    def settimeout(self, t): pass
    def connect_ex(self, endereco): return 0 if endereco[1] in (22, 443) else 111
    def connect(self, endereco):
        if endereco[1] not in (22, 443): raise ConnectionRefusedError("Connection refused")
    def close(self): pass
    def __enter__(self): return self
    def __exit__(self, *a): pass
socket.socket = SocketFalso
try:
    m = carregar("src/monitor.py")
    r = m.escanear("10.0.0.5", [21, 22, 80, 443])
    assert r == [22, 443], f"Esperado [22, 443], veio {r!r}."
    assert m.escanear("10.0.0.5", []) == [], "Sem portas para testar, a lista deve vir vazia."
finally:
    socket.socket = _original`,
          },
          {
            nome: 'resolver_dns devolve o IP ou None',
            codigo: py`import socket
_original = socket.gethostbyname
def falso(nome):
    if nome == "api.nexustech.dev": return "10.0.0.5"
    raise socket.gaierror("Name or service not known")
socket.gethostbyname = falso
try:
    m = carregar("src/monitor.py")
    assert m.resolver_dns("api.nexustech.dev") == "10.0.0.5", "O nome api.nexustech.dev deveria resolver para 10.0.0.5."
    r = m.resolver_dns("nao-existe.nexustech.dev")
    assert r is None, f"Nome inexistente deve devolver None (veio {r!r})."
finally:
    socket.gethostbyname = _original`,
          },
        ],
        dicas: [
          'verificar_porta:\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.settimeout(timeout)\nresultado = s.connect_ex((host, porta))\ns.close()\nreturn resultado == 0',
          'escanear: uma list comprehension resolve — `return [p for p in portas if verificar_porta(host, p)]`.',
          'resolver_dns:\ntry:\n    return socket.gethostbyname(nome)\nexcept socket.gaierror:\n    return None',
        ],
      },
      {
        ordem: 3,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Primeiro commit',
        mensagemIA:
          'Hora de versionar. No terminal:\n\n1. `git init` — cria o repositório local\n2. `git add .` — prepara os arquivos (staging)\n3. `git commit -m "mensagem"` — grava o snapshot\n\nUse `git status` sempre que quiser ver o que será commitado. O Marcos avisou algo sobre o arquivo `.env`...',
        comandos: [
          { padrao: '^git init$', descricao: 'git init' },
          { padrao: '^git add ', descricao: 'git add .' },
          { padrao: '^git commit ', descricao: 'git commit -m "..."' },
        ],
        dicas: [
          'Para criar o `.gitignore`, use o botão “+” do Explorer ou o terminal: `echo ".env" > .gitignore`.',
          'Sequência: `git init`, depois `git add .` e `git commit -m "feat: monitor de rede"`.',
        ],
      },
      {
        ordem: 4,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Push seguro para o GitHub',
        mensagemIA:
          'Agora conecte ao repositório remoto e envie:\n\n1. `git remote add origin https://github.com/nexustech/monitor-rede.git`\n2. `git push -u origin main`\n\nO GitHub da NexusTech tem *secret scanning*: se houver credenciais no commit, o push será recusado.',
        comandos: [
          { padrao: '^git remote add origin \\S+', descricao: 'git remote add origin <url>' },
          { padrao: '^git push', descricao: 'git push -u origin main' },
        ],
        regras: [
          {
            nome: '.gitignore protege o .env',
            arquivo: '.gitignore',
            padrao: '^\\s*(\\.env|\\*\\.env|\\.env\\*)\\s*$',
            dica: 'Crie o arquivo `.gitignore` com uma linha `.env` para o Git nunca rastrear as credenciais.',
          },
        ],
        dicas: [
          'Se o push foi bloqueado: adicione `.env` ao `.gitignore`. Mas o `.gitignore` só vale para arquivos ainda não rastreados...',
          'Para parar de rastrear sem apagar do disco: `git rm --cached .env`. Depois `git add .`, um novo `git commit -m "chore: remove .env do repositório"` e `git push -u origin main`.',
        ],
      },
    ],
  },
];
