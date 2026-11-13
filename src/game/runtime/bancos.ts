// Bancos "vivos" da sessão (alimentam o Data Inspector e o mongosh do terminal).
// Ficam fora do store porque não são serializáveis; são recriados a cada "Executar".
import type { Database } from 'sql.js';
import { MongoSim } from './mongoSim';

interface Bancos {
  sql: Database | null;
  mongo: MongoSim;
}

const porQuest = new Map<string, Bancos>();

export function bancosDa(questId: string): Bancos {
  let b = porQuest.get(questId);
  if (!b) porQuest.set(questId, (b = { sql: null, mongo: new MongoSim() }));
  return b;
}

export function descartarBancos(questId?: string) {
  for (const [id, b] of porQuest) {
    if (questId && id !== questId) continue;
    b.sql?.close();
    porQuest.delete(id);
  }
}
