// "Lente de sintaxe": explicações curtas exibidas ao passar o mouse no editor.
type Glossario = Record<string, string>;

const python: Glossario = {
  def: 'Define uma função: `def nome(parametros):`',
  return: 'Encerra a função e devolve um valor a quem chamou.',
  if: 'Desvio condicional: executa o bloco se a condição for verdadeira.',
  elif: '“Senão, se”: testado apenas quando as condições anteriores falharam.',
  else: 'Caminho padrão, quando nenhuma condição anterior foi verdadeira.',
  for: 'Laço que percorre uma sequência: `for item in sequencia:`',
  while: 'Laço que repete enquanto a condição for verdadeira.',
  in: 'Em `for`, entrega cada item; em expressões, testa se um valor pertence à coleção.',
  and: 'E lógico: verdadeiro só se as duas condições forem verdadeiras.',
  or: 'OU lógico: verdadeiro se pelo menos uma condição for verdadeira.',
  not: 'Negação lógica: inverte True/False.',
  pass: 'Instrução vazia: um marcador de “ainda não implementado”. A função devolve None.',
  import: 'Carrega um módulo para uso neste arquivo.',
  from: '`from modulo import nome`: importa nomes específicos de um módulo.',
  with: 'Gerenciador de contexto: garante o fechamento do recurso (arquivo, conexão) ao sair do bloco.',
  as: 'Dá um nome ao recurso aberto pelo `with` (ou um apelido a um import).',
  try: 'Abre um bloco protegido contra exceções.',
  except: 'Captura a exceção indicada e executa o tratamento.',
  raise: 'Lança uma exceção, interrompendo o fluxo normal.',
  class: 'Define uma classe (molde para criar objetos).',
  self: 'Referência ao próprio objeto, dentro dos métodos de uma classe.',
  lambda: 'Função anônima de uma única expressão.',
  None: 'Valor que representa “ausência de valor”.',
  True: 'Valor booleano verdadeiro.',
  False: 'Valor booleano falso.',
  is: 'Testa identidade (mesmo objeto). Use `is None` para checar ausência de valor.',
  range: '`range(n)` gera os inteiros de 0 a n-1, sem criar a lista na memória.',
  len: 'Devolve a quantidade de itens de uma coleção.',
  open: 'Abre um arquivo. Modos: "r" leitura, "w" escrita destrutiva, "a" acréscimo.',
  print: 'Escreve no terminal (saída padrão).',
  input: 'Lê uma linha digitada no terminal. Sempre devolve `str`.',
  int: 'Converte para número inteiro.',
  float: 'Converte para número com casas decimais.',
  str: 'Converte para texto.',
  bool: 'Tipo lógico: True ou False.',
  list: 'Lista: sequência ordenada e mutável — `[1, 2, 3]`.',
  dict: 'Dicionário: pares chave-valor com busca O(1) — `{"chave": valor}`.',
  tuple: 'Tupla: sequência ordenada e IMUTÁVEL — `(1, 2, 3)`.',
  round: '`round(x, n)` arredonda x para n casas decimais.',
  max: 'Maior valor de uma coleção.',
  min: 'Menor valor de uma coleção.',
  sum: 'Soma dos valores de uma coleção.',
  split: 'Quebra um texto em uma lista, usando o separador.',
  strip: 'Remove espaços e quebras de linha das pontas do texto.',
  append: 'Adiciona um item ao final da lista.',
  'json.dump': 'Grava um objeto Python como JSON em um arquivo aberto.',
  'json.dumps': 'Converte um objeto Python em texto JSON (string).',
  'json.load': 'Lê JSON de um arquivo aberto e devolve objetos Python.',
  'json.loads': 'Converte um texto JSON em objetos Python.',
  'os.getcwd': 'Pasta de trabalho atual do processo.',
  'os.path.exists': 'True se o caminho existe no disco.',
  'socket.socket': 'Cria um socket. AF_INET = IPv4; SOCK_STREAM = TCP; SOCK_DGRAM = UDP.',
  connect_ex: 'Tenta conectar e devolve 0 em caso de sucesso (não lança exceção).',
  gethostbyname: 'Resolve um nome de host para o endereço IP (DNS).',
  'math.ceil': 'Arredonda para cima, até o próximo inteiro.',
};

