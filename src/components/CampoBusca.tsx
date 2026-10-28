"use client";

import { useMemo, useState } from "react";
import { sugerir, type CarroPesquisavel, type Sugestao } from "@/lib/busca";

export function CampoBusca({
  id,
  carros,
  valor,
  aoMudar,
  aoEscolher,
  name,
  placeholder,
  className,
}: {
  id: string;
  carros: CarroPesquisavel[];
  valor: string;
  aoMudar: (valor: string) => void;
  aoEscolher: (sugestao: Sugestao) => void;
  name?: string;
  placeholder: string;
  className: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const sugestoes = useMemo(() => sugerir(valor, carros), [valor, carros]);
  const expandido = aberto && sugestoes.length > 0;
  const lista = `${id}-sugestoes`;

  const escolher = (s: Sugestao) => {
    setAberto(false);
    setAtivo(-1);
    aoEscolher(s);
  };

  const teclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (sugestoes.length === 0) return;
      e.preventDefault();
      setAberto(true);
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setAtivo((a) => (!expandido ? (passo === 1 ? 0 : sugestoes.length - 1) : (a + passo + sugestoes.length) % sugestoes.length));
    } else if (e.key === "Enter" && expandido && ativo >= 0) {
      e.preventDefault();
      escolher(sugestoes[ativo]);
    } else if (e.key === "Escape" && expandido) {
      e.preventDefault();
      setAberto(false);
      setAtivo(-1);
    } else if (e.key === "Enter") {
      setAberto(false);
    }
  };

  return (
    <>
      <input
        id={id}
        name={name}
        type="search"
        role="combobox"
        aria-expanded={expandido}
        aria-controls={lista}
        aria-autocomplete="list"
        aria-activedescendant={expandido && ativo >= 0 ? `${id}-opcao-${ativo}` : undefined}
        value={valor}
        onChange={(e) => {
          aoMudar(e.target.value);
          setAberto(true);
          setAtivo(-1);
        }}
        onKeyDown={teclar}
        onFocus={() => setAberto(true)}
        onBlur={() => {
          setAberto(false);
          setAtivo(-1);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      <ul
        id={lista}
        role="listbox"
        aria-label="Sugestões"
        hidden={!expandido}
        className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg bg-surface py-1 text-left text-ink shadow-lg ring-1 ring-line-forte"
      >
        {sugestoes.map((s, i) => (
          <li
            key={s.id}
            id={`${id}-opcao-${i}`}
            role="option"
            aria-selected={i === ativo}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setAtivo(i)}
            onClick={() => escolher(s)}
            className="flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm aria-selected:bg-surface-2"
          >
            <span className={s.carroId ? "font-medium" : "font-semibold text-brand"}>{s.rotulo}</span>
            <span className="shrink-0 text-xs text-muted">{s.detalhe}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
