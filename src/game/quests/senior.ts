import type { Quest } from '../types';
import { entregaGit } from './pleno';

const py = String.raw;
const TECH_LEAD = 'marcos.silva@nexustech.dev (Tech Lead)';
const CTO = 'helena.duarte@nexustech.dev (CTO)';

export const SENIOR: Quest[] = [
  {
    _id: 'quest_sr_01_microsservicos',
    codigo: 'Sr 01',
    titulo: 'Do Monólito aos Microsserviços',
    nivelCarreira: 'SENIOR',
    ordemTrilha: 12,
    recompensaXP: 200,
    repoPronto: true,
    conceitos: ['Monólito vs Microsserviços', 'Service Discovery (Eureka)', 'API Gateway', 'Round-Robin', 'Comunicação síncrona entre serviços'],
    email: {
      remetente: CTO,
      assunto: '[INCIDENTE] Loja fora do ar por 3 horas - precisamos mudar a arquitetura',
      corpo:
        'Bem-vindo(a) ao time de arquitetura.\n\nOntem um bug no módulo de Entregas consumiu toda a memória do servidor e derrubou o sistema inteiro de Pedidos e Entregas. A loja ficou 3 horas sem vender, por causa de uma falha em uma parte que nem participa do checkout.\n\nO sistema cresceu demais para ser um bloco só. Quero um plano de migração para microsserviços e um protótipo do balanceamento de carga do gateway: as instâncias do serviço de pedidos rodam nas portas 58817, 58370 e 58892.\n\nHelena',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'gateway/balanceador.py',
        linguagem: 'python',
        conteudo: py`class BalanceadorRoundRobin:
    """Distribui as requisições entre as instâncias registradas (Service Discovery)."""

    def __init__(self):
        self.instancias = []
        # TODO: guarde aqui a posição da próxima instância

    def registrar(self, porta: int) -> None:
        # TODO: adicione a instância (sem duplicar)
        pass

    def remover(self, porta: int) -> None:
        # TODO: tire a instância da lista (ela caiu ou parou de mandar heartbeat)
        pass

    def proxima(self) -> int:
        # TODO: devolva a porta da próxima instância, em rodízio (Round-Robin).
        # Sem instâncias disponíveis: raise RuntimeError("Nenhuma instância disponível")
        pass
`,
      },
      {
        caminho: 'servicos/entregas.py',
        linguagem: 'python',
        conteudo: py`# Serviço de Entregas: avança o status de um pedido.
FLUXO = ["EM_SEPARACAO", "EM_TRANSPORTE", "ENTREGUE"]


def avancar_status(status_atual: str) -> str:
    # TODO: devolva o próximo status do FLUXO.
    # Status desconhecido ou já "ENTREGUE": raise ValueError
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Monólito ou microsserviços?',
        mensagemIA:
          'Agora você é quem decide a arquitetura. A Helena quer migrar para microsserviços. Qual é o trade-off real dessa decisão?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Microsserviços são superiores em tudo; todo monólito deveria ser reescrito.',
            correta: false,
            feedbackIA: 'Resposta de quem nunca operou 30 serviços de madrugada. Para um time pequeno e um domínio simples, um monólito bem modularizado é mais barato e mais rápido de evoluir. Arquitetura é sempre trade-off.',
          },
          {
            id: 'opt_b',
            texto: 'Ganhamos isolamento de falhas, escalabilidade e deploy independentes (e um banco por serviço), pagando com mais complexidade de infraestrutura e de comunicação em rede.',
            correta: true,
            feedbackIA:
              'Resposta de arquiteto(a). Cada serviço pode ter sua tecnologia e seu banco, escala sozinho, e uma falha em Entregas não derruba Pedidos. O preço: rede entre os serviços, service discovery, gateway, observabilidade e consistência eventual. No nosso caso — incidente de 3 horas e times separados — o preço compensa.',
          },
          {
            id: 'opt_c',
            texto: 'Microsserviços deixam o sistema mais simples de operar, porque cada parte é pequena.',
            correta: false,
            feedbackIA: 'Cada serviço fica mais simples, mas o sistema como um todo fica mais complexo de operar: são dezenas de deploys, chamadas de rede que falham, logs espalhados. Essa complexidade é o preço do isolamento.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Como os serviços se encontram',
        mensagemIA:
          'As instâncias do serviço de pedidos sobem e caem o tempo todo, em portas dinâmicas (hoje: 58817, 58370 e 58892). Como o serviço de Entregas descobre para onde mandar as requisições?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Fixar os endereços e portas em um arquivo de configuração de cada serviço.',
            correta: false,
            feedbackIA: 'Com portas dinâmicas e instâncias efêmeras, esse arquivo estaria desatualizado em minutos, e cada mudança exigiria um novo deploy de todos os serviços.',
          },
          {
            id: 'opt_b',
            texto: 'Service Discovery (Netflix Eureka): cada instância se registra ao subir, e o API Gateway consulta o registro para rotear e balancear.',
            correta: true,
            feedbackIA:
              'Exato. Com o **Eureka**, cada instância se registra e envia heartbeats; quem para de responder sai do registro. O **API Gateway** (Spring Cloud Gateway) é a porta única de entrada: consulta o registro e distribui o tráfego entre as instâncias, tipicamente em **Round-Robin**.',
          },
          {
            id: 'opt_c',
            texto: 'O cliente (navegador/app) testa todas as portas possíveis até uma responder.',
            correta: false,
            feedbackIA: 'Isso exporia a topologia interna para a internet e seria lentíssimo. O cliente deve conhecer um único endereço: o do API Gateway.',
          },
        ],
      },
      {
        ordem: 3,
        tipo: 'SIMULACAO',
        simulador: 'balanceador',
        titulo: 'Teste de carga no API Gateway',
        mensagemIA:
          'Hora de provar a arquitetura. Na **Sala de Guerra** (painel central) há um teste de carga contra o gateway — e, no meio dele, a instância **58817 vai cair**.\n\nConfigure o gateway e rode o teste. Meta: **99% de disponibilidade**, mesmo com a queda. Pode rodar quantas vezes quiser: observe para onde vão as requisições que falham.',
        dicas: [
          'Com endereço fixo, tudo depende de uma instância só. Comece distribuindo a carga.',
          'Depois que a instância cai, quem avisa o gateway? Sem heartbeat, ele continua mandando tráfego para ela.',
          'O heartbeat leva alguns ciclos para detectar a queda. O que o gateway pode fazer com uma requisição que falhou nesse intervalo?',
        ],
      },
      {
        ordem: 4,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Balanceador Round-Robin',
        arquivo: 'gateway/balanceador.py',
        mensagemIA:
          'Você viu o Round-Robin funcionando no simulador; agora vamos prototipar esse coração do gateway. Implemente a classe `BalanceadorRoundRobin` em `gateway/balanceador.py`:\n\n• `registrar(porta)` — a instância entrou no registro\n• `remover(porta)` — a instância caiu\n• `proxima()` — devolve a próxima porta em rodízio\n\nNo teste de carga eu vou **derrubar a instância 58817** no meio do tráfego: o balanceador deve redirecionar tudo para 58370 e 58892 sem que o usuário final perceba.',
        testes: [
          {
            nome: 'Rodízio na ordem de registro',
            codigo: py`m = carregar("gateway/balanceador.py")
b = m.BalanceadorRoundRobin()
for porta in (58817, 58370, 58892):
    b.registrar(porta)
r = [b.proxima() for _ in range(6)]
assert r == [58817, 58370, 58892, 58817, 58370, 58892], f"Esperado o rodízio 58817, 58370, 58892 repetido; veio {r!r}."`,
          },
          {
            nome: 'Registro não duplica instâncias',
            codigo: py`m = carregar("gateway/balanceador.py")
b = m.BalanceadorRoundRobin()
b.registrar(58370)
b.registrar(58370)
b.registrar(58892)
r = [b.proxima() for _ in range(4)]
assert r == [58370, 58892, 58370, 58892], f"A mesma instância foi registrada duas vezes e recebeu tráfego dobrado: {r!r}."`,
          },
          {
            nome: 'Queda da instância 58817 durante o teste de carga',
            codigo: py`m = carregar("gateway/balanceador.py")
b = m.BalanceadorRoundRobin()
for porta in (58817, 58370, 58892):
    b.registrar(porta)
b.proxima(); b.proxima()
b.remover(58817)
r = [b.proxima() for _ in range(100)]
assert 58817 not in r, "A instância 58817 caiu, mas ainda recebeu requisições."
assert r.count(58370) == 50 and r.count(58892) == 50, f"O tráfego deveria se dividir 50/50 entre as instâncias vivas. Veio: 58370={r.count(58370)}, 58892={r.count(58892)}."
assert all(r[i] != r[i + 1] for i in range(99)), "As instâncias vivas devem se alternar a cada requisição."`,
          },
          {
            nome: 'Sem instâncias: RuntimeError',
            codigo: py`m = carregar("gateway/balanceador.py")
b = m.BalanceadorRoundRobin()
b.registrar(58817)
b.remover(58817)
try:
    b.proxima()
except RuntimeError:
    pass
except Exception as e:
    raise AssertionError(f"Esperado RuntimeError, veio {type(e).__name__}: {e}")
else:
    raise AssertionError("Sem instâncias disponíveis, proxima() deve lançar RuntimeError.")`,
          },
        ],
        dicas: [
          'Guarde um índice: `self.indice = 0`. Em `proxima()`, pegue `self.instancias[self.indice % len(self.instancias)]` e depois some 1 ao índice.',
          'O operador `%` (resto) faz o índice “dar a volta” e também protege contra índice fora da lista depois de um `remover`.',
          'def proxima(self):\n    if not self.instancias:\n        raise RuntimeError("Nenhuma instância disponível")\n    porta = self.instancias[self.indice % len(self.instancias)]\n    self.indice += 1\n    return porta',
        ],
      },
      {
        ordem: 5,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Comunicação entre serviços',
        arquivo: 'servicos/entregas.py',
        mensagemIA:
          'Quando a transportadora coleta o pacote, o serviço de Entregas chama o serviço de Pedidos de forma síncrona (HTTP REST — no ecossistema Spring isso é feito com OpenFeign) para atualizar o status de `EM_SEPARACAO` para `EM_TRANSPORTE`.\n\nImplemente a regra em `servicos/entregas.py`: `avancar_status(status_atual)` devolve o próximo status do fluxo, e rejeita transições inválidas com `ValueError`.',
        funcaoAlvo: 'avancar_status',
        casosDeTeste: [
          { input: ['EM_SEPARACAO'], outputEsperado: 'EM_TRANSPORTE' },
          { input: ['EM_TRANSPORTE'], outputEsperado: 'ENTREGUE' },
        ],
        testes: [
          {
            nome: 'Transições inválidas lançam ValueError',
            codigo: py`m = carregar("servicos/entregas.py")
for invalido in ("ENTREGUE", "CANCELADO", ""):
    try:
        r = m.avancar_status(invalido)
    except ValueError:
        continue
    except Exception as e:
        raise AssertionError(f"Para {invalido!r} era esperado ValueError, veio {type(e).__name__}.")
    raise AssertionError(f"avancar_status({invalido!r}) deveria lançar ValueError, mas devolveu {r!r}.")`,
          },
        ],
        dicas: [
          'Use a posição na lista: `i = FLUXO.index(status_atual)` já lança `ValueError` sozinho se o status não existir.',
          'Se `i` for a última posição (`len(FLUXO) - 1`), faça `raise ValueError("Pedido já entregue")`; senão `return FLUXO[i + 1]`.',
        ],
      },
      entregaGit(6),
    ],
  },

  {
    _id: 'quest_sr_02_replica_sets',
    codigo: 'Sr 02',
    titulo: 'Alta Disponibilidade & Replica Sets',
    nivelCarreira: 'SENIOR',
    ordemTrilha: 13,
    recompensaXP: 200,
    repoPronto: true,
    conceitos: ['Replica Set: Primary / Secondary / Arbiter', 'Heartbeat', 'Eleição e Failover', 'Read Preference', 'Sharding'],
    email: {
      remetente: CTO,
      assunto: 'O banco não pode ser um ponto único de falha',
      corpo:
        'Com os serviços isolados, o próximo risco é o banco de dados: hoje ele roda em um único servidor. Se essa máquina cair, perdemos vendas — e possivelmente dados.\n\nQuero o cluster no MongoDB Atlas configurado como Replica Set, resistindo à queda do servidor principal sem perda de dados nem indisponibilidade.\n\nE o time de BI reclama que o relatório analítico mensal deixa as transações financeiras lentas. Resolva isso também.\n\nHelena',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'cluster/eleicao.py',
        linguagem: 'python',
        conteudo: py`# Simulação do processo de eleição (failover) de um Replica Set.
#
# Cada nó é um dicionário:
#   {"nome": "db-1", "tipo": "primary" | "secondary" | "arbiter",
#    "ativo": True, "optime": 120}
#
# 'optime' indica até onde o nó replicou os dados (maior = mais atualizado).


def eleger_primario(nos: list):
    # Regras:
    # 1. Só existe primário se a MAIORIA dos nós (mais da metade do total)
    #    estiver ativa. Sem maioria -> devolva None (cluster só leitura).
    # 2. Se o primário atual está ativo, ele continua: devolva o nome dele.
    # 3. Caso contrário, vence o SECONDARY ativo com maior optime.
    #    O árbitro vota (conta para a maioria), mas nunca é eleito.
    # TODO: devolva o nome do nó primário, ou None
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Papéis no Replica Set',
        mensagemIA:
          'Em um Replica Set, o **Primary** recebe todas as escritas e os **Secondaries** replicam os dados de forma assíncrona. Os nós trocam *heartbeats*; se o primário para de responder, os demais fazem uma eleição automática (failover).\n\nPor orçamento, só podemos pagar 2 servidores com dados. Um colega sugeriu adicionar um **Arbiter**. Para que ele serve?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'É um terceiro nó com cópia completa dos dados, usado como backup.',
            correta: false,
            feedbackIA: 'O árbitro justamente NÃO guarda dados — por isso é barato. Uma cópia completa seria mais um Secondary.',
          },
          {
            id: 'opt_b',
            texto: 'Não guarda dados: só vota nas eleições, para desempatar e garantir maioria com um número ímpar de votantes.',
            correta: true,
            feedbackIA:
              'Isso. Eleição exige maioria. Com 2 nós, se um cai, o outro tem 1 de 2 votos: não é maioria, e o cluster fica só leitura. Com o árbitro são 3 votantes: caindo um nó de dados, o outro e o árbitro somam 2 de 3 e elegem o novo primário.',
          },
          {
            id: 'opt_c',
            texto: 'É o nó que decide para qual Secondary cada consulta de leitura será enviada.',
            correta: false,
            feedbackIA: 'Quem define o destino das leituras é a *Read Preference* configurada no driver da aplicação. O árbitro só participa de eleições.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Read Preference',
        mensagemIA:
          'Agora o problema do BI: o relatório analítico mensal varre milhões de documentos e disputa recursos com as transações financeiras no nó `Primary`. O relatório tolera dados com alguns segundos de atraso. Qual *Read Preference* você configura **na conexão do relatório**?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'primary — todas as leituras no nó primário.',
            correta: false,
            feedbackIA: 'É o padrão, e é exatamente o que causa o problema: o relatório pesado compete com as transações financeiras no mesmo nó.',
          },
          {
            id: 'opt_b',
            texto: 'secondary — as leituras do relatório vão para os nós secundários.',
            correta: true,
            feedbackIA:
              'Decisão certa: o relatório tolera o pequeno atraso da replicação assíncrona e sai de cima do primário. As transações financeiras continuam com `primary`, que garante leitura do dado mais recente. Outras opções: `primaryPreferred`, `secondaryPreferred` e `nearest` (menor latência de rede).',
          },
          {
            id: 'opt_c',
            texto: 'nearest — o nó com menor latência de rede.',
            correta: false,
            feedbackIA: '`nearest` otimiza latência para usuários espalhados geograficamente, mas o nó mais próximo pode ser o próprio primário — e o relatório continuaria competindo com as transações.',
          },
        ],
      },
      {
        ordem: 3,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Simular a eleição automática',
        arquivo: 'cluster/eleicao.py',
        mensagemIA:
          'Para o time entender o failover antes de configurarmos o Atlas, implemente a simulação `eleger_primario(nos)` em `cluster/eleicao.py`, seguindo as três regras descritas no arquivo.\n\nPor que o maior `optime` vence? Porque é o nó com a réplica mais atualizada: elegê-lo minimiza a perda de escritas que ainda não tinham sido replicadas.',
        testes: [
          {
            nome: 'Primário saudável continua no cargo',
            codigo: py`m = carregar("cluster/eleicao.py")
nos = [
    {"nome": "db-1", "tipo": "primary", "ativo": True, "optime": 120},
    {"nome": "db-2", "tipo": "secondary", "ativo": True, "optime": 120},
    {"nome": "db-3", "tipo": "secondary", "ativo": True, "optime": 118},
]
r = m.eleger_primario(nos)
assert r == "db-1", f"O primário está ativo: não há eleição. Esperado 'db-1', veio {r!r}."`,
          },
          {
            nome: 'Failover: vence o secundário mais atualizado',
            codigo: py`m = carregar("cluster/eleicao.py")
nos = [
    {"nome": "db-1", "tipo": "primary", "ativo": False, "optime": 125},
    {"nome": "db-2", "tipo": "secondary", "ativo": True, "optime": 119},
    {"nome": "db-3", "tipo": "secondary", "ativo": True, "optime": 124},
]
r = m.eleger_primario(nos)
assert r == "db-3", f"O primário caiu; o secundário ativo com maior optime é db-3. Veio {r!r}."`,
          },
          {
            nome: 'Árbitro garante a maioria, mas nunca é eleito',
            codigo: py`m = carregar("cluster/eleicao.py")
nos = [
    {"nome": "db-1", "tipo": "primary", "ativo": False, "optime": 300},
    {"nome": "db-2", "tipo": "secondary", "ativo": True, "optime": 290},
    {"nome": "arbitro", "tipo": "arbiter", "ativo": True, "optime": 999},
]
r = m.eleger_primario(nos)
assert r == "db-2", f"Com 2 de 3 votantes ativos há maioria, e o único candidato com dados é db-2. Veio {r!r}."`,
          },
          {
            nome: 'Sem maioria não há primário',
            codigo: py`m = carregar("cluster/eleicao.py")
nos = [
    {"nome": "db-1", "tipo": "primary", "ativo": False, "optime": 50},
    {"nome": "db-2", "tipo": "secondary", "ativo": True, "optime": 50},
]
r = m.eleger_primario(nos)
assert r is None, f"Só 1 de 2 nós está ativo: não é maioria, ninguém pode ser eleito (evita 'split-brain'). Veio {r!r}."
isolado = [
    {"nome": "db-1", "tipo": "primary", "ativo": True, "optime": 50},
    {"nome": "db-2", "tipo": "secondary", "ativo": False, "optime": 50},
    {"nome": "db-3", "tipo": "secondary", "ativo": False, "optime": 50},
]
r = m.eleger_primario(isolado)
assert r is None, f"Um primário isolado (1 de 3) precisa renunciar: sem maioria ele não pode aceitar escritas. Veio {r!r}."`,
          },
        ],
        dicas: [
          'Comece pela maioria: `ativos = [n for n in nos if n["ativo"]]` e `if len(ativos) <= len(nos) / 2: return None`.',
          'Depois procure o primário ativo: `for n in ativos: if n["tipo"] == "primary": return n["nome"]`.',
          'Por fim os candidatos: `candidatos = [n for n in ativos if n["tipo"] == "secondary"]`; se vazio devolva None; senão `return max(candidatos, key=lambda n: n["optime"])["nome"]`.',
        ],
      },
      {
        ordem: 4,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'E quando os dados não couberem mais?',
        mensagemIA:
          'O Replica Set resolve disponibilidade: todas as réplicas têm os mesmos dados. Mas a coleção de pedidos cresce 200 GB por mês e logo não caberá em um único servidor, por maior que ele seja. Qual estratégia resolve o volume?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Adicionar mais nós Secondary ao Replica Set.',
            correta: false,
            feedbackIA: 'Cada Secondary guarda uma cópia COMPLETA dos dados. Mais réplicas aumentam a disponibilidade e a capacidade de leitura, mas cada nó continua precisando armazenar tudo.',
          },
          {
            id: 'opt_b',
            texto: 'Sharding: particionamento horizontal, distribuindo os documentos entre vários servidores por uma shard key.',
            correta: true,
            feedbackIA:
              'Isso. **Sharding** divide os dados horizontalmente: cada shard guarda uma fatia (por exemplo, por região ou hash do cliente) e é, ele próprio, um Replica Set. Replicação = disponibilidade; sharding = escala de volume e de escrita. Em produção, os dois andam juntos.',
          },
          {
            id: 'opt_c',
            texto: 'Trocar o servidor por um maior a cada trimestre (escala vertical).',
            correta: false,
            feedbackIA: 'A escala vertical tem teto físico, custo que cresce de forma desproporcional e exige parada para a troca. Para crescimento contínuo, a saída é escalar horizontalmente.',
          },
        ],
      },
      entregaGit(5),
    ],
  },

  {
    _id: 'quest_sr_03_docker_kubernetes',
    codigo: 'Sr 03',
    titulo: 'Conteinerização com Docker & Kubernetes',
    nivelCarreira: 'SENIOR',
    ordemTrilha: 14,
    recompensaXP: 220,
    repoPronto: true,
    conceitos: ['VM vs contêiner', 'Dockerfile e camadas', 'Variáveis de ambiente', 'Docker Hub', 'Kubernetes: Deployment e réplicas'],
    email: {
      remetente: TECH_LEAD,
      assunto: '"Na minha máquina funciona" - de novo',
      corpo:
        'Perdemos dois dias porque o serviço de pedidos funcionava no notebook do estagiário e quebrava em homologação (versão diferente do Python).\n\nChega. Vamos padronizar o ambiente de execução com Docker e orquestrar os contêineres com Kubernetes.\n\nJá existe um Dockerfile no repositório, mas ele foi feito às pressas: a imagem tem mais de 1 GB, qualquer alteração de código reinstala todas as dependências e — pior — a senha do banco está escrita dentro dele. Arrume isso antes de publicar a imagem.\n\nMarcos',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'Dockerfile',
        linguagem: 'dockerfile',
        conteudo: `# FIXME: imagem pesada, cache de camadas ruim e senha embutida
FROM python:3.12

WORKDIR /app

COPY . .
RUN pip install -r requirements.txt

ENV DB_PASSWORD=nexus@2025

CMD ["python", "main.py"]
`,
      },
      { caminho: 'requirements.txt', linguagem: 'plaintext', conteudo: 'fastapi==0.120.0\nuvicorn==0.38.0\n' },
      {
        caminho: 'main.py',
        linguagem: 'python',
        conteudo: py`import os

# A senha vem do ambiente em tempo de execução, nunca do código ou da imagem.
DB_PASSWORD = os.environ.get("DB_PASSWORD")

print("Serviço de pedidos ouvindo na porta 8000")
`,
      },
      {
        caminho: 'k8s/deployment.yaml',
        linguagem: 'yaml',
        conteudo: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: pedidos
spec:
  # TODO: defina 3 réplicas
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
          # TODO: image: nexustech/pedidos:1.0
          # TODO: ports -> containerPort: 8000
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'VM ou contêiner?',
        mensagemIA:
          'Antes de mexer no Dockerfile: qual é a diferença fundamental entre a virtualização tradicional e a conteinerização?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Não há diferença prática: contêiner é só um nome moderno para máquina virtual.',
            correta: false,
            feedbackIA: 'São tecnologias diferentes, com custos muito diferentes: uma VM leva minutos para subir e ocupa gigabytes; um contêiner sobe em segundos e ocupa megabytes.',
          },
          {
            id: 'opt_b',
            texto: 'A VM virtualiza o hardware via Hypervisor e carrega um SO completo; o contêiner compartilha o kernel do host e empacota apenas a aplicação e suas dependências.',
            correta: true,
            feedbackIA:
              'Exato. Por compartilhar o kernel, o contêiner é leve e rápido — e a imagem carrega o ambiente inteiro (versão do Python, bibliotecas), acabando com o “na minha máquina funciona”. Na nossa stack são 4 camadas: Hardware → Comunicação → Aplicação/Orquestração (Kubernetes ou Docker Swarm) → Microsserviços.',
          },
          {
            id: 'opt_c',
            texto: 'O contêiner é mais pesado, porque cada um traz o seu próprio sistema operacional completo.',
            correta: false,
            feedbackIA: 'É o contrário: quem traz um SO completo é a VM. Contêineres compartilham o kernel do host, por isso são muito mais leves.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'REVISAO_CODIGO',
        titulo: 'Ache os 3 problemas do Dockerfile',
        autor: 'Dockerfile atual do serviço de pedidos',
        linguagem: 'dockerfile',
        mensagemIA:
          'O Marcos disse que o Dockerfile foi feito às pressas. Antes de eu te contar o que há de errado, quero ver o seu olho clínico: **marque as 3 linhas problemáticas** e clique em **Enviar revisão**.\n\nDica de ouro: abra a aba **Contêineres** (painel de baixo) para ver o tamanho e o cache de cada camada.',
        codigo: `FROM python:3.12

WORKDIR /app

COPY . .
RUN pip install -r requirements.txt

ENV DB_PASSWORD=nexus@2025

CMD ["python", "main.py"]`,
        problemas: [
          { linha: 1, explica: '`python:3.12` é a imagem completa, com mais de 1 GB de ferramentas que o serviço não usa. A variante `-slim` tem cerca de 130 MB.' },
          { linha: 5, explica: '`COPY . .` antes do `pip install`: qualquer alteração de código invalida o cache desta camada e de todas as seguintes, reinstalando as dependências a cada build.' },
          { linha: 8, explica: '`ENV DB_PASSWORD=...` grava a senha dentro da imagem. Quem fizer `docker pull` consegue ler com `docker history`.' },
        ],
        dicas: ['Pense em três eixos: tamanho da imagem, tempo de rebuild e segurança.', 'Cada instrução vira uma camada. Mudou uma camada, todas as seguintes são refeitas: a ordem importa.'],
      },
      {
        ordem: 3,
        tipo: 'VALIDACAO_ESTATICA',
        titulo: 'Corrigir o Dockerfile',
        mensagemIA:
          'Bom olho! Recapitulando os três problemas:\n\n**1. Imagem pesada** — `python:3.12` tem mais de 1 GB. Use a variante `python:3.12-slim`.\n\n**2. Cache de camadas** — cada instrução vira uma camada, e mudou uma, refaz todas as seguintes. Com `COPY . .` antes do `pip install`, qualquer alteração de código reinstala tudo. Copie primeiro só o `requirements.txt`, rode o `pip install` e só depois copie o resto.\n\n**3. Senha embutida** — `ENV DB_PASSWORD=...` grava a senha na imagem: quem fizer `docker pull` consegue ler. Remova: ela será injetada na execução com `docker run -e`.\n\nAproveite e documente a porta com `EXPOSE 8000`.',
        regras: [
          { nome: 'Imagem base leve (slim ou alpine)', arquivo: 'Dockerfile', padrao: '^FROM\\s+python:[\\w.]+-(slim|alpine)', flags: 'mi', dica: 'Troque a base para `FROM python:3.12-slim`.' },
          { nome: 'Define o diretório de trabalho', arquivo: 'Dockerfile', padrao: '^WORKDIR\\s+/\\w+', flags: 'mi', dica: 'Mantenha `WORKDIR /app`.' },
          { nome: 'Dependências antes do código (cache de camadas)', arquivo: 'Dockerfile', padrao: 'COPY\\s+requirements\\.txt\\s+\\S+[\\s\\S]*RUN\\s+pip\\s+install[\\s\\S]*COPY\\s+\\.\\s+\\.', flags: 'i', dica: 'Ordem ideal: `COPY requirements.txt .` → `RUN pip install -r requirements.txt` → `COPY . .`.' },
          { nome: 'Sem senha embutida na imagem', arquivo: 'Dockerfile', padrao: '(ENV|ARG)\\s+\\w*(PASSWORD|SENHA|SECRET|TOKEN)\\w*', flags: 'i', deveExistir: false, dica: 'Remova a linha `ENV DB_PASSWORD=...`. Segredos entram em tempo de execução: `docker run -e DB_PASSWORD=...`.' },
          { nome: 'Documenta a porta do serviço', arquivo: 'Dockerfile', padrao: '^EXPOSE\\s+8000', flags: 'mi', dica: 'Adicione `EXPOSE 8000`.' },
          { nome: 'Comando de inicialização', arquivo: 'Dockerfile', padrao: '^(CMD|ENTRYPOINT)\\s+\\[', flags: 'mi', dica: 'Mantenha o `CMD ["python", "main.py"]` no final.' },
        ],
        dicas: [
          'FROM python:3.12-slim\n\nWORKDIR /app\n\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\n\nCOPY . .\n\nEXPOSE 8000\nCMD ["python", "main.py"]',
        ],
      },
      {
        ordem: 4,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Construir, executar e publicar',
        mensagemIA:
          'Agora o ciclo de vida da imagem, no terminal:\n\n1. `docker build -t nexustech/pedidos:1.0 .` — constrói a imagem (repare nas camadas)\n2. `docker run -d -p 8000:8000 -e DB_PASSWORD=segredo --name pedidos nexustech/pedidos:1.0` — sobe o contêiner injetando a senha por variável de ambiente\n3. `docker push nexustech/pedidos:1.0` — publica no Docker Hub\n\nConfira com `docker ps` e `docker images`.',
        comandos: [
          { padrao: '^docker build .*-t nexustech/pedidos:1\\.0', descricao: 'docker build -t nexustech/pedidos:1.0 .' },
          { padrao: '^docker run .*-e DB_PASSWORD=\\S+.*nexustech/pedidos:1\\.0', descricao: 'docker run ... -e DB_PASSWORD=... nexustech/pedidos:1.0' },
          { padrao: '^docker push nexustech/pedidos:1\\.0', descricao: 'docker push nexustech/pedidos:1.0' },
        ],
        dicas: ['O ponto final do `docker build` é o contexto: a pasta atual, onde está o Dockerfile.', 'A flag `-e NOME=valor` define a variável de ambiente só naquele contêiner — a imagem publicada continua sem a senha.'],
      },
      {
        ordem: 5,
        tipo: 'VALIDACAO_ESTATICA',
        titulo: 'Deployment no Kubernetes',
        mensagemIA:
          'Um contêiner sozinho não dá alta disponibilidade. O orquestrador (Kubernetes) mantém o número desejado de réplicas no ar: se um pod morre, ele sobe outro.\n\nComplete `k8s/deployment.yaml`:\n\n• `replicas: 3` dentro de `spec`\n• no contêiner: `image: nexustech/pedidos:1.0`\n• `ports:` com `- containerPort: 8000`\n\nYAML é sensível à indentação (use espaços, nunca tab).',
        regras: [
          { nome: 'Recurso do tipo Deployment', arquivo: 'k8s/deployment.yaml', padrao: '^kind:\\s*Deployment', dica: 'Mantenha `kind: Deployment`.' },
          { nome: '3 réplicas', arquivo: 'k8s/deployment.yaml', padrao: '^  replicas:\\s*3\\s*$', dica: 'Adicione `replicas: 3` dentro de `spec` (2 espaços de indentação).' },
          { nome: 'Usa a imagem publicada', arquivo: 'k8s/deployment.yaml', padrao: '^\\s+image:\\s*nexustech/pedidos:1\\.0\\s*$', dica: 'No contêiner: `image: nexustech/pedidos:1.0`.' },
          { nome: 'Expõe a porta 8000', arquivo: 'k8s/deployment.yaml', padrao: 'ports:\\s*\\n\\s+-\\s*containerPort:\\s*8000', dica: 'Adicione:\nports:\n  - containerPort: 8000' },
        ],
        dicas: [
          'Trecho final do arquivo:\n      containers:\n        - name: pedidos\n          image: nexustech/pedidos:1.0\n          ports:\n            - containerPort: 8000',
        ],
      },
      {
        ordem: 6,
        tipo: 'COMANDO_TERMINAL',
        titulo: 'Aplicar no cluster e entregar',
        mensagemIA:
          'Aplique o manifesto e veja o orquestrador trabalhar:\n\n1. `kubectl apply -f k8s/deployment.yaml`\n2. `kubectl get pods`\n\nDepois abra a aba **Contêineres** e **derrube um pod** com um clique: o Kubernetes sobe outro sozinho para manter as 3 réplicas.\n\nPor fim, faça a entrega: `git add .`, `git commit -m "..."`, `git push`.',
        comandos: [
          { padrao: '^kubectl apply -f k8s/deployment\\.yaml', descricao: 'kubectl apply -f k8s/deployment.yaml' },
          { padrao: '^kubectl get pods?', descricao: 'kubectl get pods' },
          { padrao: '^git add ', descricao: 'git add .' },
          { padrao: '^git commit ', descricao: 'git commit -m "..."' },
          { padrao: '^git push', descricao: 'git push' },
        ],
        dicas: ['`kubectl apply` é declarativo: você descreve o estado desejado no YAML e o Kubernetes trabalha para mantê-lo.'],
      },
    ],
  },

  {
    _id: 'quest_sr_04_cloud_deploy',
    codigo: 'Sr 04',
    titulo: 'Arquitetura Cloud Computing & Deploy Final',
    nivelCarreira: 'SENIOR',
    ordemTrilha: 15,
    recompensaXP: 300,
    boss: true,
    repoPronto: true,
    conceitos: ['NIST SP 800-145', 'IaaS / PaaS / SaaS', 'Nuvem pública, privada e híbrida', 'Elasticidade e pay-as-you-go', 'IA Generativa'],
    email: {
      remetente: CTO,
      assunto: '[Boss Challenge] Black Friday em 30 dias - plano de nuvem e deploy global',
      corpo:
        'Chegou o grande desafio.\n\nNa Black Friday o tráfego da plataforma sai de 100 para mais de 5.000 requisições por segundo durante algumas horas. No ano passado compramos servidores para o pico e eles ficaram ociosos os outros 364 dias.\n\nQuero o plano de arquitetura de nuvem e o deploy global da plataforma, otimizando custo, segurança e elasticidade. Atenção: os dados financeiros dos clientes estão sujeitos à LGPD e à regulação bancária, e o jurídico exige que fiquem em infraestrutura sob nosso controle.\n\nEsta entrega fecha a sua trilha na NexusTech. Conto com você.\n\nHelena',
    },
    arquivosIniciaisIDE: [
      {
        caminho: 'infra/autoscaling.py',
        linguagem: 'python',
        conteudo: py`import math


def calcular_instancias(rps: float, capacidade_por_instancia: float, minimo: int, maximo: int) -> int:
    # TODO: quantas instâncias são necessárias para atender 'rps' requisições
    # por segundo? Arredonde para CIMA (math.ceil) e respeite os limites
    # [minimo, maximo] do grupo de auto scaling.
    pass


def custo_elastico(rps_por_hora: list, capacidade_por_instancia: float, minimo: int, maximo: int, preco_hora: float) -> float:
    # Pay-as-you-go: em cada hora pagamos apenas pelas instâncias em uso.
    # TODO: some (instâncias da hora * preco_hora) para cada hora. round(x, 2)
    pass


def custo_fixo(rps_por_hora: list, capacidade_por_instancia: float, preco_hora: float) -> float:
    # Modelo antigo: servidores dimensionados para o PICO, ligados o tempo todo.
    # TODO: instâncias para o maior rps * número de horas * preco_hora. round(x, 2)
    pass
`,
      },
    ],
    etapas: [
      {
        ordem: 1,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'A característica essencial',
        mensagemIA:
          'O NIST (SP 800-145) define 5 características essenciais da computação em nuvem: autoatendimento sob demanda, amplo acesso à rede, agrupamento de recursos (*multi-tenancy*), elasticidade rápida e serviço mensurável (*pay-as-you-go*).\n\nQual delas resolve diretamente o pico de 50x da Black Friday?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Amplo acesso à rede',
            correta: false,
            feedbackIA: 'Amplo acesso significa que os serviços estão disponíveis pela rede para qualquer dispositivo. Importante, mas não trata a variação de carga.',
          },
          {
            id: 'opt_b',
            texto: 'Elasticidade rápida',
            correta: true,
            feedbackIA:
              'Isso: recursos provisionados e liberados automaticamente, acompanhando a demanda. Combinada com o **serviço mensurável**, você paga pelas 50 máquinas só durante as horas do pico, e não nos outros 364 dias.',
          },
          {
            id: 'opt_c',
            texto: 'Agrupamento de recursos (multi-tenancy)',
            correta: false,
            feedbackIA: 'Multi-tenancy é o provedor compartilhar a infraestrutura física entre vários clientes — é o que barateia a nuvem, mas quem absorve o pico é a elasticidade.',
          },
        ],
      },
      {
        ordem: 2,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Modelo de serviço',
        mensagemIA:
          'Cenário de orçamento: o time tem 6 desenvolvedores e nenhum especialista em infraestrutura. A Helena quer que vocês foquem apenas na aplicação e nas configurações, sem administrar sistema operacional, patches e servidores de banco. Qual modelo de serviço contratar para os microsserviços?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'IaaS — máquinas virtuais; nós gerenciamos SO, banco e aplicação.',
            correta: false,
            feedbackIA: 'IaaS dá controle máximo, mas alguém teria que administrar SO, patches de segurança, banco e rede. Sem equipe de infraestrutura, esse custo operacional cairia sobre os 6 devs.',
          },
          {
            id: 'opt_b',
            texto: 'PaaS — a plataforma gerencia SO, runtime e escala; nós cuidamos da aplicação e das configurações.',
            correta: true,
            feedbackIA:
              'Decisão coerente com o time: no **PaaS** o provedor cuida de SO, runtime e escalabilidade. Resumo: **IaaS** = você gerencia SO, banco e app; **PaaS** = só aplicação e configurações; **SaaS** = software pronto, usado via navegador (*thin-client*), como o e-mail corporativo.',
          },
          {
            id: 'opt_c',
            texto: 'SaaS — contratar um software pronto de e-commerce.',
            correta: false,
            feedbackIA: 'SaaS é consumir um software pronto. Nossa plataforma é um produto próprio, com regras de negócio que são o diferencial do cliente: precisamos de onde executar o NOSSO código.',
          },
        ],
      },
      {
        ordem: 3,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'Modelo de implantação',
        mensagemIA:
          'Cenário de conformidade: os dados financeiros (LGPD + regulação bancária) precisam ficar em infraestrutura sob controle da empresa, mas a vitrine e o checkout precisam da elasticidade para a Black Friday. Qual modelo de implantação atende aos dois requisitos?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'Nuvem pública para tudo (AWS, Azure, Google Cloud).',
            correta: false,
            feedbackIA: 'Resolve a elasticidade, mas contraria a exigência do jurídico de manter os dados financeiros em infraestrutura sob nosso controle.',
          },
          {
            id: 'opt_b',
            texto: 'Nuvem privada para tudo, no nosso data center.',
            correta: false,
            feedbackIA: 'Atende à conformidade, mas voltamos ao problema do ano passado: comprar capacidade para o pico e deixá-la ociosa o resto do ano.',
          },
          {
            id: 'opt_c',
            texto: 'Nuvem híbrida: dados regulados na nuvem privada; vitrine e checkout elásticos na nuvem pública.',
            correta: true,
            feedbackIA:
              'Arquitetura aprovada. A **nuvem híbrida** combina as duas: o dado regulado fica sob nosso controle e a carga variável aproveita a elasticidade pública. Outros modelos: **comunitária** (compartilhada por organizações com requisitos comuns) e **multicloud** (mais de um provedor público, reduzindo dependência de fornecedor).',
          },
        ],
      },
      {
        ordem: 4,
        tipo: 'IMPLEMENTACAO_CODIGO',
        titulo: 'Dimensionar o auto scaling',
        arquivo: 'infra/autoscaling.py',
        mensagemIA:
          'Decisões tomadas; agora os números para a diretoria. Em `infra/autoscaling.py`, implemente:\n\n• `calcular_instancias(rps, capacidade_por_instancia, minimo, maximo)` — instâncias necessárias (arredondando para cima), dentro dos limites do grupo.\n• `custo_elastico(...)` — custo no modelo *pay-as-you-go*, hora a hora.\n• `custo_fixo(...)` — custo do modelo antigo, dimensionado para o pico.\n\nO mínimo de 2 instâncias garante alta disponibilidade mesmo de madrugada.',
        funcaoAlvo: 'calcular_instancias',
        casosDeTeste: [
          { input: [0, 100, 2, 20], outputEsperado: 2 },
          { input: [950, 100, 2, 20], outputEsperado: 10 },
          { input: [1000, 100, 2, 20], outputEsperado: 10 },
          { input: [1001, 100, 2, 20], outputEsperado: 11 },
          { input: [5000, 100, 2, 20], outputEsperado: 20 },
        ],
        testes: [
          {
            nome: 'custo_elastico cobra só o que foi usado em cada hora',
            codigo: py`m = carregar("infra/autoscaling.py")
r = m.custo_elastico([100, 950, 5000], 100, 2, 60, 0.5)
assert r == 31.0, f"Horas com 2, 10 e 50 instâncias a R$ 0,50/h = 31.0. Veio {r!r}."
assert m.custo_elastico([], 100, 2, 60, 0.5) == 0, "Sem horas, o custo é 0."`,
          },
          {
            nome: 'custo_fixo paga o pico o tempo todo',
            codigo: py`m = carregar("infra/autoscaling.py")
r = m.custo_fixo([100, 950, 5000], 100, 0.5)
assert r == 75.0, f"50 instâncias (pico) x 3 horas x R$ 0,50 = 75.0. Veio {r!r}."`,
          },
          {
            nome: 'A elasticidade é mais barata em um dia de Black Friday',
            codigo: py`m = carregar("infra/autoscaling.py")
dia = [100] * 18 + [2500, 5000, 5000, 5000, 2500, 800]
elastico = m.custo_elastico(dia, 100, 2, 60, 0.5)
fixo = m.custo_fixo(dia, 100, 0.5)
assert elastico == 122.0, f"Custo elástico do dia deveria ser 122.0, veio {elastico!r}."
assert fixo == 600.0, f"Custo fixo do dia deveria ser 600.0, veio {fixo!r}."`,
          },
        ],
        dicas: [
          'calcular_instancias: `necessarias = math.ceil(rps / capacidade_por_instancia)` e depois limite com `max(minimo, min(maximo, necessarias))`.',
          'custo_elastico: `total = sum(calcular_instancias(rps, capacidade_por_instancia, minimo, maximo) * preco_hora for rps in rps_por_hora)` e `return round(total, 2)`.',
          'custo_fixo: `pico = math.ceil(max(rps_por_hora) / capacidade_por_instancia)` e `return round(pico * len(rps_por_hora) * preco_hora, 2)`.',
        ],
      },
      {
        ordem: 5,
        tipo: 'SIMULACAO',
        simulador: 'blackfriday',
        titulo: 'Black Friday ao vivo',
        mensagemIA:
          'Os cálculos estão prontos; agora é para valer. Na **Sala de Guerra** você vai operar as 24 horas da Black Friday.\n\nDefina a estratégia de capacidade e rode o dia. Metas da Helena: **disponibilidade de 99,9%** e custo dentro do **orçamento de R$ 600**. Atenção: de madrugada, uma instância vai falhar.',
        dicas: [
          'Servidores fixos têm um dilema: poucos não aguentam o pico; muitos ficam ociosos (e caros) por 18 horas.',
          'No modo elástico, o máximo precisa cobrir o pico: 5.000 req/s ÷ 100 req/s por instância.',
          'O mínimo protege contra a falha da madrugada: com 1 instância só, quando ela cai não sobra ninguém. Mas mínimo alto demais estoura o orçamento.',
        ],
      },
      {
        ordem: 6,
        tipo: 'DECISAO_ARQUITETURAL',
        titulo: 'IA Generativa no atendimento',
        mensagemIA:
          'Último item do plano: a Helena quer um chatbot de atendimento para a Black Friday. A história é longa — do Teste de Turing (1950) e do ELIZA (1966), que respondia por regras e casamento de padrões, passando pelo Deep Blue (xadrez, 1997) e pelo Watson (2011), até os LLMs atuais.\n\nO que diferencia um chatbot baseado em LLM de um baseado em regras como o ELIZA?',
        opcoes: [
          {
            id: 'opt_a',
            texto: 'O LLM gera respostas novas a partir de padrões aprendidos em grandes volumes de texto, lidando com perguntas que ninguém previu; o de regras só reconhece os padrões que foram programados.',
            correta: true,
            feedbackIA:
              'Exato — e é como eu funciono! Mas um(a) Sênior também conhece os limites: LLMs podem gerar respostas incorretas com muita confiança. Para o atendimento, conecte o modelo às fontes oficiais (pedidos, políticas de troca), restrinja o escopo e mantenha um caminho para atendimento humano.',
          },
          {
            id: 'opt_b',
            texto: 'O LLM consulta um banco de respostas prontas, muito maior que o do ELIZA.',
            correta: false,
            feedbackIA: 'Um LLM não busca respostas prontas: ele gera texto novo, palavra por palavra, a partir de padrões estatísticos aprendidos no treinamento.',
          },
          {
            id: 'opt_c',
            texto: 'O LLM nunca erra, pois foi treinado com todo o conhecimento disponível.',
            correta: false,
            feedbackIA: 'Cuidado com essa premissa em produção: LLMs podem “alucinar” respostas plausíveis e erradas. Por isso validamos, limitamos o escopo e mantemos supervisão humana.',
          },
        ],
      },
      entregaGit(7, 'Este é o deploy global da plataforma. '),
    ],
  },
];
