import { Suspense } from "react";
import { Busca } from "@/components/Busca";
import { BuscaDaUrl } from "@/components/BuscaDaUrl";
import { Topo } from "@/components/Topo";
import { carros } from "@/data/carros";
import { temIncerteza } from "@/lib/apresentacao";
import { calcularRisco } from "@/lib/risco";

export const metadata = { title: "Comparar · Guia do Carro" };

export default function Comparar() {
  const carrosComNota = carros.map((c) => ({ ...c, nota: calcularRisco(c).nota, incerto: temIncerteza(c) }));

  return (
    <main className="conteudo grid gap-6 py-6 md:py-8">
      <Topo titulo="Comparar carros">
        Os {carros.length} carros da lista pela nota de risco; filtre por tipo, orçamento, vão livre e equipamentos.
      </Topo>
      <Suspense fallback={<Busca carros={carrosComNota} />}>
        <BuscaDaUrl carros={carrosComNota} />
      </Suspense>
    </main>
  );
}
