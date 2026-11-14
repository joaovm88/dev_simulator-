// Modo guiado: código com lacunas para cada etapa de implementação.
// Chave: "<_id da missão>:<arquivo principal da etapa>".
// Toda opção explica o que aquela sintaxe faz — inclusive as erradas.
import type { Lacunas } from '../types';
import { no, ok } from '../lacunas';

const r = String.raw;
const MODEL = 'src/br/com/nexustech/model/';

const subclasse = (nome: string, entrega: string): Lacunas => ({
  arquivo: `${MODEL}${nome}.java`,
  modelo: `package br.com.nexustech.model;

public class ${nome} ⟦ext⟧ Produto {

    public ${nome}(String nome, double preco) {
        ⟦sup⟧(nome, preco);
    }

    ⟦ovr⟧
    public String getFormaEntrega() {
        return "${entrega}";
    }
}
`,
  slots: {
    ext: [
      ok('extends', 'Herança: a classe passa a SER um Produto e herda seus atributos e métodos.'),
      no('implements', 'Serve para cumprir o contrato de uma interface. Produto é uma classe (abstrata), não uma interface.'),
      no('instanceof', 'É um operador que testa o tipo de um objeto em tempo de execução; não declara herança.'),
    ],
    sup: [
      ok('super', 'Chama o construtor da superclasse (Produto), reaproveitando a inicialização de nome e preço.'),
      no('this', 'Chamaria outro construtor desta mesma classe — aqui, ela mesma, em recursão: erro de compilação.'),
      no('Produto', 'Construtor não é chamado pelo nome da classe-mãe. Dentro da subclasse, usa-se super(...).'),
    ],
    ovr: [
      ok('@Override', 'Avisa o compilador de que este método sobrescreve o da superclasse. Se você errar a assinatura, ele acusa.'),
      no('@Overload', 'Essa anotação não existe em Java. Sobrecarga (overload) nem precisa de anotação.'),
      no('@Deprecated', 'Marca o método como obsoleto, gerando avisos para quem o usar. Não tem relação com sobrescrita.'),
    ],
  },
});

