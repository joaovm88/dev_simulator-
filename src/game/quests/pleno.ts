import type { EtapaTerminal, Quest } from '../types';

const py = String.raw;
const TECH_LEAD = 'marcos.silva@nexustech.dev (Tech Lead)';

/** Etapa final padrão: entrega via Git (GDD §2.2, passo 4). */
export const entregaGit = (ordem: number, extra = ''): EtapaTerminal => ({
  ordem,
  tipo: 'COMANDO_TERMINAL',
  titulo: 'Entregar via Git',
  mensagemIA: `Tudo validado! ${extra}Agora faça a entrega pelo terminal: \`git add .\`, \`git commit -m "..."\` e \`git push\`.`,
  comandos: [
    { padrao: '^git add ', descricao: 'git add .' },
    { padrao: '^git commit ', descricao: 'git commit -m "..."' },
    { padrao: '^git push', descricao: 'git push' },
  ],
  dicas: ['Você pode encadear: `git add . && git commit -m "feat: entrega da missão" && git push`.'],
});

export const DDL_SIP = `
CREATE TABLE departamento (
  id_departamento NUMBER(6),
  nome VARCHAR2(60) NOT NULL,
  CONSTRAINT pk_departamento PRIMARY KEY (id_departamento),
  CONSTRAINT un_departamento_nome UNIQUE (nome)
);
CREATE TABLE funcionario (
  id_funcionario NUMBER(6),
  nome VARCHAR2(80) NOT NULL,
  salario NUMBER(10,2) NOT NULL,
  id_departamento NUMBER(6),
  CONSTRAINT pk_funcionario PRIMARY KEY (id_funcionario),
  CONSTRAINT ck_funcionario_salario CHECK (salario > 0),
  CONSTRAINT fk_funcionario_departamento FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)
);
CREATE TABLE projeto (
  id_projeto NUMBER(6),
  nome VARCHAR2(80) NOT NULL,
  dt_inicio DATE NOT NULL,
  dt_termino DATE,
  id_departamento NUMBER(6),
  CONSTRAINT pk_projeto PRIMARY KEY (id_projeto),
  CONSTRAINT ck_projeto_datas CHECK (dt_termino > dt_inicio),
  CONSTRAINT fk_projeto_departamento FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)
);
`;

const DADOS_SIP = `
INSERT INTO departamento VALUES (1, 'TI');
INSERT INTO departamento VALUES (2, 'RH');
INSERT INTO departamento VALUES (3, 'Marketing');
INSERT INTO funcionario VALUES (1, 'Ana', 9350, 1);
INSERT INTO funcionario VALUES (2, 'Bruno', 4620, 1);
INSERT INTO funcionario VALUES (3, 'Carla', 6100, 2);
INSERT INTO funcionario VALUES (4, 'Diego', 3900, NULL);
`;

