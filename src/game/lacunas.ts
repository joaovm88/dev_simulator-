import type { Etapa, Lacunas, OpcaoLacuna } from './types';

export const MARCADOR = /⟦(\w+)⟧/g;

export const chaveLacuna = (arquivo: string, id: string) => `${arquivo}#${id}`;

export const lacunasDa = (etapa: Etapa): Lacunas[] => ('lacunas' in etapa && etapa.lacunas) || [];

export const idsDoModelo = (l: Lacunas) => [...new Set([...l.modelo.matchAll(MARCADOR)].map((m) => m[1]))];

/** Substitui os marcadores pelas escolhas (texto da opção). */
export function montar(l: Lacunas, escolhas: Record<string, string>): string {
  return l.modelo
    .split('\n')
    .flatMap((linha) => {
      if (!linha.includes('⟦')) return [linha];
      const pronta = linha.replace(MARCADOR, (_m, id) => escolhas[chaveLacuna(l.arquivo, id)] ?? '');
      // Uma lacuna preenchida com "nada" remove a linha inteira (ex.: apagar um ENV).
      return pronta.trim() === '' ? [] : [pronta];
    })
    .join('\n');
}

export const gabarito = (ls: Lacunas[]): Record<string, string> =>
  Object.fromEntries(ls.flatMap((l) => Object.entries(l.slots).map(([id, ops]) => [chaveLacuna(l.arquivo, id), ops.find((o) => o.correta)!.texto])));

/** Ordem estável e "embaralhada" das opções, para a correta não ficar sempre em primeiro. */
export function embaralhar(chave: string, opcoes: OpcaoLacuna[]): OpcaoLacuna[] {
  let h = 7;
  for (const ch of chave) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const giro = h % opcoes.length;
  return [...opcoes.slice(giro), ...opcoes.slice(0, giro)];
}

// Atalhos para escrever as missões.
export const ok = (texto: string, explica: string): OpcaoLacuna => ({ texto, explica, correta: true });
export const no = (texto: string, explica: string): OpcaoLacuna => ({ texto, explica, correta: false });
