'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUESTS, questPorId, questsDoNivel } from '../quests';
import { NIVEIS, ROTULO_NIVEL, type Etapa, type Nivel, type Quest, type ResultadoValidacao } from '../types';
import { estadoInicialShell, type EventoShell, type ShellEstado } from '../shell/shell';
import { comandosPendentes, novoBancoSQL, semWhere, validarEtapa, avaliarRegras } from '../validators';
import { executarPython } from '../runtime/pythonBrowser';
import { carregarSQL } from '../runtime/sqlBrowser';
import { bancosDa, descartarBancos } from '../runtime/bancos';
import { MongoSim } from '../runtime/mongoSim';

export interface Mensagem {
  id: number;
  de: 'ia' | 'jogador' | 'sistema';
  texto: string;
  tom?: 'ok' | 'erro' | 'info';
}

export interface Progresso {
  /** Índice da etapa atual em quest.etapas. */
  etapa: number;
  concluida: boolean;
  errosDecisao: number;
  /** Opções erradas já tentadas na etapa atual. */
  tentadas: string[];
  /** Dicas reveladas na etapa atual. */
  dicas: number;
  dicasTotal: number;
  /** Comandos bem-sucedidos desde o início da etapa atual. */
  comandos: string[];
}

export interface Email {
  id: string;
  tipo: 'missao' | 'promocao' | 'aviso';
  remetente: string;
  assunto: string;
  corpo: string;
  questId?: string;
}

export type AbaInferior = 'terminal' | 'testes' | 'dados';

interface Estado {
  progresso: Record<string, Progresso>;
  arquivos: Record<string, Record<string, string>>;
  shell: Record<string, ShellEstado>;
  chat: Record<string, Mensagem[]>;
  lidos: string[];
  questAtivaId: string | null;
  abas: string[];
  arquivoAtivo: string | null;
  emailAberto: string | null;
  painelLateral: 'inbox' | 'explorer';

  // transitório (não persistido)
  resultado: ResultadoValidacao | null;
  validando: boolean;
  abaInferior: AbaInferior;
  dadosVersao: number;
  consultaSQL: { colunas: string[]; linhas: unknown[][] } | null;
  celebracao: { questId: string; promocao: Nivel | 'FIM' | null } | null;

  abrirEmail(id: string): void;
  aceitarMissao(questId: string): void;
  abrirArquivo(caminho: string): void;
  fecharAba(caminho: string): void;
  editarArquivo(caminho: string, conteudo: string): void;
  criarArquivo(caminho: string): void;
  apagarArquivo(caminho: string): void;
  responderDecisao(opcaoId: string): void;
  validar(): Promise<void>;
  pedirDica(): void;
  registrarComandos(comandos: string[], evento?: EventoShell): void;
  salvarShell(estado: ShellEstado): void;
  executarArquivoDeDados(caminho: string): Promise<void>;
  setPainelLateral(p: 'inbox' | 'explorer'): void;
  setAbaInferior(a: AbaInferior): void;
  fecharCelebracao(): void;
  reiniciarMissao(questId: string): void;
  reiniciarJogo(): void;
}

let seqMsg = Date.now();
const msg = (de: Mensagem['de'], texto: string, tom?: Mensagem['tom']): Mensagem => ({ id: ++seqMsg, de, texto, tom });

const progressoInicial = (): Progresso => ({ etapa: 0, concluida: false, errosDecisao: 0, tentadas: [], dicas: 0, dicasTotal: 0, comandos: [] });

// ---------- Seletores ----------

export const questConcluida = (s: Pick<Estado, 'progresso'>, id: string) => !!s.progresso[id]?.concluida;

export const questLiberada = (s: Pick<Estado, 'progresso'>, q: Quest) =>
  q.ordemTrilha === 1 || questConcluida(s, QUESTS[QUESTS.indexOf(q) - 1]._id);

export function nivelAtual(s: Pick<Estado, 'progresso'>): Nivel {
  let nivel: Nivel = 'JUNIOR';
  for (const n of NIVEIS.slice(0, -1)) {
    if (questsDoNivel(n).every((q) => questConcluida(s, q._id))) nivel = NIVEIS[NIVEIS.indexOf(n) + 1];
    else break;
  }
  return nivel;
}

export const trilhaConcluida = (s: Pick<Estado, 'progresso'>) => QUESTS.every((q) => questConcluida(s, q._id));

export const xpTotal = (s: Pick<Estado, 'progresso'>) => QUESTS.filter((q) => questConcluida(s, q._id)).reduce((t, q) => t + q.recompensaXP, 0);

