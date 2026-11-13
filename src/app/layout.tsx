import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'dev_OS — Simulador de Carreira em Engenharia de Software',
  description: 'Evolua de Dev Júnior a Sênior resolvendo demandas reais dentro de uma IDE no navegador.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
