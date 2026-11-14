// Contrato de dados de uma missão (GDD §5). Uma missão é um documento
// serializável: criar novas fases = adicionar novos documentos em quests/.

export type Nivel = 'JUNIOR' | 'PLENO' | 'SENIOR';

export interface ArquivoIDE {
  caminho: string;
  linguagem: string;
  conteudo: string;
}

export interface Opcao {
  id: string;
  texto: string;
  correta: boolean;
  feedbackIA: string;
}

/** Regra estrutural ("AST Analyzer" leve): um padrão que deve (ou não) existir no arquivo. */
export interface Regra {
  nome: string;
  arquivo: string;
  padrao: string;
  flags?: string;
  /** padrão: true. Use false para proibir um padrão. */
  deveExistir?: boolean;
  dica: string;
}

interface EtapaBase {
  ordem: number;
  titulo: string;
  mensagemIA: string;
  /** Dicas progressivas liberadas pelo botão "Pedir dica". */
  dicas?: string[];
}

/** Uma alternativa de uma lacuna, com a explicação do que aquela sintaxe faz. */
export interface OpcaoLacuna {
  texto: string;
  explica: string;
  correta: boolean;
}

/**
 * Código com lacunas: `modelo` é o arquivo completo, com marcadores ⟦id⟧.
 * O mesmo id pode aparecer mais de uma vez (todas as ocorrências recebem a mesma escolha).
 */
export interface Lacunas {
  arquivo: string;
  modelo: string;
  slots: Record<string, OpcaoLacuna[]>;
}

/** Etapas que produzem código podem oferecer o modo guiado por lacunas. */
interface ComLacunas {
  lacunas?: Lacunas[];
}

export interface EtapaDecisao extends EtapaBase {
  tipo: 'DECISAO_ARQUITETURAL';
  opcoes: Opcao[];
}

export interface EtapaTerminal extends EtapaBase {
  tipo: 'COMANDO_TERMINAL';
  /** Cada padrão (regex) precisa casar com um comando executado com sucesso. */
  comandos: { padrao: string; descricao: string }[];
  regras?: Regra[];
}

export interface CasoDeTeste {
  input: unknown[];
  outputEsperado: unknown;
}

/** Teste Python livre: usa `carregar("caminho.py")` e `assert`. */
export interface TestePython {
  nome: string;
  codigo: string;
}

export interface EtapaCodigo extends EtapaBase, ComLacunas {
  tipo: 'IMPLEMENTACAO_CODIGO';
  arquivo: string;
  funcaoAlvo?: string;
  casosDeTeste?: CasoDeTeste[];
  testes?: TestePython[];
  regras?: Regra[];
}

export interface VerificacaoSQL {
  nome: string;
  sql: string;
  esperado?: unknown[][];
  /** A instrução deve ser rejeitada pelo banco (ex.: violação de constraint). */
  deveFalhar?: boolean;
  dica?: string;
}

export interface EtapaSQL extends EtapaBase, ComLacunas {
  tipo: 'IMPLEMENTACAO_SQL';
  arquivo: string;
  setupSQL?: string;
  verificacoes?: VerificacaoSQL[];
  /** Resultado esperado do último SELECT do script do jogador. */
  resultadoEsperado?: { linhas: unknown[][]; ordenado?: boolean };
  regras?: Regra[];
}

export interface VerificacaoMongo {
  nome: string;
  colecao: string;
  filtro: Record<string, unknown>;
  contagem: number;
  dica?: string;
}

export interface EtapaMongo extends EtapaBase, ComLacunas {
  tipo: 'IMPLEMENTACAO_MONGO';
  arquivo: string;
  banco: string;
  verificacoes: VerificacaoMongo[];
  /** Documentos que o validador ($jsonSchema) do jogador precisa rejeitar. */
  devemSerRejeitados?: { nome: string; colecao: string; documento: Record<string, unknown>; dica?: string }[];
  regras?: Regra[];
}

export interface EtapaEstatica extends EtapaBase, ComLacunas {
  tipo: 'VALIDACAO_ESTATICA';
  regras: Regra[];
}

/** Code review invertido: o jogador marca as linhas com problema no código de um colega. */
export interface EtapaRevisao extends EtapaBase {
  tipo: 'REVISAO_CODIGO';
  autor: string;
  linguagem: string;
  codigo: string;
  problemas: { linha: number; explica: string }[];
}

/** Simulador interativo de arquitetura (ver src/game/sim). */
export interface EtapaSimulacao extends EtapaBase {
  tipo: 'SIMULACAO';
  simulador: 'balanceador' | 'blackfriday';
}

export type Etapa = EtapaDecisao | EtapaTerminal | EtapaCodigo | EtapaSQL | EtapaMongo | EtapaEstatica | EtapaRevisao | EtapaSimulacao;

export type EtapaComLacunas = EtapaCodigo | EtapaSQL | EtapaMongo | EtapaEstatica;

export interface Quest {
  _id: string;
  codigo: string; // ex.: "Jr 01"
  titulo: string;
  nivelCarreira: Nivel;
  ordemTrilha: number;
  recompensaXP: number;
  /** Projeto integrador que encerra o nível. */
  boss?: boolean;
  /** Repositório Git já inicializado e com remoto configurado. */
  repoPronto?: boolean;
  conceitos: string[];
  email: { remetente: string; assunto: string; corpo: string };
  arquivosIniciaisIDE: ArquivoIDE[];
  etapas: Etapa[];
}

export interface ResultadoTeste {
  nome: string;
  ok: boolean;
  detalhe?: string;
  arquivo?: string;
  linha?: number;
  saida?: string;
}

export interface ResultadoValidacao {
  ok: boolean;
  testes: ResultadoTeste[];
}

export const NIVEIS: Nivel[] = ['JUNIOR', 'PLENO', 'SENIOR'];

export const ROTULO_NIVEL: Record<Nivel, string> = {
  JUNIOR: 'Desenvolvedor Júnior',
  PLENO: 'Desenvolvedor Pleno',
  SENIOR: 'Desenvolvedor Sênior',
};