export function estrelas(p: Progresso | undefined): number {
  if (!p?.concluida) return 0;
  const penalidades = p.errosDecisao + p.dicasTotal;
  return penalidades === 0 ? 3 : penalidades <= 2 ? 2 : 1;
}

const EMAIL_BOAS_VINDAS: Email = {
  id: 'aviso_boas_vindas',
  tipo: 'aviso',
  remetente: 'rh@nexustech.dev (People & Culture)',
  assunto: 'Bem-vindo(a) à NexusTech Solutions!',
  corpo:
    'Olá!\n\nSeu acesso à estação de trabalho dev_OS está liberado. Por aqui você vai:\n\n• receber as demandas dos clientes e do Tech Lead nesta caixa de entrada;\n• programar no editor, com o terminal integrado logo abaixo;\n• contar com a dev_IA, nossa mentora de pair programming, no painel à direita.\n\nSua trilha de carreira: Júnior → Pleno → Sênior. Cada nível termina com um projeto integrador (Boss Challenge).\n\nAbra o e-mail do seu Tech Lead para começar. Bom trabalho!',
};

/** Caixa de entrada derivada do progresso (mais recentes primeiro). */
export function caixaDeEntrada(s: Pick<Estado, 'progresso'>): Email[] {
  const emails: Email[] = [EMAIL_BOAS_VINDAS];
  for (const q of QUESTS) {
    if (!questLiberada(s, q)) break;
    emails.push({ id: q._id, tipo: 'missao', questId: q._id, ...q.email });
    if (q.boss && questConcluida(s, q._id)) {
      const proximo = NIVEIS[NIVEIS.indexOf(q.nivelCarreira) + 1];
      emails.push({
        id: `promocao_${q.nivelCarreira}`,
        tipo: 'promocao',
        remetente: 'rh@nexustech.dev (People & Culture)',
        assunto: proximo ? `Parabéns! Você foi promovido(a) a ${ROTULO_NIVEL[proximo]}` : 'Trilha concluída: você chegou ao topo da engenharia da NexusTech',
        corpo: proximo
          ? `É com muita alegria que comunicamos a sua promoção a ${ROTULO_NIVEL[proximo]}.\n\nO projeto integrador “${q.titulo}” foi aprovado pelo comitê técnico. A partir de agora suas demandas mudam de patamar — confira os novos e-mails na caixa de entrada.\n\nParabéns pela evolução!`
          : `O deploy global foi um sucesso e a Black Friday passou sem nenhum incidente.\n\nVocê percorreu toda a trilha da NexusTech: de um script de triagem em Python até a arquitetura de nuvem de uma plataforma distribuída.\n\nObrigado por construir isso com a gente. A próxima geração de devs júnior já tem em quem se inspirar.`,
      });
    }
  }
  return emails.reverse();
}

export const etapaAtual = (s: Pick<Estado, 'progresso' | 'questAtivaId'>): { quest: Quest; etapa: Etapa; progresso: Progresso } | null => {
  const quest = questPorId(s.questAtivaId);
  const progresso = quest && s.progresso[quest._id];
  if (!quest || !progresso || progresso.concluida) return null;
  return { quest, etapa: quest.etapas[progresso.etapa], progresso };
};

const arquivoDaEtapa = (e: Etapa): string | undefined =>
  'arquivo' in e ? e.arquivo : e.tipo === 'VALIDACAO_ESTATICA' ? e.regras[0]?.arquivo : undefined;

// ---------- Store ----------

