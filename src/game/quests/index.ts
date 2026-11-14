import type { Etapa, Nivel, Quest } from '../types';
import { JUNIOR } from './junior';
import { PLENO } from './pleno';
import { SENIOR } from './senior';
import { LACUNAS } from './lacunas';

/** Arquivo em que a etapa trabalha (se houver). */
export const arquivoDaEtapa = (e: Etapa): string | undefined =>
  'arquivo' in e ? e.arquivo : e.tipo === 'VALIDACAO_ESTATICA' ? e.regras[0]?.arquivo : undefined;

/** Anexa o modo guiado (lacunas) às etapas de código. */
const comLacunas = (q: Quest): Quest => ({
  ...q,
  etapas: q.etapas.map((e) => {
    const lacunas = LACUNAS[`${q._id}:${arquivoDaEtapa(e)}`];
    return lacunas ? ({ ...e, lacunas } as Etapa) : e;
  }),
});

/** Catálogo de missões, na ordem da trilha. */
export const QUESTS: Quest[] = [...JUNIOR, ...PLENO, ...SENIOR].sort((a, b) => a.ordemTrilha - b.ordemTrilha).map(comLacunas);

export const questPorId = (id: string | null | undefined) => QUESTS.find((q) => q._id === id);

export const questsDoNivel = (nivel: Nivel) => QUESTS.filter((q) => q.nivelCarreira === nivel);

export const XP_TOTAL = QUESTS.reduce((s, q) => s + q.recompensaXP, 0);
