import { QUESTS, questsDoNivel } from './quests';
import type { Nivel } from './types';

interface P {
  concluida: boolean;
  errosDecisao: number;
  dicasTotal: number;
  bonusXP: number;
}
type Progressos = Record<string, P | undefined>;

export interface Conquista {
  id: string;
  icone: string;
  titulo: string;
  descricao: string;
  obtida: boolean;
}

const feita = (p: Progressos, codigo: string) => !!p[QUESTS.find((q) => q.codigo === codigo)!._id]?.concluida;
const perfeita = (x: P | undefined) => !!x?.concluida && x.errosDecisao + x.dicasTotal === 0;
const atoFeito = (p: Progressos, n: Nivel) => questsDoNivel(n).every((q) => p[q._id]?.concluida);
const atoPerfeito = (p: Progressos, n: Nivel) => questsDoNivel(n).every((q) => perfeita(p[q._id]));

export function conquistas(p: Progressos): Conquista[] {
  const todas = Object.values(p);
  return [
    { id: 'primeiro-dia', icone: '🚀', titulo: 'Primeiro dia', descricao: 'Conclua a missão Jr 01.', obtida: feita(p, 'Jr 01') },
    { id: 'impecavel', icone: '⭐', titulo: 'Execução impecável', descricao: 'Conclua uma missão com 3 estrelas.', obtida: todas.some(perfeita) },
    { id: 'do-zero', icone: '✍️', titulo: 'Sem rodinhas', descricao: 'Passe nos testes de uma etapa no modo “escrever do zero”.', obtida: todas.some((x) => (x?.bonusXP ?? 0) > 0) },
    { id: 'hardcore', icone: '🔥', titulo: 'Mão na massa', descricao: 'Acumule 50 XP de bônus escrevendo código do zero.', obtida: todas.reduce((t, x) => t + (x?.bonusXP ?? 0), 0) >= 50 },
    { id: 'segredos', icone: '🔐', titulo: 'Guardião de segredos', descricao: 'Faça o push seguro da missão Jr 05.', obtida: feita(p, 'Jr 05') },
    { id: 'pleno', icone: '🟡', titulo: 'Promoção a Pleno', descricao: 'Conclua todo o ato Júnior.', obtida: atoFeito(p, 'JUNIOR') },
    { id: 'revisor', icone: '🔍', titulo: 'Revisor(a) de confiança', descricao: 'Barre o PR perigoso da missão Pl 04.', obtida: feita(p, 'Pl 04') },
    { id: 'senior', icone: '🔴', titulo: 'Promoção a Sênior', descricao: 'Conclua todo o ato Pleno.', obtida: atoFeito(p, 'PLENO') },
    { id: 'resiliente', icone: '🛡️', titulo: 'Nenhum cliente percebeu', descricao: 'Sobreviva à queda da instância na missão Sr 01.', obtida: feita(p, 'Sr 01') },
    { id: 'black-friday', icone: '🛒', titulo: 'Black Friday sem incidentes', descricao: 'Conclua o deploy final (Sr 04).', obtida: feita(p, 'Sr 04') },
    { id: 'junior-perfeito', icone: '🏅', titulo: 'Júnior nota 10', descricao: '3 estrelas em todas as missões do ato Júnior.', obtida: atoPerfeito(p, 'JUNIOR') },
    { id: 'lenda', icone: '🏆', titulo: 'Lenda da NexusTech', descricao: '3 estrelas em todas as 15 missões.', obtida: QUESTS.every((q) => perfeita(p[q._id])) },
  ];
}
