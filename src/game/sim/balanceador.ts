// Simulador do teste de carga do API Gateway (missão Sr 01). Lógica pura e
// determinística: a interface apenas anima os "ticks" devolvidos aqui.

export interface ConfigBalanceador {
  roteamento: 'fixo' | 'roundrobin';
  /** Service Discovery: instâncias sem heartbeat saem do registro. */
  heartbeat: boolean;
  /** Em caso de falha, o gateway tenta de novo em outra instância. */
  retry: boolean;
}

export const INSTANCIAS = [58817, 58370, 58892];
export const TICKS = 30;
export const TICK_DA_QUEDA = 10;
export const REQS_POR_TICK = 12;
/** O registro leva este número de ticks para notar a falta de heartbeat. */
export const ATRASO_DETECCAO = 3;
export const META_DISPONIBILIDADE = 99;
/** Cada retry dobra a latência daquela requisição: no máximo 5% podem precisar dele. */
export const META_RETENTADAS = 5;

export interface TickBalanceador {
  tick: number;
  viva: Record<number, boolean>;
  registrada: Record<number, boolean>;
  /** Para cada requisição do tick: porta de destino final e se deu certo. */
  reqs: { porta: number; ok: boolean; retentada: boolean }[];
}

export interface ResultadoBalanceador {
  ticks: TickBalanceador[];
  total: number;
  falhas: number;
  disponibilidade: number;
  /** Percentual de requisições que só deram certo na segunda tentativa (lentas). */
  retentadas: number;
  aprovado: boolean;
  diagnostico: string;
}

export function simularBalanceador(cfg: ConfigBalanceador): ResultadoBalanceador {
  const ticks: TickBalanceador[] = [];
  let rr = 0;
  let falhas = 0;
  let comRetry = 0;
  for (let t = 0; t < TICKS; t++) {
    const viva = Object.fromEntries(INSTANCIAS.map((p) => [p, !(p === 58817 && t >= TICK_DA_QUEDA)]));
    const detectou = cfg.heartbeat && t >= TICK_DA_QUEDA + ATRASO_DETECCAO;
    const registrada = Object.fromEntries(INSTANCIAS.map((p) => [p, !(p === 58817 && detectou)]));
    const destinos = INSTANCIAS.filter((p) => registrada[p]);
    const reqs: TickBalanceador['reqs'] = [];
    for (let i = 0; i < REQS_POR_TICK; i++) {
      let porta = cfg.roteamento === 'fixo' ? 58817 : destinos[rr++ % destinos.length];
      let ok = viva[porta];
      let retentada = false;
      if (!ok && cfg.retry && cfg.roteamento === 'roundrobin') {
        porta = destinos.filter((p) => viva[p])[rr++ % 2] ?? porta;
        ok = viva[porta];
        retentada = true;
        comRetry++;
      }
      if (!ok) falhas++;
      reqs.push({ porta, ok, retentada });
    }
    ticks.push({ tick: t, viva, registrada, reqs });
  }
  const total = TICKS * REQS_POR_TICK;
  const disponibilidade = Math.round(((total - falhas) / total) * 1000) / 10;
  const retentadas = Math.round((comRetry / total) * 1000) / 10;
  const aprovado = disponibilidade >= META_DISPONIBILIDADE && retentadas <= META_RETENTADAS;
  let diagnostico: string;
  if (cfg.roteamento === 'fixo') {
    diagnostico = 'Com endereço fixo, todo o tráfego ia para a 58817. Quando ela caiu, a loja inteira caiu junto — é o mesmo ponto único de falha do monólito. Distribua a carga com Round-Robin.';
  } else if (!cfg.heartbeat && cfg.retry) {
    diagnostico = 'Nenhuma requisição se perdeu, mas o gateway nunca soube que a 58817 morreu: até o fim do teste, 1 em cada 3 requisições bateu nela primeiro e só funcionou na segunda tentativa — latência dobrada para sempre. Ligue o heartbeat para tirar a instância morta do registro.';
  } else if (!cfg.heartbeat) {
    diagnostico = 'O Round-Robin espalhou a carga, mas o gateway nunca soube que a 58817 morreu: 1 em cada 3 requisições continuou indo para ela até o fim. Ligue o Service Discovery com heartbeat para tirar instâncias mortas do registro.';
  } else if (!cfg.retry) {
    diagnostico = `O heartbeat removeu a 58817 do registro, mas a detecção leva ${ATRASO_DETECCAO} ciclos — e nessa janela as requisições enviadas a ela falharam. Ative o retry para o gateway reenviar a outra instância.`;
  } else {
    diagnostico = 'Arquitetura resiliente: o Round-Robin distribui, o retry cobre a janela de detecção e o heartbeat tira a instância morta do registro. A 58817 caiu e nenhum cliente percebeu.';
  }
  return { ticks, total, falhas, disponibilidade, retentadas, aprovado, diagnostico };
}
