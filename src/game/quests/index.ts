import type { Nivel, Quest } from '../types';
import { JUNIOR } from './junior';
import { PLENO } from './pleno';
import { SENIOR } from './senior';

/** Catálogo de missões, na ordem da trilha. */
export const QUESTS: Quest[] = [...JUNIOR, ...PLENO, ...SENIOR].sort((a, b) => a.ordemTrilha - b.ordemTrilha);

export const questPorId = (id: string | null | undefined) => QUESTS.find((q) => q._id === id);

export const questsDoNivel = (nivel: Nivel) => QUESTS.filter((q) => q.nivelCarreira === nivel);

export const XP_TOTAL = QUESTS.reduce((s, q) => s + q.recompensaXP, 0);
