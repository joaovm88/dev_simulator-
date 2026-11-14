// Soluções de referência usadas pelos testes para garantir que toda missão é
// solucionável e que o código inicial NÃO passa nas validações.
const r = String.raw;

export interface Solucao {
  /** ordem da etapa -> arquivos gravados antes de validar */
  arquivos?: Record<number, Record<string, string>>;
  /** ordem da etapa -> comandos executados no terminal */
  comandos?: Record<number, string[]>;
}

const GIT = ['git add .', 'git commit -m "feat: entrega"', 'git push'];
const MODEL = 'src/br/com/nexustech/model/';

export const SOLUCOES: Record<string, Solucao> = {
  quest_jr_01_bitmed_triagem: {
    comandos: { 2: ['python --version'] },
    arquivos: {
      5: {
        'src/triagem.py': r`def classificar_paciente(idade: int, suspeita_infecto: bool) -> str:
    sala = "Sala Amarela" if suspeita_infecto else "Sala Branca"
    fila = "Prioridade" if idade >= 65 else "Comum"
    return f"{sala} - {fila}"
`,
      },
      6: {
        'src/fila.py': r`def contar_prioritarios(idades: list) -> int:
    total = 0
    for idade in idades:
        if idade >= 65:
            total += 1
    return total
`,
      },
    },
  },

  quest_jr_02_inventario_acesso: {
    arquivos: {
      3: {
        'src/Funcoes.py': r`def calcular_depreciacao(valor: float, anos: int, taxa: float) -> float:
    return round(valor * (1 - taxa) ** anos, 2)


def resumo_valores(valores: list) -> tuple:
    return max(valores), min(valores), sum(valores)
`,
      },
      4: {
        'src/inventario.py': r`from Funcoes import *


def cadastrar_login(usuarios: dict, login: str, nome: str) -> bool:
    if login in usuarios:
        return False
    usuarios[login] = nome
    return True


def valor_total_depreciado(ativos: list, anos: int, taxa: float) -> float:
    total = 0
    for ativo in ativos:
        total += calcular_depreciacao(ativo["valor"], anos, taxa)
    return round(total, 2)
`,
      },
    },
  },

  quest_jr_03_relatorios_json: {
    arquivos: {
      2: {
        'src/relatorios.py': r`def registrar_log(caminho: str, mensagem: str) -> None:
    with open(caminho, "a", encoding="utf-8") as f:
        f.write(mensagem + "\n")


def exportar_csv(ativos: list, caminho: str) -> None:
    with open(caminho, "w", encoding="utf-8") as f:
        f.write("nome;valor\n")
        for ativo in ativos:
            f.write(f"{ativo['nome']};{ativo['valor']}\n")


def parse_linha(linha: str) -> dict:
    partes = linha.strip().split(";")
    return {"nome": partes[0], "valor": float(partes[1])}
`,
      },
      4: {
        'src/persistencia.py': r`import json
import os


def salvar_json(ativos: list, caminho: str) -> None:
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(ativos, f)


def carregar_json(caminho: str) -> list:
    if not os.path.exists(caminho):
        return []
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)
`,
      },
    },
  },

  quest_jr_04_wazeyes: {
    comandos: { 2: ['pip install geopy'] },
    arquivos: {
      3: {
        'src/wazeyes.py': r`import json

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderQuotaExceeded


def geocodificar(endereco: str):
    geolocalizador = Nominatim(user_agent="wazeyes-nexustech")
    try:
        local = geolocalizador.geocode(endereco)
    except GeocoderQuotaExceeded:
        return {"erro": "OVER_QUERY_LIMIT"}
    if local is None:
        return None
    return {"latitude": local.latitude, "longitude": local.longitude}


def processar(arquivo_entrada: str, arquivo_saida: str) -> None:
    with open(arquivo_entrada, encoding="utf-8") as f:
        endereco = json.load(f)["endereco"]
    saida = {"endereco": endereco}
    saida.update(geocodificar(endereco) or {})
    with open(arquivo_saida, "w", encoding="utf-8") as f:
        json.dump(saida, f)


if __name__ == "__main__":
    processar("entrada.json", "saida.json")
    print("saida.json gerado!")
`,
      },
      4: {
        'src/sistema.py': r`import os
import platform


def info_sistema() -> dict:
    return {"sistema": platform.system(), "python": platform.python_version(), "diretorio": os.getcwd()}
`,
      },
    },
  },

  quest_jr_05_git_rede: {
    arquivos: {
      2: {
        'src/monitor.py': r`import socket


def verificar_porta(host: str, porta: int, timeout: float = 1.0) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    resultado = s.connect_ex((host, porta))
    s.close()
    return resultado == 0


def escanear(host: str, portas: list) -> list:
    return [p for p in portas if verificar_porta(host, p)]


def resolver_dns(nome: str):
    try:
        return socket.gethostbyname(nome)
    except socket.gaierror:
        return None
`,
      },
    },
    comandos: {
      3: ['echo ".env" > .gitignore', 'git init', 'git add .', 'git commit -m "feat: monitor de rede"'],
      4: ['git remote add origin https://github.com/nexustech/monitor-rede.git', 'git push -u origin main'],
    },
  },

  quest_pl_01_oo_encapsulamento: {
    arquivos: {
      3: {
        [MODEL + 'ContaBancaria.java']: `package br.com.nexustech.model;

public class ContaBancaria {

    private String titular;
    private double saldo;

    public ContaBancaria() {
    }

    public ContaBancaria(String titular, double saldoInicial) {
        this.titular = titular;
        this.saldo = saldoInicial;
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

    public void depositar(double valor) {
        if (valor > 0) {
            saldo += valor;
        }
    }

    public boolean sacar(double valor) {
        if (valor <= 0 || valor > saldo) {
            return false;
        }
        saldo -= valor;
        return true;
    }
}
`,
      },
    },
    comandos: { 4: GIT },
  },

  quest_pl_02_heranca_polimorfismo: {
    arquivos: {
      2: {
        [MODEL + 'Produto.java']: `package br.com.nexustech.model;

public abstract class Produto {

    protected String nome;
    protected double preco;

    public Produto(String nome, double preco) {
        this.nome = nome;
        this.preco = preco;
    }

    public abstract String getFormaEntrega();
}
`,
        [MODEL + 'Guitarra.java']: `package br.com.nexustech.model;

public class Guitarra extends Produto {

    public Guitarra(String nome, double preco) {
        super(nome, preco);
    }

    @Override
    public String getFormaEntrega() {
        return "Correios - caixa reforçada";
    }
}
`,
        [MODEL + 'Bateria.java']: `package br.com.nexustech.model;

public class Bateria extends Produto {

    public Bateria(String nome, double preco) {
        super(nome, preco);
    }

    @Override
    public String getFormaEntrega() {
        return "Transportadora - volume grande";
    }
}
`,
      },
      4: {
        'src/algoritmos.py': r`def bubble_sort(lista: list) -> list:
    nova = lista[:]
    for i in range(len(nova)):
        for j in range(len(nova) - 1 - i):
            if nova[j] > nova[j + 1]:
                nova[j], nova[j + 1] = nova[j + 1], nova[j]
    return nova


def busca_binaria(lista: list, alvo) -> int:
    inicio, fim = 0, len(lista) - 1
    while inicio <= fim:
        meio = (inicio + fim) // 2
        if lista[meio] == alvo:
            return meio
        if lista[meio] < alvo:
            inicio = meio + 1
        else:
            fim = meio - 1
    return -1
`,
      },
    },
    comandos: { 6: GIT },
  },

  quest_pl_03_modelagem_ddl: {
    arquivos: {
      3: {
        'sql/sip_ddl.sql': `-- DDL do SIP
CREATE TABLE departamento (
  id_departamento NUMBER(6),
  nome VARCHAR2(60) NOT NULL,
  CONSTRAINT pk_departamento PRIMARY KEY (id_departamento),
  CONSTRAINT un_departamento_nome UNIQUE (nome)
);

CREATE TABLE funcionario (
  id_funcionario NUMBER(6),
  nome VARCHAR2(80) NOT NULL,
  salario NUMBER(10,2),
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
`,
      },
    },
    comandos: { 4: GIT },
  },

  quest_pl_04_dml_joins: {
    arquivos: {
      1: {
        'sql/01_carga.sql': `INSERT INTO departamento (id_departamento, nome) VALUES (1, 'TI');
INSERT INTO departamento (id_departamento, nome) VALUES (2, 'RH');
INSERT INTO departamento (id_departamento, nome) VALUES (3, 'Marketing');

INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (1, 'Ana', 8500, 1);
INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (2, 'Bruno', 4200, 1);
INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (3, 'Carla', 6100, 2);
INSERT INTO funcionario (id_funcionario, nome, salario, id_departamento) VALUES (4, 'Diego', 3900, NULL);

UPDATE funcionario SET salario = salario * 1.10 WHERE id_departamento = 1;
`,
      },
      4: {
        'sql/02_relatorio_join.sql': `SELECT f.nome, d.nome
FROM funcionario f
INNER JOIN departamento d ON f.id_departamento = d.id_departamento
ORDER BY f.salario DESC;
`,
      },
      5: {
        'sql/03_departamentos_orfaos.sql': `SELECT d.nome
FROM departamento d
LEFT JOIN funcionario f ON f.id_departamento = d.id_departamento
WHERE f.id_funcionario IS NULL;
`,
      },
    },
    comandos: { 6: GIT },
  },

  quest_pl_05_mongodb: {
    arquivos: {
      3: {
        'mongo/catalogo.mongodb.js': `use loja

db.createCollection("produtos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "categoria", "preco"],
      properties: {
        preco: { bsonType: "number", minimum: 0 }
      }
    }
  }
})

db.produtos.insertMany([
  { nome: "Guitarra Stratocaster", categoria: "instrumento", preco: 4500, atributos: { cordas: 6 } },
  { nome: "Bateria Acústica", categoria: "instrumento", preco: 7200, atributos: { pecas: 5 } },
  { nome: "Curso de Violão", categoria: "curso", preco: 199.9, atributos: { horas: 40 } }
])

db.clientes.insertOne({
  nome: "Lia Prado",
  enderecos: [
    { rua: "Rua Augusta, 500", cidade: "São Paulo" },
    { rua: "Av. Beira Mar, 10", cidade: "Santos" }
  ]
})
`,
      },
    },
    comandos: { 4: GIT },
  },

  quest_pl_06_fullstack_fintech: {
    comandos: {
      2: ['npm init -y', 'npm install -D typescript', 'npx tsc --init'],
      7: ['npx tsc', ...GIT],
    },
    arquivos: {
      4: {
        'src/api/contrato.ts': `export interface ContaDTO {
  id: number;
  titular: string;
  saldo: number;
  ativa: boolean;
}

export async function buscarConta(id: number): Promise<ContaDTO> {
  const resposta = await fetch("/api/contas/" + id);
  return (await resposta.json()) as ContaDTO;
}
`,
      },
      5: {
        'src/components/ContaCard.tsx': `import { useState } from "react";
import type { ContaDTO } from "../api/contrato";

export function ContaCard({ conta }: { conta: ContaDTO }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="font-bold">{conta.titular}</h2>
      <p>{visivel ? conta.saldo : "••••"}</p>
      <button onClick={() => setVisivel(!visivel)}>Mostrar/ocultar</button>
    </div>
  );
}
`,
      },
    },
  },

  quest_sr_01_microsservicos: {
    arquivos: {
      4: {
        'gateway/balanceador.py': r`class BalanceadorRoundRobin:
    def __init__(self):
        self.instancias = []
        self.indice = 0

    def registrar(self, porta: int) -> None:
        if porta not in self.instancias:
            self.instancias.append(porta)

    def remover(self, porta: int) -> None:
        if porta in self.instancias:
            self.instancias.remove(porta)

    def proxima(self) -> int:
        if not self.instancias:
            raise RuntimeError("Nenhuma instância disponível")
        porta = self.instancias[self.indice % len(self.instancias)]
        self.indice += 1
        return porta
`,
      },
      5: {
        'servicos/entregas.py': r`FLUXO = ["EM_SEPARACAO", "EM_TRANSPORTE", "ENTREGUE"]


def avancar_status(status_atual: str) -> str:
    i = FLUXO.index(status_atual)
    if i == len(FLUXO) - 1:
        raise ValueError("Pedido já entregue")
    return FLUXO[i + 1]
`,
      },
    },
    comandos: { 6: GIT },
  },

  quest_sr_02_replica_sets: {
    arquivos: {
      3: {
        'cluster/eleicao.py': r`def eleger_primario(nos: list):
    ativos = [n for n in nos if n["ativo"]]
    if len(ativos) <= len(nos) / 2:
        return None
    for n in ativos:
        if n["tipo"] == "primary":
            return n["nome"]
    candidatos = [n for n in ativos if n["tipo"] == "secondary"]
    if not candidatos:
        return None
    return max(candidatos, key=lambda n: n["optime"])["nome"]
`,
      },
    },
    comandos: { 5: GIT },
  },

  quest_sr_03_docker_kubernetes: {
    arquivos: {
      3: {
        Dockerfile: `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "main.py"]
`,
      },
      5: {
        'k8s/deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: pedidos
spec:
  replicas: 3
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
          image: nexustech/pedidos:1.0
          ports:
            - containerPort: 8000
`,
      },
    },
    comandos: {
      4: [
        'docker build -t nexustech/pedidos:1.0 .',
        'docker run -d -p 8000:8000 -e DB_PASSWORD=segredo --name pedidos nexustech/pedidos:1.0',
        'docker push nexustech/pedidos:1.0',
      ],
      6: ['kubectl apply -f k8s/deployment.yaml', 'kubectl get pods', ...GIT],
    },
  },

  quest_sr_04_cloud_deploy: {
    arquivos: {
      4: {
        'infra/autoscaling.py': r`import math


def calcular_instancias(rps: float, capacidade_por_instancia: float, minimo: int, maximo: int) -> int:
    necessarias = math.ceil(rps / capacidade_por_instancia)
    return max(minimo, min(maximo, necessarias))


def custo_elastico(rps_por_hora: list, capacidade_por_instancia: float, minimo: int, maximo: int, preco_hora: float) -> float:
    total = sum(calcular_instancias(rps, capacidade_por_instancia, minimo, maximo) * preco_hora for rps in rps_por_hora)
    return round(total, 2)


def custo_fixo(rps_por_hora: list, capacidade_por_instancia: float, preco_hora: float) -> float:
    pico = math.ceil(max(rps_por_hora) / capacidade_por_instancia)
    return round(pico * len(rps_por_hora) * preco_hora, 2)
`,
      },
    },
    comandos: { 7: GIT },
  },
};
