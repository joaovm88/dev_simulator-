'use client';

import dynamic from 'next/dynamic';

// O workspace depende de localStorage, Web Workers e WebAssembly: só no cliente.
const Workspace = dynamic(() => import('@/components/Workspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center font-mono text-suave">
      <span className="text-verde">dev_OS</span>&nbsp;· iniciando estação de trabalho…
    </div>
  ),
});

export default function Home() {
  return <Workspace />;
}
