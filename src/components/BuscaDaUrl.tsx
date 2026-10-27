"use client";

import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { Busca } from "@/components/Busca";
import type { ParametrosUrl } from "@/lib/filtrosUrl";

export function BuscaDaUrl({ carros }: { carros: ComponentProps<typeof Busca>["carros"] }) {
  const busca = useSearchParams();
  const parametros: ParametrosUrl = {};
  for (const chave of new Set(busca.keys())) {
    const v = busca.getAll(chave);
    parametros[chave] = v.length > 1 ? v : v[0];
  }
  return <Busca key={busca.toString()} carros={carros} parametros={parametros} />;
}
