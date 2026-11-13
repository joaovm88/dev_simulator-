// Canal mínimo para outros painéis pedirem a execução de um comando no terminal.
type Ouvinte = (comando: string) => void;
const ouvintes = new Set<Ouvinte>();

export const pedirComando = (comando: string) => ouvintes.forEach((o) => o(comando));
export const aoPedirComando = (o: Ouvinte) => {
  ouvintes.add(o);
  return () => void ouvintes.delete(o);
};
