"use client";

import { useSearchParams } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { Busca } from "@/components/Busca";
import { urlEscrita, type ParametrosUrl } from "@/lib/filtrosUrl";

export function BuscaDaUrl({ carros }: { carros: ComponentProps<typeof Busca>["carros"] }) {
  const busca = useSearchParams();
  const atual = busca.toString();
  const [visto, setVisto] = useState(atual);
  const [geracao, setGeracao] = useState(0);
  if (atual !== visto) {
    setVisto(atual);
    if (atual !== urlEscrita.busca) setGeracao((g) => g + 1);
  }
  const parametros: ParametrosUrl = {};
  for (const chave of new Set(busca.keys())) {
    const v = busca.getAll(chave);
    parametros[chave] = v.length > 1 ? v : v[0];
  }
  return <Busca key={geracao} carros={carros} parametros={parametros} />;
}
