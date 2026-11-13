import type { Nivel } from '@/game/types';

export const COR_NIVEL: Record<Nivel, { texto: string; fundo: string; borda: string; rotulo: string }> = {
  JUNIOR: { texto: 'text-verde', fundo: 'bg-verde/10', borda: 'border-verde/40', rotulo: 'Júnior' },
  PLENO: { texto: 'text-ambar', fundo: 'bg-ambar/10', borda: 'border-ambar/40', rotulo: 'Pleno' },
  SENIOR: { texto: 'text-vermelho', fundo: 'bg-vermelho/10', borda: 'border-vermelho/40', rotulo: 'Sênior' },
};

export function linguagemDe(caminho: string): string {
  if (/(^|\/)Dockerfile$/.test(caminho)) return 'dockerfile';
  const ext = caminho.split('.').pop() ?? '';
  return (
    { py: 'python', sql: 'sql', java: 'java', ts: 'typescript', tsx: 'typescript', js: 'javascript', json: 'json', md: 'markdown', yaml: 'yaml', yml: 'yaml', kt: 'kotlin' }[ext] ?? 'plaintext'
  );
}

export const executavel = (caminho: string) => /\.(py|sql|mongodb\.js)$/.test(caminho);
