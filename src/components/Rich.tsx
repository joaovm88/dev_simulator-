import { Fragment } from 'react';

function inline(texto: string) {
  return texto.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*\n]*\*)/g).map((parte, i) => {
    if (parte.startsWith('`') && parte.length > 1) return <code key={i} className="inline">{parte.slice(1, -1)}</code>;
    if (parte.startsWith('**')) return <strong key={i} className="font-semibold text-white">{parte.slice(2, -2)}</strong>;
    if (parte.startsWith('*') && parte.length > 2) return <em key={i}>{parte.slice(1, -1)}</em>;
    return <Fragment key={i}>{parte}</Fragment>;
  });
}

/** Texto das missões: `código`, **negrito** e quebras de linha. */
export function Rich({ texto, blocoDeCodigo = false }: { texto: string; blocoDeCodigo?: boolean }) {
  // Dicas trazem um título na primeira linha e um trecho de código nas demais.
  const quebra = texto.indexOf('\n');
  if (blocoDeCodigo && quebra > 0) {
    return (
      <>
        <div>{inline(texto.slice(0, quebra))}</div>
        <pre className="mt-1.5 overflow-x-auto rounded border border-borda bg-fundo p-2 font-mono text-[12px] leading-5 text-[#b8f5d2]">{texto.slice(quebra + 1)}</pre>
      </>
    );
  }
  return <div className="whitespace-pre-wrap break-words">{inline(texto)}</div>;
}
