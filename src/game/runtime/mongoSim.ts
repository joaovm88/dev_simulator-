// Simulador mínimo de MongoDB/mongosh em memória (missão Pl 05 e Data Inspector).
// Cobre o subconjunto do GDD: use/show, insertOne/Many, find/findOne, update*,
// delete*/remove, countDocuments e validação com $jsonSchema.

type Doc = Record<string, unknown>;

export class ObjectId {
  hex: string;
  constructor(hex?: string) {
    this.hex =
      hex ?? Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
  toString() {
    return this.hex;
  }
  toJSON() {
    return { $oid: this.hex };
  }
}

function igual(a: unknown, b: unknown): boolean {
  if (a instanceof ObjectId || b instanceof ObjectId) return String(a) === String(b);
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Resolve "a.b.c" atravessando arrays (retorna todos os valores candidatos). */
function valores(doc: unknown, caminho: string[]): unknown[] {
  if (caminho.length === 0) return [doc];
  if (Array.isArray(doc)) return doc.flatMap((d) => valores(d, caminho));
  if (doc && typeof doc === 'object') return valores((doc as Doc)[caminho[0]], caminho.slice(1));
  return [undefined];
}

function ehOperador(c: unknown): c is Doc {
  return !!c && typeof c === 'object' && !Array.isArray(c) && Object.keys(c).some((k) => k.startsWith('$'));
}

function testa(valor: unknown, cond: unknown): boolean {
  if (!ehOperador(cond)) {
    if (Array.isArray(valor) && !Array.isArray(cond)) return valor.some((v) => igual(v, cond));
    return igual(valor, cond);
  }
  return Object.entries(cond).every(([op, arg]) => {
    const n = valor as number;
    switch (op) {
      case '$eq':
        return testa(valor, arg);
      case '$ne':
        return !testa(valor, arg);
      case '$gt':
        return valor != null && n > (arg as number);
      case '$gte':
        return valor != null && n >= (arg as number);
      case '$lt':
        return valor != null && n < (arg as number);
      case '$lte':
        return valor != null && n <= (arg as number);
      case '$in':
        return (arg as unknown[]).some((a) => testa(valor, a));
      case '$nin':
        return !(arg as unknown[]).some((a) => testa(valor, a));
      case '$exists':
        return (valor !== undefined) === Boolean(arg);
      case '$size':
        return Array.isArray(valor) && valor.length === arg;
      case '$elemMatch':
        return Array.isArray(valor) && valor.some((v) => casa(v as Doc, arg as Doc));
      case '$regex':
        return typeof valor === 'string' && new RegExp(arg as string).test(valor);
      default:
        throw new Error(`Operador não suportado no simulador: ${op}`);
    }
  });
}

export function casa(doc: Doc, filtro: Doc = {}): boolean {
  return Object.entries(filtro).every(([chave, cond]) => {
    if (chave === '$and') return (cond as Doc[]).every((f) => casa(doc, f));
    if (chave === '$or') return (cond as Doc[]).some((f) => casa(doc, f));
    const candidatos = valores(doc, chave.split('.'));
    if (ehOperador(cond) && ('$exists' in cond || '$ne' in cond || '$nin' in cond || '$size' in cond || '$elemMatch' in cond)) {
      const direto = chave.split('.').reduce<unknown>((d, k) => (d && typeof d === 'object' ? (d as Doc)[k] : undefined), doc);
      return testa(direto, cond);
    }
    return candidatos.some((v) => testa(v, cond));
  });
}

const TIPOS: Record<string, (v: unknown) => boolean> = {
  string: (v) => typeof v === 'string',
  int: (v) => Number.isInteger(v),
  long: (v) => Number.isInteger(v),
  double: (v) => typeof v === 'number',
  decimal: (v) => typeof v === 'number',
  number: (v) => typeof v === 'number',
  bool: (v) => typeof v === 'boolean',
  object: (v) => !!v && typeof v === 'object' && !Array.isArray(v),
  array: (v) => Array.isArray(v),
  objectId: (v) => v instanceof ObjectId,
  date: (v) => v instanceof Date,
  null: (v) => v === null,
};

/** Retorna a descrição do primeiro problema, ou null se o documento for válido. */
export function validarSchema(v: unknown, schema: Doc, caminho = 'documento'): string | null {
  if (schema.bsonType) {
    const tipos = ([] as string[]).concat(schema.bsonType as string | string[]);
    if (!tipos.some((t) => TIPOS[t]?.(v))) return `${caminho} deveria ser do tipo ${tipos.join(' ou ')}`;
  }
  if (schema.enum && !(schema.enum as unknown[]).some((e) => igual(e, v))) return `${caminho} fora do enum permitido`;
  if (typeof v === 'number') {
    if (schema.minimum !== undefined && v < (schema.minimum as number)) return `${caminho} é menor que o mínimo ${schema.minimum}`;
    if (schema.maximum !== undefined && v > (schema.maximum as number)) return `${caminho} é maior que o máximo ${schema.maximum}`;
  }
  if (typeof v === 'string' && schema.minLength !== undefined && v.length < (schema.minLength as number))
    return `${caminho} é mais curto que ${schema.minLength} caracteres`;
  if (Array.isArray(v)) {
    if (schema.minItems !== undefined && v.length < (schema.minItems as number)) return `${caminho} precisa de ao menos ${schema.minItems} item(ns)`;
    if (schema.items) {
      for (let i = 0; i < v.length; i++) {
        const e = validarSchema(v[i], schema.items as Doc, `${caminho}[${i}]`);
        if (e) return e;
      }
    }
  } else if (v && typeof v === 'object') {
    const obj = v as Doc;
    for (const campo of (schema.required as string[]) ?? []) {
      if (obj[campo] === undefined) return `campo obrigatório ausente: ${caminho === 'documento' ? '' : caminho + '.'}${campo}`;
    }
    for (const [campo, sub] of Object.entries((schema.properties as Record<string, Doc>) ?? {})) {
      if (obj[campo] === undefined) continue;
      const e = validarSchema(obj[campo], sub, caminho === 'documento' ? campo : `${caminho}.${campo}`);
      if (e) return e;
    }
  }
  return null;
}

class Cursor {
  constructor(private docs: Doc[]) {}
  sort(spec: Record<string, 1 | -1>) {
    const [[campo, dir]] = Object.entries(spec);
    const copia = [...this.docs].sort((a, b) => {
      const [x] = valores(a, campo.split('.')) as number[];
      const [y] = valores(b, campo.split('.')) as number[];
      return (x > y ? 1 : x < y ? -1 : 0) * dir;
    });
    return new Cursor(copia);
  }
  limit(n: number) {
    return new Cursor(this.docs.slice(0, n));
  }
  skip(n: number) {
    return new Cursor(this.docs.slice(n));
  }
  pretty() {
    return this;
  }
  count() {
    return this.docs.length;
  }
  toArray() {
    return this.docs;
  }
  toJSON() {
    return this.docs;
  }
}

function aplicarUpdate(doc: Doc, update: Doc) {
  const set = (caminho: string, fn: (atual: unknown) => unknown) => {
    const partes = caminho.split('.');
    let alvo = doc;
    for (const p of partes.slice(0, -1)) {
      if (!alvo[p] || typeof alvo[p] !== 'object') alvo[p] = {};
      alvo = alvo[p] as Doc;
    }
    const ultimo = partes[partes.length - 1];
    const novo = fn(alvo[ultimo]);
    if (novo === undefined) delete alvo[ultimo];
    else alvo[ultimo] = novo;
  };
  for (const [op, campos] of Object.entries(update)) {
    if (!op.startsWith('$')) throw new Error('MongoInvalidArgumentError: Update document requires atomic operators (ex.: $set)');
    for (const [campo, arg] of Object.entries(campos as Doc)) {
      if (op === '$set') set(campo, () => arg);
      else if (op === '$unset') set(campo, () => undefined);
      else if (op === '$inc') set(campo, (a) => ((a as number) ?? 0) + (arg as number));
      else if (op === '$push') set(campo, (a) => [...((a as unknown[]) ?? []), arg]);
      else if (op === '$pull') set(campo, (a) => ((a as unknown[]) ?? []).filter((x) => !testa(x, arg)));
      else throw new Error(`Operador de atualização não suportado no simulador: ${op}`);
    }
  }
}

export class Colecao {
  docs: Doc[] = [];
  schema: Doc | null = null;
  constructor(public nome: string) {}

  private validar(doc: Doc) {
    if (!this.schema) return;
    const problema = validarSchema(doc, this.schema);
    if (problema) throw new Error(`MongoServerError: Document failed validation (${problema})`);
  }
  insertOne(doc: Doc) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new Error('insertOne espera um documento { ... }');
    const novo = { _id: doc._id ?? new ObjectId(), ...doc };
    if (this.docs.some((d) => igual(d._id, novo._id))) throw new Error(`MongoServerError: E11000 duplicate key error collection: ${this.nome} index: _id_`);
    this.validar(novo);
    this.docs.push(novo);
    return { acknowledged: true, insertedId: novo._id };
  }
  insertMany(docs: Doc[]) {
    if (!Array.isArray(docs)) throw new Error('insertMany espera um array de documentos [ {...}, {...} ]');
    const ids = docs.map((d) => this.insertOne(d).insertedId);
    return { acknowledged: true, insertedIds: ids };
  }
  find(filtro: Doc = {}) {
    return new Cursor(this.docs.filter((d) => casa(d, filtro)));
  }
  findOne(filtro: Doc = {}) {
    return this.docs.find((d) => casa(d, filtro)) ?? null;
  }
  countDocuments(filtro: Doc = {}) {
    return this.docs.filter((d) => casa(d, filtro)).length;
  }
  private atualizar(filtro: Doc, update: Doc, muitos: boolean) {
    const alvos = this.docs.filter((d) => casa(d, filtro)).slice(0, muitos ? undefined : 1);
    for (const d of alvos) {
      const copia = structuredClone(JSON.parse(JSON.stringify(d))) as Doc;
      copia._id = d._id;
      aplicarUpdate(copia, update);
      this.validar(copia);
      Object.keys(d).forEach((k) => delete d[k]);
      Object.assign(d, copia);
    }
    return { acknowledged: true, matchedCount: alvos.length, modifiedCount: alvos.length };
  }
  updateOne(filtro: Doc, update: Doc) {
    return this.atualizar(filtro, update, false);
  }
  updateMany(filtro: Doc, update: Doc) {
    return this.atualizar(filtro, update, true);
  }
  update(filtro: Doc, update: Doc) {
    return this.atualizar(filtro, update, false);
  }
  private apagar(filtro: Doc, muitos: boolean) {
    const alvos = new Set(this.docs.filter((d) => casa(d, filtro)).slice(0, muitos ? undefined : 1));
    this.docs = this.docs.filter((d) => !alvos.has(d));
    return { acknowledged: true, deletedCount: alvos.size };
  }
  deleteOne(filtro: Doc = {}) {
    return this.apagar(filtro, false);
  }
  deleteMany(filtro: Doc = {}) {
    return this.apagar(filtro, true);
  }
  remove(filtro: Doc = {}) {
    return this.apagar(filtro, true);
  }
  drop() {
    this.docs = [];
    this.schema = null;
    return true;
  }
}

export class MongoSim {
  bancos: Record<string, Record<string, Colecao>> = {};
  atual = 'test';

