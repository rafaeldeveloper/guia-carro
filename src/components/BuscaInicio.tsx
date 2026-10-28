"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampoBusca } from "@/components/CampoBusca";
import type { CarroPesquisavel } from "@/lib/busca";
import { urlComparar } from "@/lib/filtrosUrl";

export function BuscaInicio({ carros }: { carros: CarroPesquisavel[] }) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  return (
    <Form action="/comparar" role="search" className="relative mt-5 flex max-w-[820px] gap-1.5 rounded-xl bg-campo p-1.5 ring-1 ring-hero-line">
      <label htmlFor="busca-inicio" className="sr-only">
        Buscar carro
      </label>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="ml-2.5 size-4 shrink-0 self-center text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3.5 3.5" />
      </svg>
      <CampoBusca
        id="busca-inicio"
        name="q"
        carros={carros}
        valor={valor}
        aoMudar={setValor}
        aoEscolher={(s) => router.push(s.carroId ? `/carros/${s.carroId}` : urlComparar({ q: s.consulta }))}
        placeholder="Busque por marca, modelo, tipo ou preço"
        className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-base text-ink placeholder:text-muted focus-visible:outline-none"
      />
      <button type="submit" className="rounded-lg bg-accent px-5 font-bold text-accent-ink md:px-7">
        Buscar
      </button>
    </Form>
  );
}
