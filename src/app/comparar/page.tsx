import { Busca } from "@/components/Busca";
import { Topo } from "@/components/Topo";
import { carros } from "@/data/carros";
import { temIncerteza } from "@/lib/apresentacao";
import { calcularRisco } from "@/lib/risco";

export const metadata = { title: "Comparar · Guia do Carro" };

export default async function Comparar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const carrosComNota = carros.map((c) => ({ ...c, nota: calcularRisco(c).nota, incerto: temIncerteza(c) }));

  return (
    <main className="conteudo grid gap-6 py-6 md:py-8">
      <Topo titulo="Comparar carros">
        Os {carros.length} carros da lista pela nota de risco; filtre por tipo, orçamento, vão livre e equipamentos.
      </Topo>
      <Busca key={JSON.stringify(parametros)} carros={carrosComNota} parametros={parametros} />
    </main>
  );
}