  colecao(nome: string, banco = this.atual): Colecao {
    const b = (this.bancos[banco] ??= {});
    return (b[nome] ??= new Colecao(nome));
  }

  private db() {
    const metodos: Record<string, unknown> = {
      createCollection: (nome: string, opcoes?: { validator?: { $jsonSchema?: Doc } }) => {
        const c = this.colecao(nome);
        c.schema = opcoes?.validator?.$jsonSchema ?? null;
        return { ok: 1 };
      },
      getCollectionNames: () => Object.keys(this.bancos[this.atual] ?? {}),
      getName: () => this.atual,
      dropDatabase: () => {
        delete this.bancos[this.atual];
        return { ok: 1, dropped: this.atual };
      },
    };
    return new Proxy(metodos, {
      get: (alvo, prop: string) => (prop in alvo ? alvo[prop] : this.colecao(prop)),
    });
  }

  /**
   * Executa um script mongosh. O código é digitado pelo próprio jogador e roda
   * apenas na sessão dele (mesmo modelo de confiança do editor/terminal).
   * Com `expressao`, devolve o valor da linha (uso interativo no terminal).
   */
  executar(script: string, expressao = false): unknown {
    const codigo = script
      .replace(/^\s*use\s+([\w-]+)\s*;?\s*$/gm, 'use("$1");')
      .replace(/^\s*show\s+(dbs|databases|collections)\s*;?\s*$/gm, 'show("$1");');
    const use = (nome: string) => {
      this.atual = nome;
      this.bancos[nome] ??= {};
      return `switched to db ${nome}`;
    };
    const show = (oque: string) =>
      oque === 'collections' ? Object.keys(this.bancos[this.atual] ?? {}).join('\n') : Object.keys(this.bancos).join('\n');
    const corpo = expressao ? `return (${codigo.trim().replace(/;$/, '')}\n);` : codigo;
    const fn = new Function('db', 'use', 'show', 'ObjectId', 'print', `"use strict";\n${corpo}`);
    return fn(this.db(), use, show, (h?: string) => new ObjectId(h), () => undefined);
  }
}

export function formatarMongo(v: unknown): string {
  if (v === undefined) return '';
  if (typeof v === 'string') return v;
  return JSON.stringify(v, null, 2).replace(/\{\s*"\$oid":\s*"([0-9a-f]+)"\s*\}/g, 'ObjectId("$1")');
}