export const PLENO: Quest[] = [
  {
    _id: 'quest_pl_01_oo_encapsulamento',
    codigo: 'Pl 01',
    titulo: 'Refatoração OO & Encapsulamento',
    nivelCarreira: 'PLENO',
    ordemTrilha: 6,
    recompensaXP: 120,
    repoPronto: true,
    conceitos: ['Classes e objetos', 'Construtores e sobrecarga', 'this', 'private / public', 'Getters e Setters', 'Pacotes'],
    email: {
      remetente: TECH_LEAD,
      assunto: '[Pleno #01] O sistema de gestão virou um espaguete - migrar para OO',
      corpo:
        'Parabéns pela promoção! Agora o jogo muda de nível.\n\nO sistema de gestão financeira cresceu e o código procedural ficou impossível de manter: qualquer script altera o saldo das contas diretamente, e ontem uma conta apareceu com saldo de -R$ 40.000.\n\nPrecisamos migrar para Orientação a Objetos em Java, começando pela classe `ContaBancaria`, no pacote `br.com.nexustech.model`. As regras de negócio precisam ficar protegidas DENTRO da classe.\n\nObs.: nesta fase a dev_IA faz o Code Review estrutural do seu Java (o sandbox de compilação em contêiner chega em uma próxima versão do dev_OS).\n\nMarcos',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'src/br/com/nexustech/model/ContaBancaria.java',
        linguagem: 'java',
        conteudo: `// TODO: declare o pacote br.com.nexustech.model

public class ContaBancaria {

    // FIXME: atributos públicos permitem que qualquer código altere o saldo
    public String titular;
    public double saldo;

    // TODO: construtor padrão (sem parâmetros)

    // TODO: construtor sobrecarregado (String titular, double saldoInicial)
    //       usando this.titular = titular;

    // TODO: getTitular(), setTitular(String) e getSaldo()

    // TODO: void depositar(double valor)  -> ignora valores <= 0

    // TODO: boolean sacar(double valor)   -> false se valor <= 0 ou maior que o saldo
}
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Protegendo o estado',
        mensagemIA:
          'Bem-vindo(a) ao nível Pleno! Olhe o arquivo `ContaBancaria.java`: o atributo `saldo` é `public`. Como impedir que uma conta fique com saldo negativo?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Manter o atributo público e pedir no README para o time sempre validar antes de alterar.',
            correta: false,
            feedbackIA: 'Convenção não é proteção: basta um `conta.saldo = -40000;` esquecido em qualquer canto. A regra de negócio precisa ser impossível de burlar.',
          },
          {
            id: 'opt_b',
            texto: 'Tornar os atributos private e expor métodos públicos (depositar, sacar, getSaldo) que validam as regras.',
            correta: true,
            feedbackIA:
              'Isso é **encapsulamento**. Com `private`, só a própria classe altera o estado, e os métodos públicos viram a única porta de entrada — com as validações dentro. Repare: não teremos `setSaldo`. O saldo só muda por `depositar` e `sacar`.',
          },
          {
            id: 'opt_c',
            texto: 'Usar o modificador protected, que bloqueia qualquer acesso externo.',
            correta: false,
            feedbackIA: '`protected` ainda libera o acesso para subclasses e para todo o mesmo pacote. O nível mais restrito, que só a própria classe enxerga, é `private`.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Construtores',
        mensagemIA:
          'Você cria o construtor `public ContaBancaria(String titular, double saldoInicial)`. Em outro arquivo do sistema existe a linha `ContaBancaria c = new ContaBancaria();`. O que acontece?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Compila normalmente: o Java sempre fornece um construtor vazio.',
            correta: false,
            feedbackIA: 'O Java só gera o construtor padrão enquanto a classe não declara NENHUM construtor. No momento em que você cria um com parâmetros, o padrão implícito deixa de existir.',
          },
          {
            id: 'opt_b',
            texto: 'Erro de compilação: ao declarar um construtor com parâmetros, o construtor padrão implícito some. É preciso declará-lo também (sobrecarga).',
            correta: true,
            feedbackIA:
              'Exato! A solução é a **sobrecarga de construtores**: declare os dois — `ContaBancaria()` e `ContaBancaria(String, double)`. Dentro deles, `this.titular = titular;` diferencia o atributo do parâmetro de mesmo nome.',
          },
          {
            id: 'opt_c',
            texto: 'Compila, mas lança NullPointerException em tempo de execução.',
            correta: false,
            feedbackIA: 'Nem chega a executar: o compilador barra antes, com “constructor ContaBancaria in class ContaBancaria cannot be applied to given types”.',
          },
        ],
      },
      {
        ordem: 3,
        tipo: 'VALIDACAO_ESTATICA',
        titulo: 'Refatorar a classe ContaBancaria',
        mensagemIA:
          'Refatore `ContaBancaria.java` seguindo os TODOs. Vou fazer o Code Review com este checklist:\n\n• pacote `br.com.nexustech.model` e classe em `PascalCase`\n• atributos `private` (nenhum atributo público!)\n• construtor padrão + construtor `(String titular, double saldoInicial)` usando `this`\n• `getTitular()`, `setTitular(String)` e `getSaldo()` — sem `setSaldo`\n• `void depositar(double valor)` e `boolean sacar(double valor)` com validação\n\nClique em **Rodar testes** para eu revisar.',
        regras: [
          { nome: 'Declaração do pacote', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: '^\\s*package\\s+br\\.com\\.nexustech\\.model\\s*;', dica: 'A primeira instrução do arquivo deve ser `package br.com.nexustech.model;`.' },
          { nome: 'Atributo saldo é private', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'private\\s+double\\s+saldo\\b', dica: 'Declare `private double saldo;`.' },
          { nome: 'Atributo titular é private', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'private\\s+String\\s+titular\\b', dica: 'Declare `private String titular;`.' },
          { nome: 'Nenhum atributo público', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+(double|String|int|float|boolean)\\s+\\w+\\s*(=[^;]*)?;', deveExistir: false, dica: 'Code Review bloqueado: ainda há atributo `public`. Troque para `private` para proteger as regras de negócio.' },
          { nome: 'Construtor padrão', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+ContaBancaria\\s*\\(\\s*\\)', dica: 'Declare o construtor sem parâmetros: `public ContaBancaria() { }`.' },
          { nome: 'Construtor sobrecarregado', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+ContaBancaria\\s*\\(\\s*String\\s+\\w+\\s*,\\s*double\\s+\\w+\\s*\\)', dica: 'Declare `public ContaBancaria(String titular, double saldoInicial) { ... }`.' },
          { nome: 'Uso da referência this', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'this\\.titular\\s*=', dica: 'No construtor/setter, use `this.titular = titular;` para atribuir o parâmetro ao atributo.' },
          { nome: 'Getter getSaldo()', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+double\\s+getSaldo\\s*\\(\\s*\\)', dica: 'Exponha a leitura do saldo: `public double getSaldo() { return saldo; }`.' },
          { nome: 'Getter e Setter do titular', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+String\\s+getTitular\\s*\\(\\s*\\)[\\s\\S]*public\\s+void\\s+setTitular\\s*\\(\\s*String\\s+\\w+\\s*\\)|public\\s+void\\s+setTitular\\s*\\(\\s*String\\s+\\w+\\s*\\)[\\s\\S]*public\\s+String\\s+getTitular\\s*\\(\\s*\\)', dica: 'Crie `public String getTitular()` e `public void setTitular(String titular)`.' },
          { nome: 'Sem setSaldo (saldo só muda por operações)', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'setSaldo\\s*\\(', deveExistir: false, dica: 'Remova o `setSaldo`: ele reabre a porta para saldo negativo. O saldo só deve mudar via `depositar` e `sacar`.' },
          { nome: 'Método depositar(double)', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+void\\s+depositar\\s*\\(\\s*double\\s+\\w+\\s*\\)', dica: 'Crie `public void depositar(double valor)`.' },
          { nome: 'Método sacar(double) devolve boolean', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'public\\s+boolean\\s+sacar\\s*\\(\\s*double\\s+\\w+\\s*\\)', dica: 'Crie `public boolean sacar(double valor)` devolvendo `false` quando o saque não for permitido.' },
          { nome: 'Saque valida o saldo disponível', arquivo: 'src/br/com/nexustech/model/ContaBancaria.java', padrao: 'sacar\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?if\\s*\\([^)]*(saldo|getSaldo\\(\\))[^)]*\\)', dica: 'Dentro de `sacar`, valide com um `if` comparando o valor com o `saldo` antes de subtrair.' },
        ],
        dicas: [
          'Construtor com this:\npublic ContaBancaria(String titular, double saldoInicial) {\n    this.titular = titular;\n    this.saldo = saldoInicial;\n}',
          'Saque protegido:\npublic boolean sacar(double valor) {\n    if (valor <= 0 || valor > saldo) {\n        return false;\n    }\n    saldo -= valor;\n    return true;\n}',
        ],
      },
      entregaGit(4),
    ],
  },

  {
    _id: 'quest_pl_02_heranca_polimorfismo',
    codigo: 'Pl 02',
    titulo: 'Herança, Polimorfismo & Algoritmos',
    nivelCarreira: 'PLENO',
    ordemTrilha: 7,
    recompensaXP: 130,
    repoPronto: true,
    conceitos: ['extends e super()', 'abstract', '@Override', 'Bubble Sort', 'Busca Binária O(log n)', 'List / Set / Map'],
    email: {
      remetente: 'vendas@usbsystems.com.br (Cliente - E-commerce de Instrumentos)',
      assunto: 'Frete errado para baterias - loja de instrumentos',
      corpo:
        'Olá, time NexusTech.\n\nNosso e-commerce de instrumentos está calculando a entrega com um `if/else` gigante que testa o tipo de cada produto. Toda vez que cadastramos um produto novo, alguém esquece de atualizar um dos `if` e o frete sai errado.\n\nAlém disso, a busca de produtos por código está lenta: o catálogo já passou de 100 mil itens.\n\nPrecisamos de uma solução que escale para dezenas de tipos de produto.',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'src/br/com/nexustech/model/Produto.java',
        linguagem: 'java',
        conteudo: `package br.com.nexustech.model;

// TODO: transforme em classe abstrata
public class Produto {

    protected String nome;
    protected double preco;

    public Produto(String nome, double preco) {
        this.nome = nome;
        this.preco = preco;
    }

    // TODO: declare o método abstrato getFormaEntrega(), que devolve String
}
`,
      },
      {
        caminho: 'src/br/com/nexustech/model/Guitarra.java',
        linguagem: 'java',
        conteudo: `package br.com.nexustech.model;

// TODO: Guitarra é um Produto (herança)
public class Guitarra {

    // TODO: construtor (String nome, double preco) repassando para super(...)

    // TODO: sobrescreva getFormaEntrega() devolvendo "Correios - caixa reforçada"
}
`,
      },
      {
        caminho: 'src/br/com/nexustech/model/Bateria.java',
        linguagem: 'java',
        conteudo: `package br.com.nexustech.model;

// TODO: Bateria é um Produto (herança)
public class Bateria {

    // TODO: construtor (String nome, double preco) repassando para super(...)

    // TODO: sobrescreva getFormaEntrega() devolvendo "Transportadora - volume grande"
}
`,
      },
      {
        caminho: 'src/algoritmos.py',
        linguagem: 'python',
        conteudo: py`# Protótipo dos algoritmos de catálogo (será portado para Java depois).


def bubble_sort(lista: list) -> list:
    # TODO: devolva uma NOVA lista ordenada, implementando o Bubble Sort
    # (compare vizinhos e troque de posição). Sem usar sorted() nem .sort().
    pass


def busca_binaria(lista: list, alvo) -> int:
    # 'lista' já chega ORDENADA.
    # TODO: devolva o índice do alvo, ou -1 se não existir, em O(log n)
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'if/else ou polimorfismo?',
        mensagemIA:
          'O código atual do cliente é assim:\n\nif (tipo.equals("GUITARRA")) {...} else if (tipo.equals("BATERIA")) {...} else if (...)\n\ne se repete em 14 arquivos. Como eliminar isso de forma que um novo tipo de produto não exija mexer no código existente?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Centralizar todos os if/else em uma única classe utilitária.',
            correta: false,
            feedbackIA: 'Melhora (um lugar só para esquecer), mas cada produto novo ainda obriga a alterar código que já funcionava. Dá para o próprio objeto saber como ele é entregue.',
          },
          {
            id: 'opt_b',
            texto: 'Classe abstrata Produto com o método abstrato getFormaEntrega(); cada subclasse sobrescreve com sua regra.',
            correta: true,
            feedbackIA:
              'Esse é o **polimorfismo dinâmico**. Você percorre uma única `List<Produto>` chamando `getFormaEntrega()` sem precisar checar se o item é `Guitarra` ou `Bateria`: a JVM decide em tempo de execução qual implementação rodar. Produto novo = classe nova, zero alteração no resto.',
          },
          {
            id: 'opt_c',
            texto: 'Usar sobrecarga: vários métodos calcularEntrega(Guitarra), calcularEntrega(Bateria)...',
            correta: false,
            feedbackIA:
              'Sobrecarga é **polimorfismo estático**: o compilador escolhe o método pelo tipo declarado da variável. Em uma `List<Produto>`, o tipo declarado é sempre `Produto` — não funcionaria. Precisamos de sobrescrita (`@Override`), resolvida em tempo de execução.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'VALIDACAO_ESTATICA',
        titulo: 'Hierarquia de produtos',
        mensagemIA:
          'Implemente a hierarquia nos três arquivos Java:\n\n• `Produto` vira `abstract` e declara `public abstract String getFormaEntrega();` (um contrato, sem corpo).\n• `Guitarra` e `Bateria` usam `extends Produto`, chamam `super(nome, preco)` no construtor e sobrescrevem o método com `@Override`.',
        regras: [
          { nome: 'Produto é uma classe abstrata', arquivo: 'src/br/com/nexustech/model/Produto.java', padrao: 'public\\s+abstract\\s+class\\s+Produto\\b', dica: 'Declare `public abstract class Produto` — ninguém deve instanciar um “produto genérico”.' },
          { nome: 'Produto declara o contrato getFormaEntrega()', arquivo: 'src/br/com/nexustech/model/Produto.java', padrao: 'public\\s+abstract\\s+String\\s+getFormaEntrega\\s*\\(\\s*\\)\\s*;', dica: 'Método abstrato não tem corpo: `public abstract String getFormaEntrega();`.' },
          { nome: 'Guitarra herda de Produto', arquivo: 'src/br/com/nexustech/model/Guitarra.java', padrao: 'class\\s+Guitarra\\s+extends\\s+Produto\\b', dica: 'Use `public class Guitarra extends Produto`.' },
          { nome: 'Guitarra reutiliza o construtor com super()', arquivo: 'src/br/com/nexustech/model/Guitarra.java', padrao: 'public\\s+Guitarra\\s*\\(\\s*String\\s+\\w+\\s*,\\s*double\\s+\\w+\\s*\\)\\s*\\{\\s*super\\s*\\(', dica: 'No construtor de Guitarra, a primeira linha deve ser `super(nome, preco);`.' },
          { nome: 'Guitarra sobrescreve com @Override', arquivo: 'src/br/com/nexustech/model/Guitarra.java', padrao: '@Override\\s+public\\s+String\\s+getFormaEntrega\\s*\\(\\s*\\)\\s*\\{[\\s\\S]*?return\\s+"Correios', dica: 'Anote com `@Override` e devolva `"Correios - caixa reforçada"`.' },
          { nome: 'Bateria herda de Produto', arquivo: 'src/br/com/nexustech/model/Bateria.java', padrao: 'class\\s+Bateria\\s+extends\\s+Produto\\b', dica: 'Use `public class Bateria extends Produto`.' },
          { nome: 'Bateria reutiliza o construtor com super()', arquivo: 'src/br/com/nexustech/model/Bateria.java', padrao: 'public\\s+Bateria\\s*\\(\\s*String\\s+\\w+\\s*,\\s*double\\s+\\w+\\s*\\)\\s*\\{\\s*super\\s*\\(', dica: 'No construtor de Bateria, a primeira linha deve ser `super(nome, preco);`.' },
          { nome: 'Bateria sobrescreve com @Override', arquivo: 'src/br/com/nexustech/model/Bateria.java', padrao: '@Override\\s+public\\s+String\\s+getFormaEntrega\\s*\\(\\s*\\)\\s*\\{[\\s\\S]*?return\\s+"Transportadora', dica: 'Anote com `@Override` e devolva `"Transportadora - volume grande"`.' },
        ],
        dicas: [
          'Subclasse completa:\npublic class Guitarra extends Produto {\n    public Guitarra(String nome, double preco) {\n        super(nome, preco);\n    }\n\n    @Override\n    public String getFormaEntrega() {\n        return "Correios - caixa reforçada";\n    }\n}',
        ],
      },
      {
        ordem: 3,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Busca no catálogo',
        mensagemIA:
          'Agora a lentidão. O catálogo tem 100 mil códigos em um vetor. A busca linear olha item por item: O(n). A busca binária resolve em O(log n) — cerca de 17 comparações em vez de até 100.000. Qual é a pré-condição para usar busca binária?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'O vetor precisa estar ordenado.',
            correta: true,
            feedbackIA:
              'Isso! A busca binária olha o elemento do meio e descarta metade do vetor a cada passo — o que só é válido se os dados estiverem ordenados. Por isso vamos implementar primeiro uma ordenação (Bubble Sort, O(n²), simples e didática).',
          },
          {
            id: 'opt_b',
            texto: 'O vetor não pode ter elementos repetidos.',
            correta: false,
            feedbackIA: 'Repetidos não impedem a busca binária (ela acha uma das ocorrências). O requisito real é outro: os dados precisam estar ordenados para podermos descartar metade a cada passo.',
          },
          {
            id: 'opt_c',
            texto: 'O vetor precisa ter tamanho que seja potência de 2.',
            correta: false,
            feedbackIA: 'Funciona com qualquer tamanho: a divisão inteira do índice do meio cuida disso. O requisito é o vetor estar ordenado.',
          },
        ],
      },
      {
        ordem: 4,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Bubble Sort e Busca Binária',
        arquivo: 'src/algoritmos.py',
        mensagemIA:
          'O time de dados pediu o protótipo em Python antes de portarmos para Java. Em `src/algoritmos.py`:\n\n• `bubble_sort(lista)` — devolve uma nova lista ordenada, comparando vizinhos e trocando (sem `sorted()` / `.sort()`).\n• `busca_binaria(lista, alvo)` — índice do alvo ou `-1`. Vou medir: em uma lista de 1.024 itens você só pode consultar algumas dezenas de posições.',
        regras: [
          { nome: 'Ordenação implementada à mão', arquivo: 'src/algoritmos.py', padrao: '\\bsorted\\s*\\(|\\.sort\\s*\\(', deveExistir: false, dica: 'Sem atalhos: implemente o Bubble Sort com dois laços, sem `sorted()` nem `.sort()`.' },
          { nome: 'Busca implementada à mão', arquivo: 'src/algoritmos.py', padrao: '\\.index\\s*\\(', deveExistir: false, dica: '`.index()` faz busca linear, O(n). Implemente a busca binária com os ponteiros `inicio`, `fim` e `meio`.' },
        ],
        testes: [
          {
            nome: 'bubble_sort ordena e não altera a lista original',
            codigo: py`m = carregar("src/algoritmos.py")
original = [5, 1, 4, 2, 8, 2]
r = m.bubble_sort(original)
assert r == [1, 2, 2, 4, 5, 8], f"Esperado [1, 2, 2, 4, 5, 8], veio {r!r}."
assert original == [5, 1, 4, 2, 8, 2], "A lista original foi alterada: trabalhe em uma cópia (lista[:] ou list(lista))."
assert m.bubble_sort([]) == [] and m.bubble_sort([7]) == [7], "Listas com 0 ou 1 elemento devem voltar iguais."`,
          },
          {
            nome: 'busca_binaria encontra o índice ou devolve -1',
            codigo: py`m = carregar("src/algoritmos.py")
dados = [3, 8, 15, 23, 42, 57, 91]
for i, v in enumerate(dados):
    r = m.busca_binaria(dados, v)
    assert r == i, f"busca_binaria(dados, {v}) deveria devolver {i}, veio {r!r}."
for ausente in (1, 20, 100):
    r = m.busca_binaria(dados, ausente)
    assert r == -1, f"{ausente} não está na lista: esperado -1, veio {r!r}."
assert m.busca_binaria([], 5) == -1, "Lista vazia deve devolver -1."`,
          },
          {
            nome: 'busca_binaria é O(log n)',
            codigo: py`m = carregar("src/algoritmos.py")
class Contador(list):
    acessos = 0
    def __getitem__(self, i):
        Contador.acessos += 1
        return list.__getitem__(self, i)
    def __iter__(self):
        raise AssertionError("Percorrer a lista inteira é busca linear, O(n). Acesse apenas lista[meio].")
dados = Contador(range(0, 2048, 2))
r = m.busca_binaria(dados, 2046)
assert r == 1023, f"Esperado índice 1023, veio {r!r}."
assert Contador.acessos <= 40, f"Foram {Contador.acessos} acessos à lista de 1.024 itens. A busca binária precisa de ~10: descarte metade a cada passo."`,
          },
        ],
        dicas: [
          'Bubble Sort:\nnova = lista[:]\nfor i in range(len(nova)):\n    for j in range(len(nova) - 1 - i):\n        if nova[j] > nova[j + 1]:\n            nova[j], nova[j + 1] = nova[j + 1], nova[j]\nreturn nova',
          'Busca binária:\ninicio, fim = 0, len(lista) - 1\nwhile inicio <= fim:\n    meio = (inicio + fim) // 2\n    if lista[meio] == alvo: return meio\n    if lista[meio] < alvo: inicio = meio + 1\n    else: fim = meio - 1\nreturn -1',
        ],
      },
      {
        ordem: 5,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Collections Framework',
        mensagemIA:
          'Último ponto. No Java, o cliente quer guardar os códigos de produto já vendidos hoje, sem repetição, e checar rapidamente se um código já apareceu. Qual coleção usar?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'List / ArrayList',
            correta: false,
            feedbackIA: '`ArrayList` mantém a ordem e aceita repetidos; o `contains()` percorre tudo, O(n). Para unicidade com consulta rápida existe coisa melhor.',
          },
          {
            id: 'opt_b',
            texto: 'Set / HashSet',
            correta: true,
            feedbackIA:
              'Isso! `HashSet` usa tabela hash: garante unicidade e `contains()` é O(1) em média. Resumo do Collections Framework: `List` = sequência com repetição; `Set` = elementos únicos; `Map`/`HashMap` = pares chave-valor (o “dicionário” do Java).',
          },
          {
            id: 'opt_c',
            texto: 'Um vetor (array) de tamanho fixo',
            correta: false,
            feedbackIA: 'Vetores têm tamanho fixo e não impedem repetidos; você teria que implementar tudo à mão. As coleções do Java já resolvem isso — aqui, com `HashSet`.',
          },
        ],
      },
      entregaGit(6),
    ],
  },

  {
    _id: 'quest_pl_03_modelagem_ddl',
    codigo: 'Pl 03',
    titulo: 'Modelagem e DDL em Banco Relacional',
    nivelCarreira: 'PLENO',
    ordemTrilha: 8,
    recompensaXP: 140,
    repoPronto: true,
    conceitos: ['ANSI SQL vs dialetos', 'Tipos de dados', 'CREATE TABLE', 'PK / FK / UNIQUE / CHECK / NOT NULL', 'Sequences e GAP'],
    email: {
      remetente: 'ti@tudoimplanta.com.br (Cliente - TUDO Implanta)',
      assunto: 'Migração das planilhas do SIP para banco de dados',
      corpo:
        'Prezados,\n\nHoje o nosso Sistema de Implantação de Projetos (SIP) vive em planilhas. Já tivemos funcionário cadastrado duas vezes, projeto que termina antes de começar e departamento que não existe.\n\nQueremos migrar para um banco relacional (usamos Oracle em produção; o ambiente de homologação é PostgreSQL), com as regras garantidas pelo próprio banco.\n\nTabelas necessárias nesta primeira etapa: departamento, funcionario e projeto.',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'sql/sip_ddl.sql',
        linguagem: 'sql',
        conteudo: `-- DDL do Sistema de Implantação de Projetos (SIP)
-- Convenção de nomes das constraints: pk_, fk_, un_, ck_

-- TODO: CREATE TABLE departamento
-- TODO: CREATE TABLE funcionario
-- TODO: CREATE TABLE projeto
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Tipos de dados',
        mensagemIA:
          'Vamos modelar. A coluna `nome` do funcionário terá textos de tamanhos bem diferentes (“Ana”, “Maria Fernanda de Albuquerque”). Qual tipo usar no Oracle?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'CHAR(80) — tamanho fixo.',
            correta: false,
            feedbackIA: '`CHAR(80)` sempre ocupa 80 posições, preenchendo com espaços: “Ana” viraria “Ana” + 77 espaços. Desperdício de armazenamento e comparações confusas. `CHAR` só compensa para tamanho realmente fixo, como UF (`CHAR(2)`).',
          },
          {
            id: 'opt_b',
            texto: 'VARCHAR2(80) — tamanho variável até 80.',
            correta: true,
            feedbackIA:
              'Certo: `VARCHAR2` armazena só o que foi usado. Outros tipos do nosso kit: `NUMBER(p,s)` para números (precisão e escala, ex.: `NUMBER(10,2)` para salário), `DATE`/`TIMESTAMP` para datas, `CLOB` para textos longos e `BLOB` para binários. `VARCHAR2` é dialeto Oracle; no padrão ANSI e no PostgreSQL é `VARCHAR`.',
          },
          {
            id: 'opt_c',
            texto: 'CLOB — suporta textos de qualquer tamanho.',
            correta: false,
            feedbackIA: '`CLOB` é para textos enormes (contratos, laudos) e tem restrições em índices e comparações. Para um nome, `VARCHAR2(80)` é o tipo adequado.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Autonumeração com Sequences',
        mensagemIA:
          'No Oracle, os IDs costumam vir de uma sequence: `CREATE SEQUENCE seq_funcionario;` e depois `seq_funcionario.NEXTVAL` no INSERT. Um colega rodou `SELECT seq_funcionario.NEXTVAL FROM DUAL;` três vezes “só para ver o valor”, sem inserir nada. Qual é o efeito?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Nenhum: a sequence só avança quando um INSERT é confirmado com COMMIT.',
            correta: false,
            feedbackIA: 'A sequence é independente de transação: cada `NEXTVAL` consome um número definitivamente, com ou sem INSERT, com COMMIT ou ROLLBACK.',
          },
          {
            id: 'opt_b',
            texto: 'Os três números foram consumidos: o próximo INSERT pula esses valores, criando um GAP (lacuna) na numeração.',
            correta: true,
            feedbackIA:
              'Exato — é o fenômeno de **GAP**. Para só espiar o valor atual existe o `CURRVAL`. Gaps também surgem com `CACHE` (números pré-alocados perdidos em um restart; `NOCACHE` evita, com custo de performance) e com ROLLBACK. Moral: ID de sequence serve para identificar, nunca para contar registros.',
          },
          {
            id: 'opt_c',
            texto: 'O Oracle devolve erro, porque NEXTVAL só pode ser usado dentro de um INSERT.',
            correta: false,
            feedbackIA: 'É permitido, sim: a tabela `DUAL` existe justamente para esse tipo de SELECT avulso. O problema é que cada chamada consome um número da sequência.',
          },
        ],
      },
      {
        ordem: 3,
        tipo: 'IMPLEMENTACAO_SQL',
        titulo: 'Criar as tabelas com constraints',
        arquivo: 'sql/sip_ddl.sql',
        mensagemIA:
          'Escreva o DDL em `sql/sip_ddl.sql`. Crie primeiro as tabelas “pai”. Nomeie as constraints com os prefixos `pk_`, `fk_`, `un_` e `ck_` (ex.: `CONSTRAINT pk_departamento PRIMARY KEY (id_departamento)`).\n\n**departamento**: `id_departamento` NUMBER (PK) · `nome` VARCHAR2(60) NOT NULL e UNIQUE\n**funcionario**: `id_funcionario` NUMBER (PK) · `nome` VARCHAR2(80) NOT NULL · `salario` NUMBER(10,2) com CHECK (salario > 0) · `id_departamento` (FK → departamento)\n**projeto**: `id_projeto` NUMBER (PK) · `nome` VARCHAR2(80) NOT NULL · `dt_inicio` DATE NOT NULL · `dt_termino` DATE com CHECK (dt_termino > dt_inicio) · `id_departamento` (FK → departamento)\n\nNota: em scripts Oracle é comum criar as tabelas e adicionar PK/FK no final com `ALTER TABLE ... ADD CONSTRAINT`. O banco do sandbox (SQLite, via WebAssembly) exige as constraints dentro do `CREATE TABLE`. Use **Executar** para ver as tabelas no Data Inspector.',
        regras: [
          { nome: 'Chaves primárias nomeadas com pk_', arquivo: 'sql/sip_ddl.sql', padrao: 'CONSTRAINT\\s+pk_\\w+\\s+PRIMARY\\s+KEY', flags: 'i', dica: 'Nomeie as PKs: `CONSTRAINT pk_departamento PRIMARY KEY (id_departamento)`.' },
          { nome: 'Chaves estrangeiras nomeadas com fk_', arquivo: 'sql/sip_ddl.sql', padrao: 'CONSTRAINT\\s+fk_\\w+\\s+FOREIGN\\s+KEY', flags: 'i', dica: 'Nomeie as FKs: `CONSTRAINT fk_funcionario_departamento FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)`.' },
          { nome: 'Checks nomeados com ck_', arquivo: 'sql/sip_ddl.sql', padrao: 'CONSTRAINT\\s+ck_\\w+\\s+CHECK', flags: 'i', dica: 'Nomeie os checks: `CONSTRAINT ck_funcionario_salario CHECK (salario > 0)`.' },
        ],
        verificacoes: [
          {
            nome: 'As três tabelas existem',
            sql: "SELECT lower(name) FROM sqlite_master WHERE type = 'table' AND lower(name) IN ('departamento', 'funcionario', 'projeto')",
            esperado: [['departamento'], ['funcionario'], ['projeto']],
            dica: 'Crie as tabelas `departamento`, `funcionario` e `projeto` (nomes no singular).',
          },
          { nome: 'Aceita um departamento válido', sql: "INSERT INTO departamento (id_departamento, nome) VALUES (1, 'TI')", dica: 'O INSERT de um departamento válido falhou. Confira os nomes das colunas: `id_departamento` e `nome`.' },
          { nome: 'PK impede departamento duplicado', sql: "INSERT INTO departamento (id_departamento, nome) VALUES (1, 'Financeiro')", deveFalhar: true, dica: 'Falta a PRIMARY KEY em `departamento.id_departamento`: o banco aceitou dois registros com id 1.' },
          { nome: 'UNIQUE impede nome de departamento repetido', sql: "INSERT INTO departamento (id_departamento, nome) VALUES (2, 'TI')", deveFalhar: true, dica: 'Falta a constraint UNIQUE (`un_`) em `departamento.nome`.' },
          { nome: 'NOT NULL exige o nome do departamento', sql: 'INSERT INTO departamento (id_departamento, nome) VALUES (3, NULL)', deveFalhar: true, dica: '`departamento.nome` deve ser NOT NULL.' },
          { nome: 'Aceita um funcionário válido', sql: "INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (1, 'Ana', 8500.00, 1)", dica: 'O INSERT de um funcionário válido falhou. Colunas esperadas: `id_funcionario`, `nome`, `salario`, `id_departamento`.' },
          { nome: 'CHECK impede salário negativo', sql: "INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (2, 'Bruno', -10, 1)", deveFalhar: true, dica: 'Falta o CHECK (`ck_`) garantindo `salario > 0`.' },
          { nome: 'FK impede departamento inexistente', sql: "INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (3, 'Carla', 5000, 99)", deveFalhar: true, dica: 'Falta a FOREIGN KEY de `funcionario.id_departamento` para `departamento`: o banco aceitou o departamento 99, que não existe.' },
          { nome: 'Aceita um projeto válido', sql: "INSERT INTO projeto (id_projeto, nome, dt_inicio, dt_termino, id_departamento) VALUES (1, 'Implantação SIP', '2025-01-10', '2025-06-30', 1)", dica: 'O INSERT de um projeto válido falhou. Colunas esperadas: `id_projeto`, `nome`, `dt_inicio`, `dt_termino`, `id_departamento`.' },
          { nome: 'CHECK impede término antes do início', sql: "INSERT INTO projeto (id_projeto, nome, dt_inicio, dt_termino, id_departamento) VALUES (2, 'Projeto Inválido', '2025-06-30', '2025-01-10', 1)", deveFalhar: true, dica: 'Falta o CHECK garantindo `dt_termino > dt_inicio`.' },
          { nome: 'FK do projeto valida o departamento', sql: "INSERT INTO projeto (id_projeto, nome, dt_inicio, dt_termino, id_departamento) VALUES (3, 'Projeto Órfão', '2025-01-10', '2025-06-30', 77)", deveFalhar: true, dica: 'Falta a FOREIGN KEY de `projeto.id_departamento` para `departamento`.' },
        ],
        dicas: [
          'Modelo:\nCREATE TABLE departamento (\n  id_departamento NUMBER(6),\n  nome VARCHAR2(60) NOT NULL,\n  CONSTRAINT pk_departamento PRIMARY KEY (id_departamento),\n  CONSTRAINT un_departamento_nome UNIQUE (nome)\n);',
          'FK e CHECK ficam no final do CREATE TABLE da tabela filha:\nCONSTRAINT ck_funcionario_salario CHECK (salario > 0),\nCONSTRAINT fk_funcionario_departamento FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)',
        ],
      },
      entregaGit(4),
    ],
  },

  {
    _id: 'quest_pl_04_dml_joins',
    codigo: 'Pl 04',
    titulo: 'Transações DML e Consultas com JOINs',
    nivelCarreira: 'PLENO',
    ordemTrilha: 9,
    recompensaXP: 150,
    repoPronto: true,
    conceitos: ['INSERT / UPDATE / DELETE', 'COMMIT e ROLLBACK', 'SELECT, ORDER BY, filtros', 'INNER JOIN', 'LEFT JOIN + IS NULL'],
    email: {
      remetente: 'ti@tudoimplanta.com.br (Cliente - TUDO Implanta)',
      assunto: 'RE: Migração do SIP - carga de dados e relatórios',
      corpo:
        'Tabelas aprovadas, obrigado!\n\nPróximos passos:\n\n1) Carregar os dados iniciais e aplicar o reajuste de 10% que a diretoria aprovou SOMENTE para o departamento de TI.\n\n2) Relatório de funcionários com o nome do respectivo departamento, do maior para o menor salário.\n\n3) Descobrir quais departamentos estão sem nenhum funcionário alocado.\n\nPor favor, muito cuidado com o reajuste: no sistema antigo, alguém já aumentou o salário da empresa inteira sem querer.',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'sql/01_carga.sql',
        linguagem: 'sql',
        conteudo: `-- Carga inicial do SIP (as tabelas já existem: veja o Data Inspector)

-- TODO: INSERT dos 3 departamentos
-- TODO: INSERT dos 4 funcionários
-- TODO: UPDATE do reajuste de 10% para o departamento 1 (TI)
`,
      },
      {
        caminho: 'sql/02_relatorio_join.sql',
        linguagem: 'sql',
        conteudo: `-- Relatório: funcionário + nome do departamento, por salário decrescente

-- TODO: SELECT com INNER JOIN
`,
      },
      {
        caminho: 'sql/03_departamentos_orfaos.sql',
        linguagem: 'sql',
        conteudo: `-- Departamentos sem nenhum funcionário alocado

-- TODO: SELECT com LEFT JOIN ... IS NULL
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'IMPLEMENTACAO_SQL',
        titulo: 'Carga e reajuste (DML)',
        arquivo: 'sql/01_carga.sql',
        setupSQL: DDL_SIP,
        mensagemIA:
          'Em `sql/01_carga.sql`, escreva os comandos DML:\n\n**Departamentos**: (1, TI) · (2, RH) · (3, Marketing)\n**Funcionários** (id, nome, salário, departamento): (1, Ana, 8500, 1) · (2, Bruno, 4200, 1) · (3, Carla, 6100, 2) · (4, Diego, 3900, sem departamento → `NULL`)\n\nDepois aplique o reajuste: `UPDATE` multiplicando o salário por 1.10 **apenas** para quem é do departamento 1.\n\nEm produção (Oracle), nada disso é definitivo até o `COMMIT` — e um `ROLLBACK` desfaz tudo o que ainda não foi confirmado.',
        verificacoes: [
          { nome: '3 departamentos cadastrados', sql: 'SELECT COUNT(*) FROM departamento', esperado: [[3]], dica: 'Insira os três departamentos: TI, RH e Marketing.' },
          { nome: '4 funcionários cadastrados', sql: 'SELECT COUNT(*) FROM funcionario', esperado: [[4]], dica: 'Insira os quatro funcionários: Ana, Bruno, Carla e Diego.' },
          { nome: 'Diego está sem departamento (NULL)', sql: "SELECT COUNT(*) FROM funcionario WHERE nome = 'Diego' AND id_departamento IS NULL", esperado: [[1]], dica: 'O Diego ainda não foi alocado: use `NULL` (sem aspas) em `id_departamento`.' },
          { nome: 'TI recebeu 10% de reajuste', sql: 'SELECT ROUND(salario, 2) FROM funcionario WHERE id_departamento = 1 ORDER BY id_funcionario', esperado: [[9350], [4620]], dica: 'Após o UPDATE, Ana deve ganhar 9350 e Bruno 4620 (`salario * 1.10`).' },
          { nome: 'Outros departamentos não foram alterados', sql: "SELECT ROUND(salario, 2) FROM funcionario WHERE nome IN ('Carla', 'Diego') ORDER BY id_funcionario", esperado: [[6100], [3900]], dica: 'Carla (6100) e Diego (3900) não são de TI e não podem receber o reajuste.' },
        ],
        dicas: [
          "INSERT: `INSERT INTO departamento (id_departamento, nome) VALUES (1, 'TI');` — textos sempre com aspas simples.",
          'Reajuste seguro: `UPDATE funcionario SET salario = salario * 1.10 WHERE id_departamento = 1;`',
        ],
      },
      {
        ordem: 2,
        tipo: 'REVISAO_CODIGO',
        titulo: 'Code review: PR do estagiário',
        autor: 'lucas.estagio@nexustech.dev · PR #42 “ajustes de fim de mês”',
        linguagem: 'sql',
        mensagemIA:
          'Chegou um pull request para você revisar antes de rodar em produção. Agora você é quem protege o banco do cliente. **Marque as 3 linhas perigosas ou erradas** e clique em **Enviar revisão**.',
        codigo: `UPDATE funcionario SET salario = salario * 1.05;

SELECT nome FROM funcionario WHERE id_departamento = NULL;

DELETE FROM projeto;

SELECT nome, salario FROM funcionario WHERE salario > 5000 ORDER BY salario DESC;

INSERT INTO departamento (id_departamento, nome) VALUES (4, 'Financeiro');

COMMIT;`,
        problemas: [
          { linha: 1, explica: '`UPDATE` sem `WHERE`: daria 5% de aumento para a empresa inteira. Foi exatamente o acidente que o cliente relatou no sistema antigo.' },
          { linha: 3, explica: 'Nada é “igual” a NULL: `= NULL` nunca é verdadeiro e a consulta volta vazia. O teste correto é `IS NULL`.' },
          { linha: 5, explica: '`DELETE` sem `WHERE` apaga todos os projetos. Antes do `COMMIT` ainda daria para desfazer com `ROLLBACK` — mas o script confirma tudo na última linha.' },
        ],
        dicas: ['Procure comandos DML que afetam a tabela inteira por falta de filtro.', 'Como se testa se uma coluna está vazia em SQL? Com `=` ou com `IS`?'],
      },
      {
        ordem: 3,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Qual JOIN?',
        mensagemIA:
          'Para o relatório, precisamos cruzar `funcionario` com `departamento`. O Diego está com `id_departamento` NULL. Se usarmos `INNER JOIN`, o que acontece com ele?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Aparece no resultado com o nome do departamento vazio.',
            correta: false,
            feedbackIA: 'Esse é o comportamento do `LEFT OUTER JOIN` (mantém todos da tabela da esquerda, preenchendo com NULL). O `INNER JOIN` é mais restritivo.',
          },
          {
            id: 'opt_b',
            texto: 'Fica fora do resultado: INNER JOIN só devolve linhas que têm correspondência nas duas tabelas.',
            correta: true,
            feedbackIA:
              'Isso. `INNER JOIN` = interseção. `LEFT JOIN` mantém tudo da esquerda; `RIGHT JOIN`, tudo da direita; `FULL OUTER JOIN`, os dois lados. E um truque valioso: `LEFT JOIN` + `WHERE coluna_da_direita IS NULL` revela os registros **órfãos**, sem par do outro lado.',
          },
          {
            id: 'opt_c',
            texto: 'O banco devolve erro, porque NULL não pode ser comparado.',
            correta: false,
            feedbackIA: 'Não dá erro: comparar com NULL resulta em “desconhecido”, que o JOIN trata como falso. A linha simplesmente não entra no `INNER JOIN`.',
          },
        ],
      },
      {
        ordem: 4,
        tipo: 'IMPLEMENTACAO_SQL',
        titulo: 'Relatório com INNER JOIN',
        arquivo: 'sql/02_relatorio_join.sql',
        setupSQL: DDL_SIP + DADOS_SIP,
        mensagemIA:
          'Em `sql/02_relatorio_join.sql`, escreva uma consulta que devolva **duas colunas** — o nome do funcionário e o nome do departamento — usando `INNER JOIN`, do maior para o menor salário.\n\nUse apelidos (alias) para as tabelas: `funcionario f`, `departamento d`.',
        regras: [
          { nome: 'Usa JOIN (sintaxe SQL/99)', arquivo: 'sql/02_relatorio_join.sql', padrao: '\\bJOIN\\b[\\s\\S]*\\b(ON|USING)\\b', flags: 'i', dica: 'Use a sintaxe SQL/99: `FROM funcionario f INNER JOIN departamento d ON f.id_departamento = d.id_departamento`.' },
        ],
        resultadoEsperado: {
          ordenado: true,
          linhas: [
            ['Ana', 'TI'],
            ['Carla', 'RH'],
            ['Bruno', 'TI'],
          ],
        },
        dicas: [
          'Selecione só as duas colunas: `SELECT f.nome, d.nome`.',
          'SELECT f.nome, d.nome\nFROM funcionario f\nINNER JOIN departamento d ON f.id_departamento = d.id_departamento\nORDER BY f.salario DESC;',
        ],
      },
      {
        ordem: 5,
        tipo: 'IMPLEMENTACAO_SQL',
        titulo: 'Registros órfãos com LEFT JOIN',
        arquivo: 'sql/03_departamentos_orfaos.sql',
        setupSQL: DDL_SIP + DADOS_SIP,
        mensagemIA:
          'Agora a terceira demanda: em `sql/03_departamentos_orfaos.sql`, liste **o nome** dos departamentos que não têm nenhum funcionário, usando `LEFT JOIN` e `IS NULL`.',
        regras: [
          { nome: 'Usa LEFT JOIN', arquivo: 'sql/03_departamentos_orfaos.sql', padrao: '\\bLEFT\\s+(OUTER\\s+)?JOIN\\b', flags: 'i', dica: 'Parta de `departamento` e faça `LEFT JOIN funcionario`: assim todos os departamentos aparecem, com NULL onde não há funcionário.' },
          { nome: 'Filtra os órfãos com IS NULL', arquivo: 'sql/03_departamentos_orfaos.sql', padrao: '\\bIS\\s+NULL\\b', flags: 'i', dica: 'Filtre com `WHERE f.id_funcionario IS NULL` (nunca `= NULL`).' },
        ],
        resultadoEsperado: { linhas: [['Marketing']] },
        dicas: [
          'SELECT d.nome\nFROM departamento d\nLEFT JOIN funcionario f ON f.id_departamento = d.id_departamento\nWHERE f.id_funcionario IS NULL;',
        ],
      },
      entregaGit(6),
    ],
  },

  {
    _id: 'quest_pl_05_mongodb',
    codigo: 'Pl 05',
    titulo: 'Modelagem NoSQL com MongoDB',
    nivelCarreira: 'PLENO',
    ordemTrilha: 10,
    recompensaXP: 150,
    repoPronto: true,
    conceitos: ['Coleções e documentos', '_id / ObjectId', 'Embedded vs Referência', '$jsonSchema', 'insertMany / find'],
    email: {
      remetente: 'vendas@usbsystems.com.br (Cliente - E-commerce de Instrumentos)',
      assunto: 'O catálogo não cabe mais nas tabelas',
      corpo:
        'Pessoal,\n\nNosso catálogo virou um problema no banco relacional. Uma guitarra tem número de cordas e tipo de captador; uma bateria tem quantidade de peças; um curso online tem carga horária. A tabela de produtos já tem 60 colunas, quase todas NULL.\n\nQueremos migrar o catálogo e o cadastro de clientes para o MongoDB. Só não abrimos mão de uma coisa: todo produto precisa ter nome, categoria e um preço que não seja negativo.',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'mongo/catalogo.mongodb.js',
        linguagem: 'javascript',
        conteudo: `// Script mongosh — clique em "Executar" para rodar e ver as coleções no Data Inspector.
use loja

// TODO 1: crie a coleção "produtos" com validação $jsonSchema
// db.createCollection("produtos", { validator: { $jsonSchema: { ... } } })

// TODO 2: insira os 3 produtos com db.produtos.insertMany([ ... ])

// TODO 3: insira o cliente com os endereços aninhados: db.clientes.insertOne({ ... })
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'SQL ou documentos?',
        mensagemIA:
          'Por que um banco orientado a documentos resolve o problema do catálogo?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Porque o MongoDB é sempre mais rápido que bancos relacionais.',
            correta: false,
            feedbackIA: 'Não existe “sempre mais rápido”: é trade-off. Para transações com muitas tabelas relacionadas e integridade forte (o SIP, um sistema financeiro), o relacional continua sendo a melhor escolha.',
          },
          {
            id: 'opt_b',
            texto: 'Porque cada documento (JSON/BSON) pode ter campos diferentes: o esquema é flexível, sem colunas NULL.',
            correta: true,
            feedbackIA:
              'Exato. Em uma **coleção**, cada **documento** carrega só os atributos que fazem sentido para ele, identificado por um `_id` (por padrão, um `ObjectId`). E flexível não quer dizer bagunça: com `$jsonSchema` exigimos os campos essenciais.',
          },
          {
            id: 'opt_c',
            texto: 'Porque no MongoDB não é preciso se preocupar com modelagem de dados.',
            correta: false,
            feedbackIA: 'Pelo contrário: no NoSQL a modelagem é guiada pelas consultas da aplicação e erros custam caro. O esquema é flexível, não inexistente.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Aninhar ou referenciar?',
        mensagemIA:
          'A tela “Minha Conta” mostra o cliente junto com seus endereços e telefones — sempre tudo de uma vez. Um cliente tem no máximo meia dúzia de endereços. Como modelar?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Documentos aninhados (embedded): um array "enderecos" dentro do documento do cliente.',
            correta: true,
            feedbackIA:
              'Regra de ouro do MongoDB: **“dados que são acessados juntos devem ser armazenados juntos”**. Uma única leitura (`findOne`) traz tudo, sem JOIN, e a gravação do documento é atômica. Referências valem a pena quando o array cresceria sem limite ou o dado é compartilhado entre muitos documentos.',
          },
          {
            id: 'opt_b',
            texto: 'Coleções separadas (clientes, enderecos, telefones) ligadas por ID, como no modelo relacional.',
            correta: false,
            feedbackIA: 'Isso é levar o modelo relacional para o MongoDB: a tela precisaria de três consultas (ou `$lookup`) para montar um cliente. Como os endereços são poucos e sempre lidos junto com o cliente, é melhor aninhar.',
          },
        ],
      },
      {
        ordem: 3,
        tipo: 'IMPLEMENTACAO_MONGO',
        titulo: 'Catálogo e clientes no MongoDB',
        arquivo: 'mongo/catalogo.mongodb.js',
        banco: 'loja',
        mensagemIA:
          'Complete `mongo/catalogo.mongodb.js`:\n\n**1.** Crie `produtos` com um validador `$jsonSchema`: `bsonType: "object"`, `required: ["nome", "categoria", "preco"]`, e em `properties` o `preco` como `bsonType: "number"` com `minimum: 0`.\n\n**2.** `insertMany` com três produtos:\n• Guitarra Stratocaster — categoria `instrumento`, preço 4500, `atributos: { cordas: 6 }`\n• Bateria Acústica — categoria `instrumento`, preço 7200, `atributos: { pecas: 5 }`\n• Curso de Violão — categoria `curso`, preço 199.9, `atributos: { horas: 40 }`\n\n**3.** `insertOne` em `clientes`: nome à sua escolha e um array `enderecos` com **dois** endereços aninhados, cada um com `rua` e `cidade` (um deles em `São Paulo`).\n\nDepois de executar, experimente no terminal: `db.produtos.find({ "atributos.cordas": 6 })`.',
        verificacoes: [
          { nome: '3 produtos no catálogo', colecao: 'produtos', filtro: {}, contagem: 3, dica: 'Insira exatamente os três produtos com `db.produtos.insertMany([...])`.' },
          { nome: '2 produtos na categoria instrumento', colecao: 'produtos', filtro: { categoria: 'instrumento' }, contagem: 2, dica: 'Guitarra e Bateria devem ter `categoria: "instrumento"`.' },
          { nome: 'Guitarra com atributos.cordas = 6', colecao: 'produtos', filtro: { 'atributos.cordas': 6 }, contagem: 1, dica: 'A guitarra precisa do subdocumento `atributos: { cordas: 6 }`.' },
          { nome: 'Curso com preço 199.9', colecao: 'produtos', filtro: { categoria: 'curso', preco: 199.9 }, contagem: 1, dica: 'O Curso de Violão deve ter `categoria: "curso"` e `preco: 199.9`.' },
          { nome: 'Cliente com 2 endereços aninhados', colecao: 'clientes', filtro: { enderecos: { $size: 2 } }, contagem: 1, dica: 'O documento do cliente precisa de um array `enderecos` com dois objetos.' },
          { nome: 'Um endereço em São Paulo', colecao: 'clientes', filtro: { 'enderecos.cidade': 'São Paulo' }, contagem: 1, dica: 'Um dos endereços deve ter `cidade: "São Paulo"`.' },
        ],
        devemSerRejeitados: [
          { nome: 'Validador rejeita produto sem preço', colecao: 'produtos', documento: { nome: 'Pedal', categoria: 'acessorio' }, dica: 'Inclua `"preco"` na lista `required` do `$jsonSchema`.' },
          { nome: 'Validador rejeita preço negativo', colecao: 'produtos', documento: { nome: 'Pedal', categoria: 'acessorio', preco: -5 }, dica: 'Em `properties.preco`, defina `minimum: 0`.' },
          { nome: 'Validador rejeita preço em texto', colecao: 'produtos', documento: { nome: 'Pedal', categoria: 'acessorio', preco: 'caro' }, dica: 'Em `properties.preco`, defina `bsonType: "number"`.' },
        ],
        dicas: [
          'Validador:\ndb.createCollection("produtos", {\n  validator: {\n    $jsonSchema: {\n      bsonType: "object",\n      required: ["nome", "categoria", "preco"],\n      properties: {\n        preco: { bsonType: "number", minimum: 0 }\n      }\n    }\n  }\n})',
          'Produtos:\ndb.produtos.insertMany([\n  { nome: "Guitarra Stratocaster", categoria: "instrumento", preco: 4500, atributos: { cordas: 6 } },\n  ...\n])',
          'Cliente:\ndb.clientes.insertOne({\n  nome: "Lia Prado",\n  enderecos: [\n    { rua: "Rua Augusta, 500", cidade: "São Paulo" },\n    { rua: "Av. Beira Mar, 10", cidade: "Santos" }\n  ]\n})',
        ],
      },
      entregaGit(4),
    ],
  },

  {
    _id: 'quest_pl_06_fullstack_fintech',
    codigo: 'Pl 06',
    titulo: 'Web APIs RESTful, Front-end & Mobile',
    nivelCarreira: 'PLENO',
    ordemTrilha: 11,
    recompensaXP: 180,
    boss: true,
    repoPronto: true,
    conceitos: ['REST e verbos HTTP', 'Status codes', 'npm e package.json', 'SemVer (^ e ~)', 'TypeScript: interface e DTO', 'React: componentes e estado', 'Jetpack Compose'],
    email: {
      remetente: TECH_LEAD,
      assunto: '[Boss Challenge] Painel web da Fintech - contrato da API + front-end',
      corpo:
        'Este é o seu projeto integrador de Pleno.\n\nO back-end da plataforma da Fintech já expõe uma API REST. Precisamos conectar a ela um painel web em React/Next.js com TypeScript (o time mobile fará o mesmo em Kotlin com Jetpack Compose).\n\nSemana passada o back-end renomeou um campo e a tela de saldo quebrou em produção sem ninguém perceber. Quero o contrato da API tipado no front-end para isso nunca mais acontecer.\n\nEntregue isso e eu mesmo assino sua promoção a Sênior.\n\nMarcos',
    },
    arquivosIniciaisIDE: [
      { caminho: 'README.md', linguagem: 'markdown', conteudo: '# Painel Fintech\n\nAPI: `GET /api/contas/{id}` devolve `{ "id": 1, "titular": "Ana", "saldo": 1520.75, "ativa": true }`\n' },
      {
        caminho: 'src/api/contrato.ts',
        linguagem: 'typescript',
        conteudo: `// Contrato da API de contas (DTO = Data Transfer Object)

// TODO: export interface ContaDTO { id, titular, saldo, ativa } com os tipos corretos

// TODO: export async function buscarConta(id: number): Promise<ContaDTO>
//       fazendo fetch em \`/api/contas/\${id}\` e devolvendo o JSON tipado
`,
      },
      {
        caminho: 'src/components/ContaCard.tsx',
        linguagem: 'typescript',
        conteudo: `import { useState } from "react";
import type { ContaDTO } from "../api/contrato";

// TODO: export function ContaCard({ conta }: { conta: ContaDTO })
//  - estado "visivel" (useState) para mostrar/ocultar o saldo
//  - um <button onClick=...> que alterna o estado
//  - estilize com classes Tailwind em className
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Verbos e status HTTP',
        mensagemIA:
          'Começando pelo contrato REST. O painel vai criar uma nova transferência. Qual requisição e qual resposta de sucesso seguem a convenção REST?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'GET /transferencias/criar?valor=100 → 200 OK',
            correta: false,
            feedbackIA: '`GET` deve ser seguro e idempotente: só leitura. Criar recurso via GET é perigoso (um link ou recarregar a página duplicaria a transferência!) e a URL não deve conter verbos.',
          },
          {
            id: 'opt_b',
            texto: 'POST /transferencias com o JSON no corpo → 201 Created',
            correta: true,
            feedbackIA:
              'Isso. `POST` cria, `GET` lê, `PUT` substitui o recurso inteiro, `PATCH` altera parcialmente, `DELETE` remove. Nos status: 2xx sucesso (`200 OK`, `201 Created`, `204 No Content`), 4xx erro do cliente (`400`, `401`, `404`), 5xx erro do servidor.',
          },
          {
            id: 'opt_c',
            texto: 'PUT /transferencias → 500 Internal Server Error',
            correta: false,
            feedbackIA: '`PUT` substitui um recurso existente em uma URL conhecida, e 5xx indica falha no servidor, nunca sucesso. Para criar: `POST`, respondendo `201 Created`.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Preparar o projeto Node/TypeScript',
        mensagemIA:
          'Monte o ecossistema no terminal:\n\n1. `npm init -y` — cria o `package.json`\n2. `npm install -D typescript` — instala o compilador como dependência de desenvolvimento\n3. `npx tsc --init` — gera o `tsconfig.json`\n\nDepois abra o `package.json` no editor e veja como a dependência foi registrada.',
        comandos: [
          { padrao: '^npm init', descricao: 'npm init -y' },
          { padrao: '^npm (install|i|add) .*typescript', descricao: 'npm install -D typescript' },
          { padrao: '^npx tsc --init', descricao: 'npx tsc --init' },
        ],
        dicas: ['Execute os três comandos em ordem. O `-D` salva em `devDependencies` (ferramentas usadas só no desenvolvimento).'],
      },
      {
        ordem: 3,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Versionamento semântico',
        mensagemIA:
          'No `package.json` apareceu `"typescript": "^5.9.3"`. As versões seguem o SemVer: MAJOR.MINOR.PATCH. O que o `^` permite que o `npm install` instale no futuro?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Somente a versão exata 5.9.3.',
            correta: false,
            feedbackIA: 'Versão exata é quando não há prefixo (`"5.9.3"`). O `^` dá uma faixa de atualização.',
          },
          {
            id: 'opt_b',
            texto: 'Qualquer 5.x.x a partir de 5.9.3 (novos MINOR e PATCH), mas nunca a 6.0.0.',
            correta: true,
            feedbackIA:
              'Exato. `^` aceita MINOR e PATCH novos (funcionalidades compatíveis e correções) e trava o MAJOR, que sinaliza quebra de compatibilidade. Já o `~5.9.3` é mais conservador: só PATCH (5.9.x).',
          },
          {
            id: 'opt_c',
            texto: 'Apenas correções: 5.9.x.',
            correta: false,
            feedbackIA: 'Esse é o comportamento do til (`~5.9.3`). O circunflexo (`^`) vai além: aceita também novos MINOR, como 5.10.0.',
          },
        ],
      },
      {
        ordem: 4,
        tipo: 'VALIDACAO_ESTATICA',
        titulo: 'Contrato tipado da API (DTO)',
        mensagemIA:
          'Agora o que evita o bug de produção. Em `src/api/contrato.ts`:\n\n• `export interface ContaDTO` com `id: number`, `titular: string`, `saldo: number` e `ativa: boolean`\n• `export async function buscarConta(id: number): Promise<ContaDTO>` usando `fetch`\n\nCom o DTO tipado no front-end espelhando o DTO do back-end, se alguém renomear um campo o `tsc` acusa o erro na compilação — e não na tela do usuário em produção. Nada de `any`!',
        regras: [
          { nome: 'Interface ContaDTO exportada', arquivo: 'src/api/contrato.ts', padrao: 'export\\s+interface\\s+ContaDTO\\s*\\{', dica: 'Declare `export interface ContaDTO { ... }`.' },
          { nome: 'id: number', arquivo: 'src/api/contrato.ts', padrao: 'interface\\s+ContaDTO\\s*\\{[^}]*\\bid\\s*:\\s*number', dica: 'Dentro da interface: `id: number;`.' },
          { nome: 'titular: string', arquivo: 'src/api/contrato.ts', padrao: 'interface\\s+ContaDTO\\s*\\{[^}]*\\btitular\\s*:\\s*string', dica: 'Dentro da interface: `titular: string;`.' },
          { nome: 'saldo: number', arquivo: 'src/api/contrato.ts', padrao: 'interface\\s+ContaDTO\\s*\\{[^}]*\\bsaldo\\s*:\\s*number', dica: 'Dentro da interface: `saldo: number;`.' },
          { nome: 'ativa: boolean', arquivo: 'src/api/contrato.ts', padrao: 'interface\\s+ContaDTO\\s*\\{[^}]*\\bativa\\s*:\\s*boolean', dica: 'Dentro da interface: `ativa: boolean;`.' },
          { nome: 'Função buscarConta tipada', arquivo: 'src/api/contrato.ts', padrao: 'export\\s+async\\s+function\\s+buscarConta\\s*\\(\\s*id\\s*:\\s*number\\s*\\)\\s*:\\s*Promise\\s*<\\s*ContaDTO\\s*>', dica: 'Assinatura: `export async function buscarConta(id: number): Promise<ContaDTO>`.' },
          { nome: 'Consome a API com fetch', arquivo: 'src/api/contrato.ts', padrao: '\\bfetch\\s*\\(', dica: 'Chame a API com `await fetch(...)` e devolva `await resposta.json()`.' },
          { nome: 'Sem escapar da tipagem com any', arquivo: 'src/api/contrato.ts', padrao: ':\\s*any\\b|\\bas\\s+any\\b|<\\s*any\\s*>', deveExistir: false, dica: '`any` desliga a checagem de tipos — exatamente a proteção que estamos construindo. Use `ContaDTO`.' },
        ],
        dicas: [
          'export interface ContaDTO {\n  id: number;\n  titular: string;\n  saldo: number;\n  ativa: boolean;\n}',
          'export async function buscarConta(id: number): Promise<ContaDTO> {\n  const resposta = await fetch("/api/contas/" + id);\n  return (await resposta.json()) as ContaDTO;\n}',
        ],
      },
      {
        ordem: 5,
        tipo: 'VALIDACAO_ESTATICA',
        titulo: 'Componente React com estado',
        mensagemIA:
          'Agora a UI declarativa. Em `src/components/ContaCard.tsx`, crie o componente `ContaCard`:\n\n• recebe a prop `conta` tipada como `ContaDTO`\n• guarda em um estado (`useState`) se o saldo está visível\n• um `<button>` com `onClick` alterna esse estado\n• estilo com classes Tailwind em `className`\n\nNo React você descreve a tela em função do estado; quando o estado muda, o React re-renderiza sozinho.',
        regras: [
          { nome: 'Componente ContaCard exportado', arquivo: 'src/components/ContaCard.tsx', padrao: 'export\\s+(default\\s+)?function\\s+ContaCard\\s*\\(', dica: 'Declare `export function ContaCard(...)` — componentes são funções com nome em PascalCase.' },
          { nome: 'Prop tipada com ContaDTO', arquivo: 'src/components/ContaCard.tsx', padrao: 'function\\s+ContaCard\\s*\\([^)]*ContaDTO', dica: 'Tipe as props: `function ContaCard({ conta }: { conta: ContaDTO })`.' },
          { nome: 'Estado com o hook useState', arquivo: 'src/components/ContaCard.tsx', padrao: 'const\\s*\\[\\s*\\w+\\s*,\\s*set\\w+\\s*\\]\\s*=\\s*useState', dica: 'Crie o estado: `const [visivel, setVisivel] = useState(false);`.' },
          { nome: 'Botão alterna o estado no onClick', arquivo: 'src/components/ContaCard.tsx', padrao: 'onClick\\s*=\\s*\\{[^}]*set\\w+\\s*\\(', dica: 'No botão: `onClick={() => setVisivel(!visivel)}`.' },
          { nome: 'Exibe dados da conta', arquivo: 'src/components/ContaCard.tsx', padrao: '\\{[^}]*conta\\.(titular|saldo)', dica: 'Mostre os dados no JSX entre chaves: `{conta.titular}` e `{conta.saldo}`.' },
          { nome: 'Estilização com Tailwind (className)', arquivo: 'src/components/ContaCard.tsx', padrao: 'className\\s*=\\s*"[^"]+"', dica: 'Estilize com utilitários Tailwind, ex.: `className="rounded-lg p-4 shadow"`.' },
        ],
        dicas: [
          'export function ContaCard({ conta }: { conta: ContaDTO }) {\n  const [visivel, setVisivel] = useState(false);\n  return (\n    <div className="rounded-lg bg-white p-4 shadow">\n      <h2 className="font-bold">{conta.titular}</h2>\n      <p>{visivel ? conta.saldo : "••••"}</p>\n      <button onClick={() => setVisivel(!visivel)}>Mostrar/ocultar</button>\n    </div>\n  );\n}',
        ],
      },
      {
        ordem: 6,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Mobile com Jetpack Compose',
        mensagemIA:
          'O time mobile vai construir a mesma tela no Android com Kotlin e Jetpack Compose, que também é UI declarativa. Dentro de uma função `@Composable`, qual layout empilha o titular e o saldo um abaixo do outro?',
        opcoes: [
          { id: 'opt_a', texto: 'Row { ... }', correta: false, feedbackIA: '`Row` organiza os filhos lado a lado, na horizontal. Para empilhar na vertical, o layout é outro.' },
          {
            id: 'opt_b',
            texto: 'Column { ... }',
            correta: true,
            feedbackIA:
              'Isso! `Column` = vertical, `Row` = horizontal, `Box` = sobreposição, e o `Scaffold` monta a estrutura da tela (barra superior, conteúdo, botão flutuante). A ideia é a mesma do React: funções `@Composable` descrevem a UI a partir do estado, normalmente exposto por um ViewModel (arquitetura MVVM).',
          },
          { id: 'opt_c', texto: 'Box { ... }', correta: false, feedbackIA: '`Box` sobrepõe os filhos, um em cima do outro no mesmo espaço (útil para um selo sobre uma imagem). Para empilhar na vertical, use `Column`.' },
        ],
      },
      {
        ordem: 7,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Compilar e entregar',
        mensagemIA:
          'Projeto integrador quase pronto! Compile com `npx tsc` para garantir que os contratos fecham e depois entregue: `git add .`, `git commit -m "..."`, `git push`.',
        comandos: [
          { padrao: '^(npx tsc|npm run build)$', descricao: 'npx tsc' },
          { padrao: '^git add ', descricao: 'git add .' },
          { padrao: '^git commit ', descricao: 'git commit -m "..."' },
          { padrao: '^git push', descricao: 'git push' },
        ],
        dicas: ['`npx tsc && git add . && git commit -m "feat: painel fintech" && git push`'],
      },
    ],
  },
];
