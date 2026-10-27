"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

type Tema = "light" | "dark";

const CHAVE = "tema";
const CONSULTA_ESCURO = "(prefers-color-scheme: dark)";

function lerSalvo(): Tema | null {
  try {
    const t = localStorage.getItem(CHAVE);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function temaAtual(): Tema {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return window.matchMedia(CONSULTA_ESCURO).matches ? "dark" : "light";
}

function assinar(aviso: () => void) {
  const midia = window.matchMedia(CONSULTA_ESCURO);
  midia.addEventListener("change", aviso);
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    midia.removeEventListener("change", aviso);
    observador.disconnect();
  };
}

export function AlternarTema() {
  const tema = useSyncExternalStore(assinar, temaAtual, () => null);

  useLayoutEffect(() => {
    const salvo = lerSalvo();
    if (salvo) document.documentElement.setAttribute("data-theme", salvo);
  }, []);

  function alternar() {
    const proximo: Tema = temaAtual() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", proximo);
    try {
      localStorage.setItem(CHAVE, proximo);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Tema escuro"
      aria-pressed={tema === null ? undefined : tema === "dark"}
      title={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="grid size-9 place-items-center rounded-sm text-ink hover:bg-surface-2"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="icone-sol size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="3.5" />
        <path d="M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.17 4.17l1.41 1.41M14.42 14.42l1.41 1.41M4.17 15.83l1.41-1.41M14.42 5.58l1.41-1.41" />
      </svg>
      <svg viewBox="0 0 20 20" aria-hidden="true" className="icone-lua size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z" />
      </svg>
    </button>
  );
}