const sql: Glossario = {
  SELECT: 'Consulta dados (DQL). Lista as colunas desejadas.',
  FROM: 'Indica a tabela de origem dos dados.',
  WHERE: 'Filtra as linhas. Em UPDATE/DELETE, esquecer o WHERE afeta a tabela inteira.',
  INSERT: '`INSERT INTO tabela (colunas) VALUES (valores)`: adiciona uma linha.',
  INTO: 'Indica a tabela de destino do INSERT.',
  VALUES: 'Valores a inserir, na ordem das colunas listadas.',
  UPDATE: 'Altera linhas existentes: `UPDATE tabela SET coluna = valor WHERE ...`',
  SET: 'No UPDATE, define as colunas e seus novos valores.',
  DELETE: 'Remove linhas. Sem WHERE, remove todas.',
  CREATE: 'DDL: cria um objeto do banco (tabela, sequence, índice).',
  TABLE: 'Tabela: estrutura de linhas e colunas do modelo relacional.',
  CONSTRAINT: 'Regra de integridade com nome (pk_, fk_, un_, ck_).',
  PRIMARY: '`PRIMARY KEY`: identifica cada linha. Única e obrigatória.',
  FOREIGN: '`FOREIGN KEY`: o valor precisa existir na tabela referenciada.',
  KEY: 'Chave: coluna(s) usada(s) para identificar ou relacionar linhas.',
  REFERENCES: 'Tabela e coluna “pai” de uma chave estrangeira.',
  UNIQUE: 'Impede valores repetidos na coluna.',
  CHECK: 'Só aceita linhas em que a condição é verdadeira.',
  NOT: '`NOT NULL`: preenchimento obrigatório. Também nega condições.',
  NULL: 'Ausência de valor. Teste com `IS NULL`, nunca com `= NULL`.',
  JOIN: 'Combina linhas de duas tabelas por uma condição.',
  INNER: '`INNER JOIN`: só linhas com correspondência nos dois lados.',
  LEFT: '`LEFT JOIN`: todas as linhas da tabela da esquerda, com NULL onde não há par.',
  ON: 'Condição que liga as tabelas em um JOIN.',
  ORDER: '`ORDER BY`: ordena o resultado.',
  BY: 'Complemento de ORDER BY / GROUP BY.',
  DESC: 'Ordem decrescente.',
  ASC: 'Ordem crescente (padrão).',
  COMMIT: 'Confirma a transação: as alterações tornam-se permanentes.',
  ROLLBACK: 'Desfaz tudo o que ainda não foi confirmado com COMMIT.',
  VARCHAR2: 'Texto de tamanho variável (dialeto Oracle; no padrão ANSI é VARCHAR).',
  NUMBER: '`NUMBER(p, s)`: número com p dígitos no total e s casas decimais (Oracle).',
  DATE: 'Data (no Oracle, inclui hora).',
  IS: 'Operador para testar NULL: `IS NULL` / `IS NOT NULL`.',
};

const java: Glossario = {
  package: 'Declara o pacote (pasta lógica) da classe.',
  public: 'Visível para qualquer classe.',
  private: 'Visível apenas dentro da própria classe (encapsulamento).',
  protected: 'Visível para subclasses e classes do mesmo pacote.',
  class: 'Declara uma classe.',
  abstract: 'Classe que não pode ser instanciada / método sem corpo, a ser implementado pelas subclasses.',
  extends: 'Herança: a classe herda de outra.',
  super: 'Referência à superclasse; `super(...)` chama o construtor dela.',
  this: 'Referência ao objeto atual.',
  new: 'Cria (instancia) um objeto na memória.',
  void: 'O método não devolve valor.',
  boolean: 'Tipo lógico: true ou false.',
  double: 'Número com casas decimais (64 bits).',
  String: 'Texto (objeto imutável).',
  return: 'Encerra o método e devolve um valor.',
  if: 'Desvio condicional.',
  '@Override': 'Indica que o método sobrescreve o da superclasse; o compilador confere a assinatura.',
  static: 'Pertence à classe, não a um objeto específico.',
  final: 'Não pode ser alterado (variável), sobrescrito (método) ou herdado (classe).',
};

