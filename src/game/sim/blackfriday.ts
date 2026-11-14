// Simulador da Black Friday (missão Sr 04): 24 horas de tráfego, custo
// pay-as-you-go e disponibilidade. Lógica pura e determinística.

export interface ConfigBlackFriday {
  modo: 'fixo' | 'elastico';
  /** Modo fixo: servidores ligados o dia inteiro. */
  fixas: number;
  /** Modo elástico: limites do grupo de auto scaling. */
  minimo: number;
  maximo: number;
}

/** Requisições por segundo em cada hora do dia (pico entre 19h e 21h). */
export const TRAFEGO = [...Array(18).fill(100), 2500, 5000, 5000, 5000, 2500, 800] as number[];
export const CAPACIDADE = 100;
export const PRECO_HORA = 2;
export const ORCAMENTO = 600;
export const META = 99.9;
/** Às 04h uma instância falha e leva a hora inteira para ser substituída. */
export const HORA_DA_FALHA = 4;

export interface HoraBlackFriday {
  hora: number;
  rps: number;
  instancias: number;
  capacidade: number;
  atendidas: number;
  perdidas: number;
  custoAcumulado: number;
  falha: boolean;
}

export interface ResultadoBlackFriday {
  horas: HoraBlackFriday[];
  custo: number;
  disponibilidade: number;
  aprovado: boolean;
  diagnostico: string;
}

export function simularBlackFriday(cfg: ConfigBlackFriday): ResultadoBlackFriday {
  const horas: HoraBlackFriday[] = [];
  let custo = 0;
  let total = 0;
  let perdidasTotal = 0;
  let caiuNaFalha = false;
  let caiuNoPico = false;
  TRAFEGO.forEach((rps, hora) => {
    const necessarias = Math.ceil(rps / CAPACIDADE);
    const instancias = cfg.modo === 'fixo' ? cfg.fixas : Math.max(cfg.minimo, Math.min(cfg.maximo, necessarias));
    const falha = hora === HORA_DA_FALHA;
    const capacidade = Math.max(0, instancias - (falha ? 1 : 0)) * CAPACIDADE;
    const atendidas = Math.min(rps, capacidade);
    const perdidas = rps - atendidas;
    custo += instancias * PRECO_HORA;
    total += rps;
    perdidasTotal += perdidas;
    if (perdidas > 0 && falha) caiuNaFalha = true;
    if (perdidas > 0 && !falha) caiuNoPico = true;
    horas.push({ hora, rps, instancias, capacidade, atendidas, perdidas, custoAcumulado: custo, falha });
  });
  const disponibilidade = Math.floor(((total - perdidasTotal) / total) * 10000) / 100;
  const noOrcamento = custo <= ORCAMENTO;
  const aprovado = noOrcamento && disponibilidade >= META;
  let diagnostico: string;
  if (aprovado) {
    diagnostico = 'Plano aprovado: a elasticidade acompanhou o pico, o mínimo de instâncias absorveu a falha das 04h e você pagou só pelo que usou.';
  } else if (caiuNoPico) {
    diagnostico =
      cfg.modo === 'fixo'
        ? 'Os servidores fixos não deram conta do pico das 19h às 21h (5.000 req/s exigem 50 instâncias). E dimensionar o fixo para o pico estoura o orçamento. Este é o caso de uso da elasticidade.'
        : 'O teto do auto scaling ficou abaixo do pico: 5.000 req/s exigem 50 instâncias. Aumente o máximo.';
  } else if (caiuNaFalha) {
    diagnostico = 'Às 04h uma instância falhou e não havia outra para assumir: ponto único de falha. Mantenha pelo menos 2 instâncias no mínimo, mesmo de madrugada.';
  } else {
    diagnostico =
      cfg.modo === 'fixo'
        ? 'Nenhuma requisição perdida, mas você pagou pela capacidade do pico durante as 24 horas — exatamente o desperdício do ano passado. No modelo elástico (pay-as-you-go) a madrugada custa quase nada.'
        : 'Nenhuma requisição perdida, mas o orçamento estourou: o mínimo está alto demais e você paga por instâncias ociosas durante 18 horas. Reduza o mínimo (sem ir abaixo de 2).';
  }
  return { horas, custo, disponibilidade, aprovado, diagnostico };
}