export const useJogo = create<Estado>()(
  persist(
    (set, get) => {
      /** Avança para a próxima etapa (ou conclui a missão) e narra no chat. */
      const avancar = (questId: string) => {
        const s = get();
        const quest = questPorId(questId)!;
        const p = s.progresso[questId];
        const proxima = p.etapa + 1;
        const chat = [...(s.chat[questId] ?? [])];

        if (proxima >= quest.etapas.length) {
          const final: Progresso = { ...p, concluida: true, tentadas: [], comandos: [] };
          const novoProgresso = { ...s.progresso, [questId]: final };
          const n = estrelas(final);
          chat.push(msg('sistema', `Missão concluída: ${quest.codigo} — ${quest.titulo} · +${quest.recompensaXP} XP · ${'★'.repeat(n)}${'☆'.repeat(3 - n)}`, 'ok'));
          chat.push(msg('ia', quest.boss ? 'Projeto integrador aprovado! Confira a sua caixa de entrada: tem novidade do RH.' : 'Excelente trabalho! Já chegou uma nova demanda na sua caixa de entrada.', 'ok'));
          const promocao: Nivel | 'FIM' | null = quest.boss ? (NIVEIS[NIVEIS.indexOf(quest.nivelCarreira) + 1] ?? 'FIM') : null;
          set({ progresso: novoProgresso, chat: { ...s.chat, [questId]: chat }, celebracao: { questId, promocao }, resultado: null });
          return;
        }

        const etapa = quest.etapas[proxima];
        chat.push(msg('ia', etapa.mensagemIA));
        const arquivo = arquivoDaEtapa(etapa);
        const abre = arquivo && s.arquivos[questId]?.[arquivo] !== undefined ? arquivo : null;
        set({
          progresso: { ...s.progresso, [questId]: { ...p, etapa: proxima, tentadas: [], dicas: 0, comandos: [] } },
          chat: { ...s.chat, [questId]: chat },
          resultado: null,
          abaInferior: etapa.tipo === 'COMANDO_TERMINAL' ? 'terminal' : s.abaInferior,
          ...(abre ? { arquivoAtivo: abre, abas: s.abas.includes(abre) ? s.abas : [...s.abas, abre], emailAberto: null, painelLateral: 'explorer' as const } : {}),
        });
      };

      const dizer = (questId: string, ...novas: Mensagem[]) =>
        set((s) => ({ chat: { ...s.chat, [questId]: [...(s.chat[questId] ?? []), ...novas] } }));

      return {
        progresso: {},
        arquivos: {},
        shell: {},
        chat: {},
        lidos: [],
        questAtivaId: null,
        abas: [],
        arquivoAtivo: null,
        emailAberto: EMAIL_BOAS_VINDAS.id,
        painelLateral: 'inbox',
        resultado: null,
        validando: false,
        abaInferior: 'terminal',
        dadosVersao: 0,
        consultaSQL: null,
        celebracao: null,

        abrirEmail: (id) => set((s) => ({ emailAberto: id, lidos: s.lidos.includes(id) ? s.lidos : [...s.lidos, id] })),

        aceitarMissao: (questId) => {
          const s = get();
          const quest = questPorId(questId);
          if (!quest || !questLiberada(s, quest)) return;
          const novo = !s.progresso[questId];
          const arquivos = s.arquivos[questId] ?? Object.fromEntries(quest.arquivosIniciaisIDE.map((a) => [a.caminho, a.conteudo]));
          const p = s.progresso[questId] ?? progressoInicial();
          const primeiro = arquivoDaEtapa(quest.etapas[Math.min(p.etapa, quest.etapas.length - 1)]) ?? quest.arquivosIniciaisIDE.find((a) => a.caminho.includes('/'))?.caminho ?? quest.arquivosIniciaisIDE[0]?.caminho ?? null;
          const aberto = primeiro && arquivos[primeiro] !== undefined ? primeiro : (Object.keys(arquivos)[0] ?? null);
          set({
            questAtivaId: questId,
            progresso: { ...s.progresso, [questId]: p },
            arquivos: { ...s.arquivos, [questId]: arquivos },
            shell: { ...s.shell, [questId]: s.shell[questId] ?? estadoInicialShell(quest.repoPronto) },
            chat: novo ? { ...s.chat, [questId]: [msg('ia', quest.etapas[0].mensagemIA)] } : s.chat,
            abas: aberto ? [aberto] : [],
            arquivoAtivo: aberto,
            emailAberto: null,
            painelLateral: 'explorer',
            resultado: null,
            consultaSQL: null,
            abaInferior: 'terminal',
          });
        },

        abrirArquivo: (caminho) =>
          set((s) => ({ arquivoAtivo: caminho, emailAberto: null, abas: s.abas.includes(caminho) ? s.abas : [...s.abas, caminho] })),

        fecharAba: (caminho) =>
          set((s) => {
            const abas = s.abas.filter((a) => a !== caminho);
            return { abas, arquivoAtivo: s.arquivoAtivo === caminho ? (abas[abas.length - 1] ?? null) : s.arquivoAtivo };
          }),

        editarArquivo: (caminho, conteudo) =>
          set((s) => (s.questAtivaId ? { arquivos: { ...s.arquivos, [s.questAtivaId]: { ...s.arquivos[s.questAtivaId], [caminho]: conteudo } } } : {})),

        criarArquivo: (caminho) => {
          const s = get();
          const limpo = caminho.trim().replace(/^\.?\//, '');
          if (!s.questAtivaId || !limpo) return;
          if (s.arquivos[s.questAtivaId]?.[limpo] === undefined) get().editarArquivo(limpo, '');
          get().abrirArquivo(limpo);
        },

        apagarArquivo: (caminho) =>
          set((s) => {
            if (!s.questAtivaId) return {};
            const resto = { ...s.arquivos[s.questAtivaId] };
            delete resto[caminho];
            const abas = s.abas.filter((a) => a !== caminho);
            return {
              arquivos: { ...s.arquivos, [s.questAtivaId]: resto },
              abas,
              arquivoAtivo: s.arquivoAtivo === caminho ? (abas[abas.length - 1] ?? null) : s.arquivoAtivo,
            };
          }),

        responderDecisao: (opcaoId) => {
          const atual = etapaAtual(get());
          if (!atual || atual.etapa.tipo !== 'DECISAO_ARQUITETURAL') return;
          const { quest, etapa, progresso } = atual;
          const opcao = etapa.opcoes.find((o) => o.id === opcaoId);
          if (!opcao || progresso.tentadas.includes(opcaoId)) return;
          dizer(quest._id, msg('jogador', opcao.texto), msg('ia', opcao.feedbackIA, opcao.correta ? 'ok' : 'erro'));
          if (opcao.correta) {
            avancar(quest._id);
          } else {
            set((s) => ({
              progresso: { ...s.progresso, [quest._id]: { ...progresso, errosDecisao: progresso.errosDecisao + 1, tentadas: [...progresso.tentadas, opcaoId] } },
            }));
          }
        },

        validar: async () => {
          const atual = etapaAtual(get());
          if (!atual || atual.etapa.tipo === 'DECISAO_ARQUITETURAL' || get().validando) return;
          const { quest, etapa, progresso } = atual;
          set({ validando: true });
          try {
            const s = get();
            const resultado = await validarEtapa(
              etapa,
              { files: s.arquivos[quest._id], pip: s.shell[quest._id]?.pip ?? [], comandos: progresso.comandos },
              { python: executarPython, sql: carregarSQL },
            );
            const falhas = resultado.testes.filter((t) => !t.ok);
            const total = resultado.testes.length;
            set({ resultado, abaInferior: etapa.tipo === 'COMANDO_TERMINAL' ? get().abaInferior : 'testes' });
            if (resultado.ok) {
              dizer(quest._id, msg('sistema', `✓ ${total} de ${total} verificações passaram`, 'ok'));
              avancar(quest._id);
              return;
            }
            const primeira = falhas[0];
            const onde = primeira.arquivo && primeira.linha ? ` Olhe a linha ${primeira.linha} de \`${primeira.arquivo}\`.` : '';
            dizer(
              quest._id,
              msg('sistema', `✗ ${total - falhas.length} de ${total} verificações passaram`, 'erro'),
              msg('ia', `Ainda não. **${primeira.nome}**: ${(primeira.detalhe ?? 'falhou').replace(/[.\s]+$/, '')}.${onde}`, 'erro'),
            );
          } catch (e) {
            dizer(quest._id, msg('sistema', `Não consegui executar a validação: ${(e as Error).message}`, 'erro'));
          } finally {
            set({ validando: false });
          }
        },

        pedirDica: () => {
          const atual = etapaAtual(get());
          if (!atual) return;
          const { quest, etapa, progresso } = atual;
          const dicas = etapa.dicas ?? [];
          if (progresso.dicas >= dicas.length) return;
          dizer(quest._id, msg('jogador', 'Pode me dar uma dica?'), msg('ia', `💡 ${dicas[progresso.dicas]}`, 'info'));
          set((s) => ({
            progresso: { ...s.progresso, [quest._id]: { ...progresso, dicas: progresso.dicas + 1, dicasTotal: progresso.dicasTotal + 1 } },
          }));
        },

        registrarComandos: (comandos, evento) => {
          const s = get();
          const questId = s.questAtivaId;
          if (!questId) return;
          if (evento === 'SEGREDO_NO_PUSH') {
            dizer(
              questId,
              msg(
                'ia',
                '🚨 **Push bloqueado pelo secret scanning.** O arquivo `.env`, com a chave da API, entrou no seu commit. Se isso chegasse a um repositório público, bots encontrariam a chave em minutos.\n\nComo corrigir:\n1. Crie o `.gitignore` com a linha `.env`\n2. `git rm --cached .env` (para de rastrear, sem apagar do disco)\n3. Novo `git add .` e `git commit`, e então o `git push`\n\nNa vida real, uma chave que chegou a ser commitada deve ser **revogada e trocada**: ela continua no histórico do Git.',
                'erro',
              ),
            );
          }
          const atual = etapaAtual(get());
          if (!atual || comandos.length === 0) return;
          const progresso = { ...atual.progresso, comandos: [...atual.progresso.comandos, ...comandos] };
          set((st) => ({ progresso: { ...st.progresso, [questId]: progresso } }));
          if (atual.etapa.tipo !== 'COMANDO_TERMINAL') return;
          if (comandosPendentes(atual.etapa, progresso.comandos).length > 0) return;
          const regras = avaliarRegras(atual.etapa.regras ?? [], get().arquivos[questId]);
          const falha = regras.find((r) => !r.ok);
          if (falha) {
            dizer(questId, msg('ia', `Os comandos rodaram, mas falta um detalhe. **${falha.nome}**: ${falha.detalhe}`, 'erro'));
            return;
          }
          dizer(questId, msg('sistema', '✓ Comandos executados com sucesso', 'ok'));
          avancar(questId);
        },

        salvarShell: (estado) => set((s) => (s.questAtivaId ? { shell: { ...s.shell, [s.questAtivaId]: estado } } : {})),

        executarArquivoDeDados: async (caminho) => {
          const s = get();
          const quest = questPorId(s.questAtivaId);
          if (!quest) return;
          const script = s.arquivos[quest._id][caminho] ?? '';
          const bancos = bancosDa(quest._id);
          try {
            if (caminho.endsWith('.sql')) {
              const perigosa = semWhere(script);
              if (perigosa) throw new Error(`Transação congelada pela dev_IA: "${perigosa}" não tem WHERE e afetaria todas as linhas.`);
              const dono = quest.etapas.find((e) => e.tipo === 'IMPLEMENTACAO_SQL' && e.arquivo === caminho);
              const SQL = await carregarSQL();
              bancos.sql?.close();
              bancos.sql = novoBancoSQL(SQL, dono?.tipo === 'IMPLEMENTACAO_SQL' ? dono.setupSQL : undefined);
              const r = bancos.sql.exec(script);
              const ultimo = r[r.length - 1];
              set({ consultaSQL: ultimo ? { colunas: ultimo.columns, linhas: ultimo.values as unknown[][] } : null });
            } else {
              bancos.mongo = new MongoSim();
              bancos.mongo.executar(script);
              set({ consultaSQL: null });
            }
            set((st) => ({ dadosVersao: st.dadosVersao + 1, abaInferior: 'dados' }));
          } catch (e) {
            set((st) => ({ dadosVersao: st.dadosVersao + 1, abaInferior: 'dados', consultaSQL: { colunas: ['erro'], linhas: [[(e as Error).message]] } }));
          }
        },

        setPainelLateral: (painelLateral) => set({ painelLateral }),
        setAbaInferior: (abaInferior) => set({ abaInferior }),
        fecharCelebracao: () => set({ celebracao: null, painelLateral: 'inbox' }),

        reiniciarMissao: (questId) => {
          const s = get();
          const quest = questPorId(questId);
          if (!quest) return;
          descartarBancos(questId);
          const semEla = <T,>(r: Record<string, T>) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== questId));
          // Missão já concluída mantém progresso e XP: só os arquivos voltam ao estado inicial.
          const eraConcluida = questConcluida(s, questId);
          set({ arquivos: semEla(s.arquivos), shell: semEla(s.shell), ...(eraConcluida ? {} : { chat: semEla(s.chat), progresso: semEla(s.progresso) }) });
          get().aceitarMissao(questId);
          if (eraConcluida) dizer(questId, msg('sistema', 'Arquivos restaurados ao estado inicial. Esta missão já foi concluída: fique à vontade para praticar.', 'info'));
        },

        reiniciarJogo: () => {
          descartarBancos();
          set({
            progresso: {},
            arquivos: {},
            shell: {},
            chat: {},
            lidos: [],
            questAtivaId: null,
            abas: [],
            arquivoAtivo: null,
            emailAberto: EMAIL_BOAS_VINDAS.id,
            painelLateral: 'inbox',
            resultado: null,
            consultaSQL: null,
            celebracao: null,
          });
        },
      };
    },
    {
      name: 'devos-save-v1',
      partialize: (s) => ({
        progresso: s.progresso,
        arquivos: s.arquivos,
        shell: s.shell,
        chat: s.chat,
        lidos: s.lidos,
        questAtivaId: s.questAtivaId,
        abas: s.abas,
        arquivoAtivo: s.arquivoAtivo,
        emailAberto: s.emailAberto,
        painelLateral: s.painelLateral,
      }),
    },
  ),
);