const typescript: Glossario = {
  interface: 'Descreve o formato de um objeto. Existe só em tempo de compilação.',
  export: 'Torna o item disponível para outros arquivos.',
  import: 'Traz itens exportados por outro módulo.',
  type: 'Em `import type`, importa apenas o tipo (some no JavaScript final).',
  async: 'Função assíncrona: devolve uma Promise e permite `await`.',
  await: 'Espera a Promise resolver e entrega o valor.',
  function: 'Declara uma função.',
  const: 'Declara uma variável que não pode ser reatribuída.',
  number: 'Tipo numérico (inteiros e decimais).',
  string: 'Tipo texto.',
  boolean: 'Tipo lógico: true ou false.',
  Promise: 'Valor que chegará no futuro (resultado assíncrono).',
  fetch: 'Faz uma requisição HTTP e devolve uma Promise com a resposta.',
  useState: 'Hook de estado do React: `[valor, setValor]`. Alterar o estado re-renderiza o componente.',
  className: 'Atributo JSX para classes CSS (no HTML seria `class`).',
  onClick: 'Evento de clique do React.',
  return: 'Devolve o valor — em componentes, o JSX a ser renderizado.',
  as: 'Asserção de tipo: diz ao compilador como tratar o valor.',
  any: 'Desliga a checagem de tipos. Evite.',
};

const dockerfile: Glossario = {
  FROM: 'Imagem base sobre a qual a sua é construída. Sempre a primeira instrução.',
  WORKDIR: 'Define a pasta de trabalho dentro da imagem.',
  COPY: 'Copia arquivos do projeto para a imagem. Cria uma camada.',
  RUN: 'Executa um comando durante o BUILD. Cria uma camada.',
  ENV: 'Define variável de ambiente NA IMAGEM. Nunca use para segredos.',
  ARG: 'Variável disponível só durante o build (mas visível no histórico).',
  EXPOSE: 'Documenta a porta em que o contêiner escuta.',
  CMD: 'Comando padrão executado quando o contêiner INICIA.',
  ENTRYPOINT: 'Executável principal do contêiner.',
};

const yaml: Glossario = {
  apiVersion: 'Versão da API do Kubernetes para este tipo de recurso.',
  kind: 'Tipo do recurso: Deployment, Service, Pod...',
  metadata: 'Dados de identificação: nome, labels.',
  spec: 'Estado DESEJADO do recurso. O Kubernetes trabalha para mantê-lo.',
  replicas: 'Quantidade de pods que devem estar no ar.',
  selector: 'Define quais pods pertencem a este Deployment (pelas labels).',
  template: 'Molde dos pods que serão criados.',
  containers: 'Lista de contêineres de cada pod.',
  image: 'Imagem (repositório:tag) que o contêiner executa.',
  containerPort: 'Porta em que a aplicação escuta dentro do contêiner.',
  labels: 'Etiquetas chave-valor usadas para agrupar e selecionar recursos.',
};

const javascript: Glossario = {
  use: '`use banco`: seleciona o banco de dados no mongosh.',
  createCollection: 'Cria uma coleção, opcionalmente com um validador.',
  insertOne: 'Insere um documento na coleção.',
  insertMany: 'Insere vários documentos (array) de uma vez.',
  find: 'Consulta documentos que casam com o filtro.',
  findOne: 'Devolve o primeiro documento que casa com o filtro.',
  updateOne: 'Atualiza o primeiro documento que casa com o filtro (use operadores como $set).',
  deleteMany: 'Remove todos os documentos que casam com o filtro.',
  validator: 'Regras aplicadas a cada documento gravado na coleção.',
  $jsonSchema: 'Valida a estrutura do documento: tipos, campos obrigatórios, limites.',
  bsonType: 'Tipo de dado esperado (string, number, object, array...).',
  required: 'Campos obrigatórios do documento.',
  properties: 'Regras específicas para cada campo.',
  minimum: 'Menor valor numérico aceito.',
};

export const GLOSSARIO: Record<string, Glossario> = { python, sql, java, typescript, dockerfile, yaml, javascript };

/** Procura a explicação do identificador sob a coluna (1-based) da linha. */
export function explicar(linguagem: string, linha: string, coluna: number): { termo: string; texto: string } | null {
  const g = GLOSSARIO[linguagem];
  if (!g) return null;
  for (const m of linha.matchAll(/[@$]?[A-Za-z_][\w.]*/g)) {
    const inicio = m.index + 1;
    if (coluna < inicio || coluna > inicio + m[0].length) continue;
    const partes = m[0].split('.');
    // "json.dump" → tenta o nome composto, depois o segmento sob o cursor.
    let acumulado = inicio;
    const sob = partes.find((p) => {
      const dentro = coluna <= acumulado + p.length;
      acumulado += p.length + 1;
      return dentro;
    })!;
    const candidatos = [m[0], partes.slice(-2).join('.'), sob];
    for (const c of candidatos) {
      const chave = linguagem === 'sql' ? c.toUpperCase() : c;
      if (g[chave]) return { termo: chave, texto: g[chave] };
    }
  }
  return null;
}