export const LACUNAS: Record<string, Lacunas[]> = {
  // ------------------------------------------------------------------ JÚNIOR
  'quest_jr_01_bitmed_triagem:src/triagem.py': [
    {
      arquivo: 'src/triagem.py',
      modelo: r`def classificar_paciente(idade: int, suspeita_infecto: bool) -> str:
    ⟦se⟧ idade ⟦cmp⟧ 65 ⟦e⟧ suspeita_infecto:
        return "Sala Amarela - Prioridade"
    ⟦senaose⟧ idade >= 65:
        return "Sala Branca - Prioridade"
    elif suspeita_infecto:
        ⟦ret⟧ "Sala Amarela - Comum"
    ⟦senao⟧:
        return "Sala Branca - Comum"
`,
      slots: {
        se: [
          ok('if', 'Desvio condicional: executa o bloco uma única vez, se a condição for verdadeira.'),
          no('while', 'Laço: repete o bloco enquanto a condição for verdadeira. Aqui o return sairia na primeira volta, mas a intenção ficaria errada — e o elif seguinte nem compila depois de um while.'),
          no('for', 'Laço que percorre os itens de uma sequência (for x in lista). Não avalia uma condição.'),
        ],
        cmp: [
          ok('>=', 'Maior ou igual: inclui o próprio 65. Quem tem exatamente 65 anos já é prioridade.'),
          no('>', 'Maior que: deixa de fora quem tem exatamente 65 anos — o clássico erro de limite (off-by-one).'),
          no('==', 'Igualdade: só seria verdadeiro para quem tem exatamente 65 anos.'),
        ],
        e: [
          ok('and', 'E lógico: só é verdadeiro quando as DUAS condições são verdadeiras.'),
          no('or', 'OU lógico: basta uma das condições. Um jovem com suspeita cairia aqui como “Prioridade”.'),
          no('not', 'Negação: inverte um único valor booleano. Não combina duas condições (erro de sintaxe aqui).'),
        ],
        senaose: [
          ok('elif', '“Senão, se”: só é testado quando as condições anteriores falharam. Torna os cenários mutuamente exclusivos.'),
          no('else', '“Senão”: não aceita condição. Escrever else seguido de uma condição é erro de sintaxe.'),
          no('while', 'Laço de repetição: não faz parte de uma cadeia if/elif/else.'),
        ],
        ret: [
          ok('return', 'Encerra a função e devolve o valor para quem a chamou.'),
          no('yield', 'Transforma a função em um gerador: quem chamar recebe um objeto gerador, não o texto.'),
          no('raise', 'Lança uma exceção. Um texto não é uma exceção: TypeError.'),
        ],
        senao: [
          ok('else', 'Caminho padrão: executa quando nenhuma das condições anteriores foi verdadeira.'),
          no('elif', 'Exige uma condição depois dele. Sozinho, é erro de sintaxe.'),
          no('except', 'Faz parte do try/except (tratamento de erros), não do if.'),
        ],
      },
    },
  ],

  'quest_jr_01_bitmed_triagem:src/fila.py': [
    {
      arquivo: 'src/fila.py',
      modelo: r`def contar_prioritarios(idades: list) -> int:
    total = ⟦ini⟧
    ⟦laco⟧ idade ⟦em⟧ idades:
        if idade >= 65:
            total ⟦soma⟧ 1
    return total
`,
      slots: {
        ini: [
          ok('0', 'Um contador começa em zero (int) e vai sendo incrementado.'),
          no('[]', 'Lista vazia. Somar um número a uma lista com += lança TypeError.'),
          no('None', 'Representa “sem valor”. None + 1 lança TypeError.'),
        ],
        laco: [
          ok('for', 'Percorre a sequência item por item: a cada volta, a variável recebe o próximo valor.'),
          no('while', 'Repete enquanto uma condição for verdadeira; não combina com “variável in sequência”.'),
          no('if', 'Testaria uma única vez se o valor está na lista, sem percorrê-la.'),
        ],
        em: [
          ok('in', 'No for, “x in sequência” entrega cada elemento da sequência, um por volta.'),
          no('of', 'É a sintaxe do JavaScript (for...of). Em Python é erro de sintaxe.'),
          no('=', 'Atribuição. Não é permitido no cabeçalho do for.'),
        ],
        soma: [
          ok('+=', 'Soma e atribui: total += 1 é o mesmo que total = total + 1.'),
          no('=', 'Atribuição simples: o total viraria sempre 1, sem acumular.'),
          no('==', 'Comparação: testa se total é igual a 1 e descarta o resultado. O total nunca muda.'),
        ],
      },
    },
  ],

  'quest_jr_02_inventario_acesso:src/Funcoes.py': [
    {
      arquivo: 'src/Funcoes.py',
      modelo: r`⟦def⟧ calcular_depreciacao(valor: float, anos: int, taxa: float) -> float:
    return ⟦round⟧(valor * (1 - taxa) ⟦pot⟧ anos, 2)


def resumo_valores(valores: list) -> tuple:
    return ⟦tupla⟧
`,
      slots: {
        def: [
          ok('def', 'Palavra-chave do Python que define uma função.'),
          no('function', 'É a palavra-chave do JavaScript. Em Python: erro de sintaxe.'),
          no('func', 'É a palavra-chave de Go e Swift. Em Python: erro de sintaxe.'),
        ],
        round: [
          ok('round', 'round(x, 2) arredonda para 2 casas decimais — ideal para valores em dinheiro.'),
          no('int', 'Converte para inteiro. Com dois argumentos, o segundo seria a base numérica: TypeError.'),
          no('abs', 'Valor absoluto (sem sinal). Aceita um único argumento: TypeError.'),
        ],
        pot: [
          ok('**', 'Potenciação: (1 - taxa) ** anos aplica a taxa uma vez por ano.'),
          no('^', 'Em Python, ^ é o XOR bit a bit, não potência. Com float: TypeError.'),
          no('*', 'Multiplicação simples: depreciaria proporcionalmente aos anos, sem o efeito composto.'),
        ],
        tupla: [
          ok('max(valores), min(valores), sum(valores)', 'Valores separados por vírgula formam uma tupla: sequência imutável, que protege o registro.'),
          no('[max(valores), min(valores), sum(valores)]', 'Colchetes criam uma lista, que é mutável: qualquer código poderia alterar o resumo depois.'),
          no('{max(valores), min(valores), sum(valores)}', 'Chaves com valores soltos criam um set: sem ordem garantida e sem repetidos.'),
        ],
      },
    },
  ],

  'quest_jr_02_inventario_acesso:src/inventario.py': [
    {
      arquivo: 'src/inventario.py',
      modelo: r`⟦imp⟧


def cadastrar_login(usuarios: dict, login: str, nome: str) -> bool:
    if login ⟦in⟧ usuarios:
        return False
    usuarios⟦chave⟧ = nome
    return True


def valor_total_depreciado(ativos: list, anos: int, taxa: float) -> float:
    total = 0
    for ativo in ativos:
        total += calcular_depreciacao(ativo⟦acesso⟧, anos, taxa)
    return round(total, 2)
`,
      slots: {
        imp: [
          ok('from Funcoes import *', 'Importa todos os nomes do módulo Funcoes.py para uso direto, sem prefixo.'),
          no('import Funcoes.py', 'No import usa-se o nome do módulo sem a extensão. Assim o Python procuraria um submódulo chamado “py”.'),
          no('include Funcoes', 'include é de C/PHP. Em Python: erro de sintaxe.'),
        ],
        in: [
          ok('in', 'Em dicionários, “chave in dict” testa se a chave existe — em O(1).'),
          no('==', 'Compararia o texto do login com o dicionário inteiro: sempre False.'),
          no('is', 'Testa se são o mesmo objeto na memória: sempre False aqui.'),
        ],
        chave: [
          ok('[login]', 'Colchetes acessam (ou criam) a entrada do dicionário para aquela chave.'),
          no('.login', 'Ponto acessa um atributo do objeto. Dicionários não têm atributo “login”: AttributeError.'),
          no('(login)', 'Parênteses chamam uma função. Não se pode atribuir ao resultado de uma chamada.'),
        ],
        acesso: [
          ok('["valor"]', 'Lê o valor associado à chave "valor" do dicionário do ativo.'),
          no('.valor', 'Sintaxe de atributo de objeto. Em um dict: AttributeError.'),
          no('[0]', 'Índice numérico é de lista. Em um dict, procuraria a chave 0: KeyError.'),
        ],
      },
    },
  ],

  'quest_jr_03_relatorios_json:src/relatorios.py': [
    {
      arquivo: 'src/relatorios.py',
      modelo: r`def registrar_log(caminho: str, mensagem: str) -> None:
    ⟦with⟧ open(caminho, ⟦modoa⟧, encoding="utf-8") as f:
        f.write(mensagem + "\n")


def exportar_csv(ativos: list, caminho: str) -> None:
    with open(caminho, ⟦modow⟧, encoding="utf-8") as f:
        f.write("nome;valor\n")
        for ativo in ativos:
            f.write(f"{ativo['nome']};{ativo['valor']}\n")


def parse_linha(linha: str) -> dict:
    partes = linha.strip().⟦split⟧(";")
    return {"nome": partes[0], "valor": ⟦conv⟧(partes[1])}
`,
      slots: {
        with: [
          ok('with', 'Gerenciador de contexto: fecha o arquivo automaticamente ao sair do bloco, mesmo se der erro.'),
          no('try', 'Inicia tratamento de exceções e não aceita “as f” nesse formato: erro de sintaxe.'),
          no('for', 'Laço. “for open(...) as f” não é sintaxe válida.'),
        ],
        modoa: [
          ok('"a"', 'Append: posiciona no final do arquivo e preserva o que já existia. Cria o arquivo se não existir.'),
          no('"w"', 'Write: APAGA o conteúdo anterior toda vez que abre. O log teria só a última mensagem.'),
          no('"r"', 'Read: somente leitura. Falha se o arquivo não existir e não permite gravar.'),
        ],
        modow: [
          ok('"w"', 'Write: recria o arquivo do zero. Certo para a planilha, que é um retrato do estado atual.'),
          no('"a"', 'Append: empilharia uma planilha nova embaixo da antiga, repetindo o cabeçalho.'),
          no('"r"', 'Read: somente leitura. Não cria o arquivo nem permite gravar.'),
        ],
        split: [
          ok('split', 'Quebra o texto no separador e devolve uma lista: "a;b".split(";") → ["a", "b"].'),
          no('find', 'Devolve a POSIÇÃO do separador (um número), não as partes.'),
          no('join', 'Faz o inverso: junta os itens de uma lista usando o texto como separador.'),
        ],
        conv: [
          ok('float', 'Converte texto em número com casas decimais: float("3500.5") → 3500.5.'),
          no('int', 'Converte para inteiro, mas não aceita texto com ponto: int("3500.5") lança ValueError.'),
          no('str', 'Já é texto: continuaria "3500.5" entre aspas, e não daria para fazer contas.'),
        ],
      },
    },
  ],

  'quest_jr_03_relatorios_json:src/persistencia.py': [
    {
      arquivo: 'src/persistencia.py',
      modelo: r`import json
import os


def salvar_json(ativos: list, caminho: str) -> None:
    with open(caminho, "w", encoding="utf-8") as f:
        json.⟦dump⟧(ativos, f)


def carregar_json(caminho: str) -> list:
    if not os.path.⟦exists⟧(caminho):
        return ⟦vazio⟧
    with open(caminho, encoding="utf-8") as f:
        return json.⟦load⟧(f)
`,
      slots: {
        dump: [
          ok('dump', 'Serializa o objeto como JSON e grava direto no arquivo aberto.'),
          no('dumps', 'O “s” é de string: devolve o texto JSON em vez de gravar. Não aceita o arquivo como argumento: TypeError.'),
          no('load', 'Faz o caminho inverso (lê JSON de um arquivo). Recebe um único argumento: TypeError.'),
        ],
        exists: [
          ok('exists', 'Devolve True se o caminho existe no disco.'),
          no('isdir', 'Testa se o caminho é uma PASTA. Para um arquivo devolve False — e o inventário nunca seria lido.'),
          no('getsize', 'Devolve o tamanho em bytes e lança erro quando o arquivo não existe.'),
        ],
        vazio: [
          ok('[]', 'Lista vazia: o mesmo tipo que a função devolve quando há dados. Quem chama pode usar for sem checar nada.'),
          no('None', '“Sem valor”: obrigaria todo código que chama a função a testar None antes de percorrer.'),
          no('{}', 'Dicionário vazio: tipo diferente do esperado (lista).'),
        ],
        load: [
          ok('load', 'Lê o JSON de um arquivo aberto e devolve os objetos Python.'),
          no('loads', 'O “s” é de string: espera um texto, não um arquivo. TypeError.'),
          no('dump', 'Grava em vez de ler, e exige dois argumentos: TypeError.'),
        ],
      },
    },
  ],

  'quest_jr_04_wazeyes:src/wazeyes.py': [
    {
      arquivo: 'src/wazeyes.py',
      modelo: r`import json

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderQuotaExceeded


def geocodificar(endereco: str):
    geolocalizador = Nominatim(user_agent="wazeyes-nexustech")
    ⟦try⟧:
        local = geolocalizador.geocode(endereco)
    ⟦except⟧ GeocoderQuotaExceeded:
        return {"erro": "OVER_QUERY_LIMIT"}
    if local ⟦isnone⟧:
        return None
    return {"latitude": local.latitude, "longitude": local.longitude}


def processar(arquivo_entrada: str, arquivo_saida: str) -> None:
    with open(arquivo_entrada, encoding="utf-8") as f:
        endereco = json.load(f)⟦campo⟧
    saida = {"endereco": endereco}
    saida.update(geocodificar(endereco) or {})
    with open(arquivo_saida, "w", encoding="utf-8") as f:
        json.dump(saida, f)


if __name__ == "__main__":
    processar("entrada.json", "saida.json")
    print("saida.json gerado!")
`,
      slots: {
        try: [
          ok('try', 'Abre um bloco protegido: se algo dentro dele lançar uma exceção, o except pode capturá-la.'),
          no('if', 'Exige uma condição. “if:” sozinho é erro de sintaxe.'),
          no('with', 'Gerenciador de contexto (arquivos, conexões). Não captura exceções.'),
        ],
        except: [
          ok('except', 'Captura a exceção indicada e executa o plano B, sem derrubar o programa.'),
          no('catch', 'É a palavra de Java e JavaScript. Em Python: erro de sintaxe.'),
          no('else', 'No try, o else roda quando NÃO houve erro, e não aceita o nome de uma exceção.'),
        ],
        isnone: [
          ok('is None', 'Forma correta de testar ausência de valor: o geocode devolve None quando não encontra.'),
          no('== 0', 'Compara com o número zero. None não é igual a 0, então o código seguiria e quebraria em local.latitude.'),
          no('is False', 'None e False são objetos diferentes: o teste nunca seria verdadeiro.'),
        ],
        campo: [
          ok('["endereco"]', 'Lê o valor da chave "endereco" do dicionário carregado do JSON.'),
          no('.endereco', 'O JSON vira um dict, que não tem atributos com o nome das chaves: AttributeError.'),
          no('[0]', 'Índice de lista. Em um dict, procuraria a chave 0: KeyError.'),
        ],
      },
    },
  ],

  'quest_jr_04_wazeyes:src/sistema.py': [
    {
      arquivo: 'src/sistema.py',
      modelo: r`import os
import platform


def info_sistema() -> dict:
    return {
        "sistema": platform.⟦sys⟧(),
        "python": platform.⟦ver⟧(),
        "diretorio": os.⟦cwd⟧(),
    }
`,
      slots: {
        sys: [
          ok('system', 'Nome do sistema operacional: Windows, Linux, Darwin (macOS)... ou Emscripten, aqui no navegador.'),
          no('machine', 'Arquitetura do processador (x86_64, arm64, wasm32), não o sistema.'),
          no('node', 'Nome da máquina na rede (hostname).'),
        ],
        ver: [
          ok('python_version', 'Versão do interpretador Python em execução, como "3.12.1".'),
          no('version', 'Versão de build do sistema operacional, não do Python.'),
          no('release', 'Release do sistema operacional (por exemplo, a versão do kernel).'),
        ],
        cwd: [
          ok('getcwd', 'Get Current Working Directory: a pasta a partir da qual o script está rodando.'),
          no('listdir', 'Lista os arquivos de uma pasta: devolve uma lista, não o caminho.'),
          no('getpid', 'Devolve o número (ID) do processo em execução.'),
        ],
      },
    },
  ],

  'quest_jr_05_git_rede:src/monitor.py': [
    {
      arquivo: 'src/monitor.py',
      modelo: r`import socket


def verificar_porta(host: str, porta: int, timeout: float = 1.0) -> bool:
    s = socket.socket(socket.AF_INET, socket.⟦tipo⟧)
    s.settimeout(timeout)
    resultado = s.⟦con⟧((host, porta))
    s.⟦fim⟧()
    return resultado == ⟦zero⟧


def escanear(host: str, portas: list) -> list:
    return [p for p in portas if verificar_porta(host, p)]


def resolver_dns(nome: str):
    try:
        return socket.⟦dns⟧(nome)
    except socket.gaierror:
        return None
`,
      slots: {
        tipo: [
          ok('SOCK_STREAM', 'Socket TCP: orientado a conexão, com handshake e entrega garantida.'),
          no('SOCK_DGRAM', 'Socket UDP: envia datagramas sem conexão — não há como saber se a porta “aceitou”.'),
          no('SOCK_RAW', 'Socket bruto, para montar pacotes à mão. Exige privilégios de administrador.'),
        ],
        con: [
          ok('connect_ex', 'Tenta conectar e devolve um código: 0 se deu certo, ou o número do erro. Não lança exceção.'),
          no('connect', 'Também conecta, mas lança exceção quando a porta está fechada e não devolve código (None).'),
          no('bind', 'Reserva uma porta LOCAL para atuar como servidor. Não testa uma porta remota.'),
        ],
        fim: [
          ok('close', 'Fecha o socket e libera o recurso no sistema operacional.'),
          no('listen', 'Coloca um socket de servidor em modo de escuta. Não encerra nada.'),
          no('detach', 'Solta o descritor do socket sem fechá-lo: a conexão fica vazando.'),
        ],
        zero: [
          ok('0', 'Convenção de sistemas: código 0 significa sucesso.'),
          no('1', 'Qualquer valor diferente de zero é um código de erro.'),
          no('None', 'connect_ex sempre devolve um número; nunca seria igual a None.'),
        ],
        dns: [
          ok('gethostbyname', 'Resolve um nome (api.empresa.com) para o endereço IP, consultando o DNS.'),
          no('gethostname', 'Devolve o nome da PRÓPRIA máquina e não aceita argumentos: TypeError.'),
          no('getservbyname', 'Converte o nome de um serviço na porta padrão ("http" → 80).'),
        ],
      },
    },
  ],

  // ------------------------------------------------------------------- PLENO
  [`quest_pl_01_oo_encapsulamento:${MODEL}ContaBancaria.java`]: [
    {
      arquivo: `${MODEL}ContaBancaria.java`,
      modelo: `package br.com.nexustech.model;

public class ContaBancaria {

    ⟦vis⟧ String titular;
    ⟦vis⟧ double saldo;

    public ContaBancaria() {
    }

    public ContaBancaria(String titular, double saldoInicial) {
        ⟦this⟧.titular = titular;
        ⟦this⟧.saldo = saldoInicial;
    }

    public String getTitular() {
        return titular;
    }

    public void setTitular(String titular) {
        this.titular = titular;
    }

    public double getSaldo() {
        return saldo;
    }

    public ⟦void⟧ depositar(double valor) {
        if (valor > 0) {
            saldo += valor;
        }
    }

    public ⟦bool⟧ sacar(double valor) {
        if (valor <= 0 ⟦ou⟧ valor > saldo) {
            return false;
        }
        saldo -= valor;
        return true;
    }
}
`,
      slots: {
        vis: [
          ok('private', 'Só a própria classe enxerga o atributo. É a base do encapsulamento.'),
          no('public', 'Qualquer classe do sistema lê e altera o atributo diretamente — foi assim que surgiu o saldo negativo.'),
          no('protected', 'Libera o acesso para as subclasses e para todas as classes do mesmo pacote.'),
        ],
        this: [
          ok('this', 'Referência ao objeto atual: this.titular é o atributo; titular, sozinho, é o parâmetro.'),
          no('super', 'Referência à superclasse. ContaBancaria não herda esses atributos de ninguém.'),
          no('self', 'É a convenção do Python. Em Java não existe: erro de compilação.'),
        ],
        void: [
          ok('void', 'O método executa uma ação e não devolve nenhum valor.'),
          no('double', 'Prometeria devolver um número, mas o método não tem return: erro de compilação.'),
          no('static', 'Método de classe, sem objeto: não teria acesso ao saldo de uma conta específica.'),
        ],
        bool: [
          ok('boolean', 'Tipo lógico (true/false): informa a quem chamou se o saque foi autorizado.'),
          no('void', 'Não permite devolver valor: “return false” seria erro de compilação.'),
          no('String', 'Texto. O método devolve true/false, que não são String: erro de compilação.'),
        ],
        ou: [
          ok('||', 'OU lógico: basta uma das condições (valor inválido OU saldo insuficiente) para negar o saque.'),
          no('&&', 'E lógico: só negaria se as duas fossem verdadeiras ao mesmo tempo — o que é impossível aqui.'),
          no('==', 'Compararia os dois resultados booleanos entre si, o que não faz sentido para a regra.'),
        ],
      },
    },
  ],

  [`quest_pl_02_heranca_polimorfismo:${MODEL}Produto.java`]: [
    {
      arquivo: `${MODEL}Produto.java`,
      modelo: `package br.com.nexustech.model;

public ⟦abs⟧ class Produto {

    protected String nome;
    protected double preco;

    public Produto(String nome, double preco) {
        this.nome = nome;
        this.preco = preco;
    }

    public ⟦abs⟧ String getFormaEntrega();
}
`,
      slots: {
        abs: [
          ok('abstract', 'Na classe: não pode ser instanciada. No método: é só o contrato, sem corpo — cada subclasse é obrigada a implementar.'),
          no('final', 'O oposto: classe final não pode ser herdada, e método final não pode ser sobrescrito.'),
          no('static', 'Pertence à classe, não ao objeto. Método static não participa do polimorfismo.'),
        ],
      },
    },
    subclasse('Guitarra', 'Correios - caixa reforçada'),
    subclasse('Bateria', 'Transportadora - volume grande'),
  ],

  'quest_pl_02_heranca_polimorfismo:src/algoritmos.py': [
    {
      arquivo: 'src/algoritmos.py',
      modelo: r`def bubble_sort(lista: list) -> list:
    nova = lista⟦copia⟧
    for i in range(len(nova)):
        for j in range(len(nova) - 1 - i):
            if nova[j] ⟦maior⟧ nova[j + 1]:
                nova[j], nova[j + 1] = ⟦troca⟧
    return nova


def busca_binaria(lista: list, alvo) -> int:
    inicio, fim = 0, len(lista) - 1
    while inicio ⟦le⟧ fim:
        meio = (inicio + fim) ⟦div⟧ 2
        if lista[meio] == alvo:
            return meio
        if lista[meio] < alvo:
            inicio = ⟦avanca⟧
        else:
            fim = meio - 1
    return -1
`,
      slots: {
        copia: [
          ok('[:]', 'Fatia do início ao fim: cria uma CÓPIA da lista, preservando a original.'),
          no('[0]', 'Pega só o primeiro elemento: “nova” deixaria de ser uma lista.'),
          no('[1:]', 'Copia a partir do segundo elemento: o primeiro item seria perdido.'),
        ],
        maior: [
          ok('>', 'Se o vizinho da esquerda é maior, os dois estão fora de ordem e devem ser trocados.'),
          no('<', 'Trocaria quando já estão em ordem: o resultado sairia decrescente.'),
          no('==', 'Só “trocaria” elementos iguais — ou seja, nunca ordenaria nada.'),
        ],
        troca: [
          ok('nova[j + 1], nova[j]', 'Atribuição múltipla: troca os dois valores de posição sem precisar de variável auxiliar.'),
          no('nova[j], nova[j + 1]', 'Atribui cada posição a ela mesma: nada muda.'),
          no('nova[j + 1], nova[j + 1]', 'Copia o mesmo valor para as duas posições: um dos elementos é perdido.'),
        ],
        le: [
          ok('<=', 'Enquanto o intervalo tiver pelo menos um elemento (inicio == fim ainda é um candidato).'),
          no('<', 'Para um passo antes: o último candidato nunca é examinado.'),
          no('!=', 'Quando o alvo não existe, inicio ultrapassa fim e o laço continua: índice fora da lista.'),
        ],
        div: [
          ok('//', 'Divisão inteira: descarta a parte decimal. Índices de lista precisam ser int.'),
          no('/', 'Divisão real: devolve float (3.5). Usar float como índice lança TypeError.'),
          no('%', 'Resto da divisão: devolveria só 0 ou 1.'),
        ],
        avanca: [
          ok('meio + 1', 'O meio já foi examinado: descarta a metade esquerda junto com ele.'),
          no('meio', 'Sem o +1 o intervalo para de encolher: laço infinito.'),
          no('meio - 1', 'Anda para o lado errado: voltaria para a metade que já foi descartada.'),
        ],
      },
    },
  ],

  'quest_pl_03_modelagem_ddl:sql/sip_ddl.sql': [
    {
      arquivo: 'sql/sip_ddl.sql',
      modelo: `CREATE TABLE departamento (
  id_departamento NUMBER(6),
  nome ⟦tipo⟧(60) ⟦nn⟧,
  CONSTRAINT pk_departamento ⟦pk⟧ (id_departamento),
  CONSTRAINT un_departamento_nome ⟦un⟧ (nome)
);

CREATE TABLE funcionario (
  id_funcionario NUMBER(6),
  nome VARCHAR2(80) NOT NULL,
  salario NUMBER(10,2),
  id_departamento NUMBER(6),
  CONSTRAINT pk_funcionario PRIMARY KEY (id_funcionario),
  CONSTRAINT ck_funcionario_salario ⟦ck⟧ (salario > 0),
  CONSTRAINT fk_funcionario_departamento ⟦fk⟧ (id_departamento) ⟦ref⟧ departamento (id_departamento)
);

CREATE TABLE projeto (
  id_projeto NUMBER(6),
  nome VARCHAR2(80) NOT NULL,
  dt_inicio DATE NOT NULL,
  dt_termino DATE,
  id_departamento NUMBER(6),
  CONSTRAINT pk_projeto PRIMARY KEY (id_projeto),
  CONSTRAINT ck_projeto_datas CHECK (dt_termino ⟦gt⟧ dt_inicio),
  CONSTRAINT fk_projeto_departamento FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)
);
`,
      slots: {
        tipo: [
          ok('VARCHAR2', 'Texto de tamanho variável: ocupa só o que foi digitado, até o limite.'),
          no('CHAR', 'Texto de tamanho fixo: completa com espaços até 60 posições.'),
          no('CLOB', 'Texto muito longo (contratos, laudos). Não aceita tamanho e tem restrições em UNIQUE.'),
        ],
        nn: [
          ok('NOT NULL', 'Preenchimento obrigatório: o banco rejeita o registro sem esse valor.'),
          no('NULL', 'Declara explicitamente que a coluna ACEITA ficar vazia.'),
          no('DEFAULT NULL', 'Define vazio como valor padrão: o departamento poderia ficar sem nome.'),
        ],
        pk: [
          ok('PRIMARY KEY', 'Chave primária: identifica cada linha. Única e obrigatória; só existe uma por tabela.'),
          no('UNIQUE', 'Impede repetição, mas aceita NULL e não define o identificador da tabela.'),
          no('INDEX', 'Índice acelera buscas; não é uma constraint e não cabe nesta sintaxe.'),
        ],
        un: [
          ok('UNIQUE', 'Impede dois departamentos com o mesmo nome.'),
          no('PRIMARY KEY', 'A tabela já tem uma chave primária — e só pode haver uma.'),
          no('NOT NULL', 'É uma restrição de coluna e não aceita uma lista de colunas entre parênteses.'),
        ],
        ck: [
          ok('CHECK', 'Regra de validação: o banco só aceita linhas em que a condição é verdadeira.'),
          no('UNIQUE', 'Espera uma lista de colunas, não uma condição.'),
          no('DEFAULT', 'Define um valor padrão; não valida nada.'),
        ],
        fk: [
          ok('FOREIGN KEY', 'Chave estrangeira: o valor precisa existir na tabela referenciada.'),
          no('PRIMARY KEY', 'A tabela já tem chave primária, e PK não aponta para outra tabela.'),
          no('CHECK', 'Valida uma condição dentro da própria linha; não consulta outra tabela.'),
        ],
        ref: [
          ok('REFERENCES', 'Indica a tabela e a coluna “pai” para onde a chave estrangeira aponta.'),
          no('JOIN', 'JOIN é usado em consultas (SELECT), não na definição de tabelas.'),
          no('FROM', 'FROM indica a origem dos dados em uma consulta, não em uma constraint.'),
        ],
        gt: [
          ok('>', 'O término precisa ser posterior ao início.'),
          no('<', 'Só aceitaria projetos que terminam antes de começar.'),
          no('=', 'Só aceitaria projetos que começam e terminam no mesmo dia.'),
        ],
      },
    },
  ],

  'quest_pl_04_dml_joins:sql/01_carga.sql': [
    {
      arquivo: 'sql/01_carga.sql',
      modelo: `⟦ins⟧ departamento (id_departamento, nome) ⟦val⟧ (1, 'TI');
INSERT INTO departamento (id_departamento, nome) VALUES (2, 'RH');
INSERT INTO departamento (id_departamento, nome) VALUES (3, 'Marketing');

INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (1, 'Ana', 8500, 1);
INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (2, 'Bruno', 4200, 1);
INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (3, 'Carla', 6100, 2);
INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (4, 'Diego', 3900, ⟦nulo⟧);

⟦upd⟧ funcionario ⟦set⟧ salario = salario * 1.10 ⟦where⟧;
`,
      slots: {
        ins: [
          ok('INSERT INTO', 'Comando DML que adiciona uma nova linha à tabela.'),
          no('ADD TO', 'Não existe em SQL: erro de sintaxe.'),
          no('CREATE ROW', 'CREATE é DDL (cria tabelas, índices...). Linhas são inseridas com INSERT.'),
        ],
        val: [
          ok('VALUES', 'Introduz os valores, na mesma ordem das colunas listadas.'),
          no('SET', 'SET pertence ao UPDATE (coluna = valor).'),
          no('WITH', 'WITH inicia uma subconsulta nomeada (CTE). Aqui é erro de sintaxe.'),
        ],
        nulo: [
          ok('NULL', 'Ausência de valor: o Diego ainda não tem departamento. A FK aceita NULL.'),
          no("'NULL'", 'Entre aspas é o TEXTO “NULL”. A FK procuraria um departamento com esse id: violação.'),
          no('0', 'Zero é um valor. Não existe departamento 0: a FK rejeita.'),
        ],
        upd: [
          ok('UPDATE', 'Comando DML que altera linhas existentes.'),
          no('ALTER TABLE', 'DDL: altera a ESTRUTURA da tabela (colunas, constraints), não os dados.'),
          no('MODIFY', 'Não é um comando SQL: erro de sintaxe.'),
        ],
        set: [
          ok('SET', 'Define quais colunas mudam e seus novos valores.'),
          no('VALUES', 'Pertence ao INSERT.'),
          no('WHERE', 'O filtro vem depois do SET, não no lugar dele.'),
        ],
        where: [
          ok('WHERE id_departamento = 1', 'Restringe o reajuste às linhas do departamento 1 (TI).'),
          no('', 'Sem WHERE, o UPDATE atinge TODAS as linhas da tabela: a empresa inteira ganharia aumento.'),
          no("WHERE nome = 'TI'", 'Na tabela funcionario, “nome” é o nome da pessoa. Ninguém se chama TI: zero linhas alteradas.'),
        ],
      },
    },
  ],

  'quest_pl_04_dml_joins:sql/02_relatorio_join.sql': [
    {
      arquivo: 'sql/02_relatorio_join.sql',
      modelo: `SELECT f.nome, d.nome
FROM funcionario f
⟦join⟧ departamento d ⟦on⟧ f.id_departamento = d.id_departamento
⟦order⟧ f.salario ⟦dir⟧;
`,
      slots: {
        join: [
          ok('INNER JOIN', 'Interseção: só as linhas que têm correspondência nas duas tabelas.'),
          no('LEFT JOIN', 'Mantém TODOS os funcionários: o Diego apareceria com departamento NULL.'),
          no('CROSS JOIN', 'Produto cartesiano: combina cada linha de uma tabela com todas as da outra.'),
        ],
        on: [
          ok('ON', 'Define a condição que liga as duas tabelas.'),
          no('USING', 'Forma abreviada que espera só o nome da coluna entre parênteses: USING (id_departamento).'),
          no('WITH', 'Não faz parte da sintaxe do JOIN: erro de sintaxe.'),
        ],
        order: [
          ok('ORDER BY', 'Ordena o resultado pela coluna indicada.'),
          no('GROUP BY', 'Agrupa linhas para funções de agregação (SUM, COUNT). Não ordena.'),
          no('SORT BY', 'Não existe em SQL padrão: erro de sintaxe.'),
        ],
        dir: [
          ok('DESC', 'Decrescente: do maior para o menor.'),
          no('ASC', 'Crescente: do menor para o maior.'),
          no('', 'Sem direção, o padrão do ORDER BY é ASC (crescente).'),
        ],
      },
    },
  ],

  'quest_pl_04_dml_joins:sql/03_departamentos_orfaos.sql': [
    {
      arquivo: 'sql/03_departamentos_orfaos.sql',
      modelo: `SELECT d.nome
FROM departamento d
⟦join⟧ funcionario f ON f.id_departamento = d.id_departamento
WHERE f.id_funcionario ⟦nulo⟧;
`,
      slots: {
        join: [
          ok('LEFT JOIN', 'Mantém todos os departamentos (lado esquerdo); onde não há funcionário, as colunas de f vêm NULL.'),
          no('INNER JOIN', 'Só devolve departamentos COM funcionário: os órfãos, que procuramos, ficam de fora.'),
          no('RIGHT JOIN', 'Mantém todos os funcionários (lado direito), não os departamentos.'),
        ],
        nulo: [
          ok('IS NULL', 'Único jeito correto de testar ausência de valor em SQL.'),
          no('= NULL', 'Nada é “igual” a NULL: a comparação nunca é verdadeira e o resultado vem vazio.'),
          no('IS NOT NULL', 'O contrário: lista os departamentos que TÊM funcionário (e repetidos).'),
        ],
      },
    },
  ],

  'quest_pl_05_mongodb:mongo/catalogo.mongodb.js': [
    {
      arquivo: 'mongo/catalogo.mongodb.js',
      modelo: `use loja

db.⟦create⟧("produtos", {
  validator: {
    ⟦schema⟧: {
      bsonType: "object",
      ⟦req⟧: ["nome", "categoria", "preco"],
      properties: {
        preco: { bsonType: ⟦num⟧, ⟦min⟧: 0 }
      }
    }
  }
})

db.produtos.⟦many⟧([
  { nome: "Guitarra Stratocaster", categoria: "instrumento", preco: 4500, atributos: { cordas: 6 } },
  { nome: "Bateria Acústica", categoria: "instrumento", preco: 7200, atributos: { pecas: 5 } },
  { nome: "Curso de Violão", categoria: "curso", preco: 199.9, atributos: { horas: 40 } }
])

db.clientes.insertOne({
  nome: "Lia Prado",
  ⟦end⟧: [
    { rua: "Rua Augusta, 500", cidade: "São Paulo" },
    { rua: "Av. Beira Mar, 10", cidade: "Santos" }
  ]
})
`,
      slots: {
        create: [
          ok('createCollection', 'Cria a coleção explicitamente — necessário quando queremos configurar um validador.'),
          no('createTable', 'Tabela é conceito do modelo relacional. No MongoDB o método não existe.'),
          no('insertOne', 'Insere um documento em uma coleção; não é chamado direto em db.'),
        ],
        schema: [
          ok('$jsonSchema', 'Operador que valida a estrutura de cada documento gravado na coleção.'),
          no('$schema', 'Não é um operador de validação do MongoDB: nada seria validado.'),
          no('$where', 'Operador de consulta que executa JavaScript; não define esquema.'),
        ],
        req: [
          ok('required', 'Lista os campos que todo documento é obrigado a ter.'),
          no('notNull', 'É vocabulário de SQL. O JSON Schema ignora a palavra, e nada ficaria obrigatório.'),
          no('mandatory', 'Não é palavra-chave do JSON Schema: seria ignorada.'),
        ],
        num: [
          ok('"number"', 'Aceita qualquer tipo numérico (int, long, double, decimal).'),
          no('"string"', 'Exigiria o preço como texto: os três produtos seriam rejeitados.'),
          no('"object"', 'Exigiria um subdocumento no lugar do preço.'),
        ],
        min: [
          ok('minimum', 'Menor valor aceito: com 0, preços negativos são rejeitados.'),
          no('min', 'Não é palavra-chave do JSON Schema: seria ignorada, e preço negativo passaria.'),
          no('$gte', 'É operador de CONSULTA (maior ou igual), não de esquema.'),
        ],
        many: [
          ok('insertMany', 'Insere vários documentos de uma vez, recebendo um array.'),
          no('insertOne', 'Espera um único documento { }, não um array.'),
          no('find', 'Consulta documentos; não insere nada.'),
        ],
        end: [
          ok('enderecos', 'Array de subdocumentos aninhados (embedded): lido junto com o cliente, em uma só consulta.'),
          no('endereco_ids', 'Seria o modelo por referência, com os endereços em outra coleção — exige uma segunda consulta.'),
          no('$enderecos', 'Nomes de campo não podem começar com $: o cifrão é reservado para operadores.'),
        ],
      },
    },
  ],

  'quest_pl_06_fullstack_fintech:src/api/contrato.ts': [
    {
      arquivo: 'src/api/contrato.ts',
      modelo: `export ⟦iface⟧ ContaDTO {
  id: ⟦num⟧;
  titular: string;
  saldo: number;
  ativa: ⟦bool⟧;
}

export ⟦async⟧ function buscarConta(id: number): ⟦prom⟧<ContaDTO> {
  const resposta = ⟦await⟧ fetch("/api/contas/" + id);
  return (await resposta.json()) as ContaDTO;
}
`,
      slots: {
        iface: [
          ok('interface', 'Descreve o FORMATO de um objeto. Só existe em tempo de compilação: não gera código JavaScript.'),
          no('class', 'Cria um tipo com implementação. Os campos sem valor inicial seriam erro no modo strict.'),
          no('function', 'Declara uma função, não um tipo de dados.'),
        ],
        num: [
          ok('number', 'Único tipo numérico do TypeScript (inteiros e decimais).'),
          no('int', 'Não existe em TypeScript: erro de compilação.'),
          no('any', 'Desliga a checagem de tipos para o campo — justamente a proteção que queremos.'),
        ],
        bool: [
          ok('boolean', 'Tipo lógico: true ou false.'),
          no('bool', 'É o nome usado em C# e Python. Em TypeScript não existe.'),
          no('string', 'Texto: aceitaria "false", que em um if é considerado verdadeiro.'),
        ],
        async: [
          ok('async', 'Marca a função como assíncrona: ela devolve uma Promise e permite usar await dentro.'),
          no('static', 'Só vale para membros de classe.'),
          no('void', 'É um tipo de retorno, não um modificador de função.'),
        ],
        prom: [
          ok('Promise', 'Representa um valor que chegará no futuro (a resposta da rede).'),
          no('Array', 'Uma lista de contas. A função devolve uma só — e de forma assíncrona.'),
          no('Await', 'Não existe esse tipo. await é um operador.'),
        ],
        await: [
          ok('await', 'Pausa a função até a Promise resolver e entrega o resultado.'),
          no('return', 'Encerraria a função aqui, devolvendo a resposta bruta.'),
          no('async', 'Marca funções; não pode ser usado diante de uma chamada.'),
        ],
      },
    },
  ],

  'quest_pl_06_fullstack_fintech:src/components/ContaCard.tsx': [
    {
      arquivo: 'src/components/ContaCard.tsx',
      modelo: `import { useState } from "react";
import type { ContaDTO } from "../api/contrato";

export function ContaCard({ conta }: { conta: ⟦tipo⟧ }) {
  const [visivel, setVisivel] = ⟦hook⟧(false);
  return (
    <div ⟦cls⟧="rounded-lg bg-white p-4 shadow">
      <h2 className="font-bold">{conta.titular}</h2>
      <p>{visivel ? conta.saldo : "••••"}</p>
      <button ⟦click⟧={() => setVisivel(!visivel)}>Mostrar/ocultar</button>
    </div>
  );
}
`,
      slots: {
        tipo: [
          ok('ContaDTO', 'O contrato da API: se o back-end mudar um campo, o compilador acusa aqui.'),
          no('any', 'Aceita qualquer coisa: o erro de contrato só apareceria na tela do usuário.'),
          no('string', 'Texto não tem .titular nem .saldo: erro de compilação.'),
        ],
        hook: [
          ok('useState', 'Hook de estado: devolve o valor atual e a função que o altera. Mudou o estado, o React re-renderiza.'),
          no('useEffect', 'Hook de efeitos colaterais (buscar dados, timers). Não devolve um par [valor, setter].'),
          no('useRef', 'Guarda um valor que NÃO provoca re-renderização — a tela não atualizaria.'),
        ],
        cls: [
          ok('className', 'No JSX, o atributo de classes CSS se chama className (class é palavra reservada do JavaScript).'),
          no('class', 'Funciona em HTML puro; em JSX gera aviso e é erro de tipos no TypeScript.'),
          no('style', 'Espera um objeto de estilos { }, não uma lista de classes.'),
        ],
        click: [
          ok('onClick', 'Evento de clique no React: em camelCase, recebendo uma função.'),
          no('onclick', 'É a grafia do HTML. No React o evento não é registrado.'),
          no('href', 'Atributo de links (<a>): define um destino, não uma ação.'),
        ],
      },
    },
  ],

  // ------------------------------------------------------------------ SÊNIOR
  'quest_sr_01_microsservicos:gateway/balanceador.py': [
    {
      arquivo: 'gateway/balanceador.py',
      modelo: r`class BalanceadorRoundRobin:
    def __init__(self):
        self.instancias = []
        self.indice = 0

    def registrar(self, porta: int) -> None:
        if porta ⟦notin⟧ self.instancias:
            self.instancias.⟦add⟧(porta)

    def remover(self, porta: int) -> None:
        if porta in self.instancias:
            self.instancias.remove(porta)

    def proxima(self) -> int:
        if not self.instancias:
            ⟦raise⟧ RuntimeError("Nenhuma instância disponível")
        porta = self.instancias[self.indice ⟦mod⟧ len(self.instancias)]
        self.indice += 1
        return porta
`,
      slots: {
        notin: [
          ok('not in', 'Só registra se a instância ainda não estiver na lista: evita duplicatas.'),
          no('in', 'Só “registraria” o que já está registrado: a lista ficaria vazia para sempre.'),
          no('==', 'Compara um número com a lista inteira: sempre False.'),
        ],
        add: [
          ok('append', 'Adiciona um item ao final da lista.'),
          no('extend', 'Espera uma sequência para concatenar. Com um int: TypeError.'),
          no('remove', 'Remove o item — e lança ValueError porque ele ainda não está na lista.'),
        ],
        raise: [
          ok('raise', 'Lança a exceção: interrompe o fluxo e avisa quem chamou que não há como atender.'),
          no('return', 'Devolveria o objeto de erro como se fosse uma porta válida. O chamador nem perceberia.'),
          no('assert', 'Um objeto de exceção é “verdadeiro”: o assert passa, e a linha seguinte divide por zero.'),
        ],
        mod: [
          ok('%', 'Resto da divisão: faz o índice “dar a volta” (0, 1, 2, 0, 1, 2...).'),
          no('//', 'Divisão inteira: o índice ficaria parado em 0 por várias chamadas e depois em 1...'),
          no('*', 'Multiplicação: o índice dispara para fora da lista: IndexError.'),
        ],
      },
    },
  ],

  'quest_sr_01_microsservicos:servicos/entregas.py': [
    {
      arquivo: 'servicos/entregas.py',
      modelo: r`FLUXO = ["EM_SEPARACAO", "EM_TRANSPORTE", "ENTREGUE"]


def avancar_status(status_atual: str) -> str:
    i = FLUXO.⟦index⟧(status_atual)
    if i == len(FLUXO) ⟦menos⟧:
        raise ⟦erro⟧("Pedido já entregue")
    return FLUXO[⟦prox⟧]
`,
      slots: {
        index: [
          ok('index', 'Devolve a posição do item na lista — e lança ValueError sozinho se ele não existir.'),
          no('count', 'Conta quantas vezes o item aparece (0 ou 1), não onde ele está.'),
          no('find', 'find é método de string. Listas não têm: AttributeError.'),
        ],
        menos: [
          ok('- 1', 'O último índice de uma lista é sempre tamanho - 1 (a contagem começa em 0).'),
          no('', 'Um índice nunca é igual ao tamanho da lista: o teste jamais seria verdadeiro.'),
          no('+ 1', 'Passa ainda mais longe: o teste jamais seria verdadeiro.'),
        ],
        erro: [
          ok('ValueError', 'O argumento tem o tipo certo (str), mas um valor inaceitável para a operação.'),
          no('KeyError', 'É o erro de chave ausente em dicionários. Semântica errada para este caso.'),
          no('print', 'print devolve None, e “raise None” lança TypeError.'),
        ],
        prox: [
          ok('i + 1', 'A posição seguinte no fluxo.'),
          no('i', 'A própria posição: o status nunca avançaria.'),
          no('-1', 'Índice negativo conta a partir do fim: pularia direto para ENTREGUE.'),
        ],
      },
    },
  ],

  'quest_sr_02_replica_sets:cluster/eleicao.py': [
    {
      arquivo: 'cluster/eleicao.py',
      modelo: r`def eleger_primario(nos: list):
    ativos = [n for n in nos if n["ativo"]]
    if len(ativos) ⟦maioria⟧ len(nos) / 2:
        return None
    for n in ativos:
        if n["tipo"] == ⟦prim⟧:
            return n["nome"]
    candidatos = [n for n in ativos if n["tipo"] == ⟦cand⟧]
    if not candidatos:
        return None
    return ⟦escolha⟧(candidatos, key=lambda n: n["optime"])["nome"]
`,
      slots: {
        maioria: [
          ok('<=', 'Metade exata NÃO é maioria: com 1 de 2 nós, ninguém pode ser eleito.'),
          no('<', 'Trataria o empate (1 de 2) como maioria. Duas metades isoladas elegeriam um primário cada: split-brain.'),
          no('>=', 'Invertido: sem primário justamente quando o cluster está saudável.'),
        ],
        prim: [
          ok('"primary"', 'Se o primário atual está ativo e há maioria, ele continua no cargo: sem eleição.'),
          no('"secondary"', 'Devolveria o primeiro secundário da lista, derrubando um primário saudável.'),
          no('"arbiter"', 'O árbitro não guarda dados: jamais pode ser primário.'),
        ],
        cand: [
          ok('"secondary"', 'Só nós com cópia dos dados podem assumir as escritas.'),
          no('"arbiter"', 'O árbitro vota, mas não tem dados para servir.'),
          no('"primary"', 'O primário caiu: não está entre os ativos, e a lista ficaria vazia.'),
        ],
        escolha: [
          ok('max', 'Maior optime = réplica mais atualizada: elegê-la minimiza a perda de escritas.'),
          no('min', 'Elegeria a réplica mais ATRASADA, descartando escritas já replicadas nas outras.'),
          no('sorted', 'Devolve a lista ordenada, não um nó. Indexar uma lista com "nome": TypeError.'),
        ],
      },
    },
  ],

  'quest_sr_03_docker_kubernetes:Dockerfile': [
    {
      arquivo: 'Dockerfile',
      modelo: `FROM ⟦base⟧

WORKDIR /app

COPY ⟦req⟧ .
RUN pip install -r requirements.txt

COPY . .

⟦senha⟧

⟦porta⟧ 8000
⟦cmd⟧ ["python", "main.py"]
`,
      slots: {
        base: [
          ok('python:3.12-slim', 'Variante enxuta: só o necessário para rodar Python (cerca de 130 MB), com versão fixa.'),
          no('python:3.12', 'Imagem completa, com compiladores e ferramentas: mais de 1 GB.'),
          no('ubuntu:latest', 'Não traz Python instalado, e “latest” muda com o tempo: builds não reproduzíveis.'),
        ],
        req: [
          ok('requirements.txt', 'Copia só a lista de dependências: a camada do pip install fica em cache enquanto ela não mudar.'),
          no('.', 'Copia o projeto inteiro antes do pip install: qualquer mudança de código reinstala tudo.'),
          no('main.py', 'O pip install precisa do requirements.txt, que ainda não estaria na imagem.'),
        ],
        senha: [
          ok('', 'Nenhuma linha: o segredo entra só na execução, com docker run -e DB_PASSWORD=...'),
          no('ENV DB_PASSWORD=nexus@2025', 'Grava a senha em uma camada da imagem: visível para qualquer um com docker history.'),
          no('ARG DB_PASSWORD=nexus@2025', 'ARG também fica registrado no histórico de build da imagem.'),
        ],
        porta: [
          ok('EXPOSE', 'Documenta a porta em que o contêiner escuta. A publicação real é feita com -p no docker run.'),
          no('PORT', 'Não é uma instrução do Dockerfile: o build falha.'),
          no('ENV', 'Define variável de ambiente e exige o formato NOME=valor.'),
        ],
        cmd: [
          ok('CMD', 'Comando padrão executado quando o CONTÊINER inicia.'),
          no('RUN', 'Executa durante o BUILD: o serviço subiria (e travaria) na construção da imagem.'),
          no('COPY', 'Copia arquivos para a imagem; não executa nada.'),
        ],
      },
    },
  ],

  'quest_sr_03_docker_kubernetes:k8s/deployment.yaml': [
    {
      arquivo: 'k8s/deployment.yaml',
      modelo: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: pedidos
spec:
  ⟦rep⟧: 3
  selector:
    matchLabels:
      app: pedidos
  template:
    metadata:
      labels:
        app: pedidos
    spec:
      containers:
        - name: pedidos
          ⟦img⟧: nexustech/pedidos:1.0
          ports:
            - ⟦port⟧: 8000
`,
      slots: {
        rep: [
          ok('replicas', 'Quantidade desejada de pods. O Kubernetes cria ou remove pods para manter esse número.'),
          no('instances', 'Não é um campo do Deployment: o manifesto seria rejeitado.'),
          no('copies', 'Não é um campo do Deployment: o manifesto seria rejeitado.'),
        ],
        img: [
          ok('image', 'Imagem (repositório:tag) que o contêiner vai executar.'),
          no('container', 'Não é um campo válido: a imagem é informada em “image”.'),
          no('from', 'FROM é instrução do Dockerfile, não do manifesto Kubernetes.'),
        ],
        port: [
          ok('containerPort', 'Porta em que a aplicação escuta DENTRO do contêiner.'),
          no('port', 'É o campo usado em um Service, não na lista de portas do contêiner.'),
          no('expose', 'EXPOSE é do Dockerfile; no manifesto o campo é containerPort.'),
        ],
      },
    },
  ],

  'quest_sr_04_cloud_deploy:infra/autoscaling.py': [
    {
      arquivo: 'infra/autoscaling.py',
      modelo: r`import math


def calcular_instancias(rps: float, capacidade_por_instancia: float, minimo: int, maximo: int) -> int:
    necessarias = math.⟦ceil⟧(rps / capacidade_por_instancia)
    return ⟦piso⟧(minimo, ⟦teto⟧(maximo, necessarias))


def custo_elastico(rps_por_hora: list, capacidade_por_instancia: float, minimo: int, maximo: int, preco_hora: float) -> float:
    total = ⟦soma⟧(calcular_instancias(rps, capacidade_por_instancia, minimo, maximo) * preco_hora for rps in rps_por_hora)
    return round(total, 2)


def custo_fixo(rps_por_hora: list, capacidade_por_instancia: float, preco_hora: float) -> float:
    pico = math.ceil(⟦pico⟧(rps_por_hora) / capacidade_por_instancia)
    return round(pico * len(rps_por_hora) * preco_hora, 2)
`,
      slots: {
        ceil: [
          ok('ceil', 'Arredonda para CIMA: 10,01 instâncias viram 11. Não existe “um pedaço” de servidor.'),
          no('floor', 'Arredonda para baixo: faltaria capacidade para a fração restante do tráfego.'),
          no('sqrt', 'Raiz quadrada: não tem relação com o cálculo.'),
        ],
        piso: [
          ok('max', 'max(minimo, x) garante o piso: nunca menos que o mínimo do grupo.'),
          no('min', 'Devolveria sempre o menor valor: o grupo ficaria preso no mínimo.'),
          no('sum', 'sum espera uma sequência de números; com dois argumentos soltos: TypeError.'),
        ],
        teto: [
          ok('min', 'min(maximo, x) garante o teto: nunca mais que o máximo do grupo.'),
          no('max', 'Devolveria sempre o máximo: todas as instâncias ligadas o tempo todo.'),
          no('abs', 'Valor absoluto de um único número: TypeError com dois argumentos.'),
        ],
        soma: [
          ok('sum', 'Soma todos os valores produzidos pela expressão geradora (o custo de cada hora).'),
          no('max', 'Devolveria só o custo da hora mais cara.'),
          no('len', 'Geradores não têm tamanho: TypeError.'),
        ],
        pico: [
          ok('max', 'O modelo fixo é dimensionado para a hora de maior tráfego.'),
          no('min', 'Dimensionaria para a hora mais calma: a loja cairia no pico.'),
          no('sum', 'Somaria o tráfego do dia todo, como se viesse em uma única hora.'),
        ],
      },
    },
  ],
};
