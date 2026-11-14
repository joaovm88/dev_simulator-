// Modelo didático das camadas de uma imagem Docker: tamanho, tempo de build e
// o que é reaproveitado do cache quando só o código-fonte muda.

export interface Camada {
  instrucao: string;
  tamanhoMB: number;
  segundos: number;
  /** No rebuild após alterar apenas o código da aplicação. */
  cache: boolean;
  alerta?: string;
}

export interface AnaliseDocker {
  camadas: Camada[];
  tamanhoMB: number;
  buildSegundos: number;
  rebuildSegundos: number;
  alertas: string[];
}

const BASES: [RegExp, number][] = [
  [/-alpine/, 55],
  [/-slim/, 130],
  [/^python:/, 1020],
  [/^node:/, 1100],
  [/^ubuntu/, 78],
  [/^(eclipse-temurin|openjdk)/, 470],
];

export function analisarDockerfile(texto: string): AnaliseDocker {
  const linhas = texto.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const camadas: Camada[] = [];
  let invalidado = false;
  for (const linha of linhas) {
    const [instrucao, ...resto] = linha.split(/\s+/);
    const args = resto.join(' ');
    const c: Camada = { instrucao: linha, tamanhoMB: 0, segundos: 0.1, cache: true };
    switch (instrucao.toUpperCase()) {
      case 'FROM':
        c.tamanhoMB = BASES.find(([re]) => re.test(args))?.[1] ?? 200;
        c.segundos = Math.round(c.tamanhoMB / 25);
        if (/:latest$|^[^:]+$/.test(args)) c.alerta = 'Sem tag de versão fixa: o build de amanhã pode usar outra imagem.';
        else if (c.tamanhoMB > 500) c.alerta = 'Imagem base completa: use a variante -slim.';
        break;
      case 'COPY':
      case 'ADD':
        // Copiar o código-fonte invalida o cache desta camada em diante.
        if (!/^(requirements\.txt|package(-lock)?\.json|pom\.xml)\s/.test(args)) invalidado = true;
        c.tamanhoMB = /^requirements|^package|^pom/.test(args) ? 0.01 : 2;
        c.segundos = 0.5;
        break;
      case 'RUN':
        if (/pip install|npm (ci|install)|mvn /.test(args)) {
          c.tamanhoMB = 85;
          c.segundos = 42;
          if (invalidado) c.alerta = 'Dependências reinstaladas a cada alteração de código: copie o requirements.txt antes.';
        } else {
          c.tamanhoMB = 5;
          c.segundos = 4;
        }
        break;
      case 'ENV':
      case 'ARG':
        if (/(PASSWORD|SENHA|SECRET|TOKEN|KEY)/i.test(args)) c.alerta = 'Segredo gravado na imagem: qualquer um com docker pull consegue ler.';
        break;
    }
    c.cache = !invalidado;
    camadas.push(c);
  }
  const soma = (f: (c: Camada) => number) => Math.round(camadas.reduce((t, c) => t + f(c), 0) * 10) / 10;
  return {
    camadas,
    tamanhoMB: soma((c) => c.tamanhoMB),
    buildSegundos: soma((c) => c.segundos),
    rebuildSegundos: soma((c) => (c.cache ? 0 : c.segundos)),
    alertas: camadas.flatMap((c) => (c.alerta ? [c.alerta] : [])),
  };
}
