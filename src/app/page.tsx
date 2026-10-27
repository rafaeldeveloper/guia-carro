import Form from "next/form";
import Link from "next/link";
import { CartaoCarro, type CarroVitrine } from "@/components/CartaoCarro";
import { MeAjude } from "@/components/MeAjude";
import { carros } from "@/data/carros";
import { temIncerteza } from "@/lib/apresentacao";
import { urlComparar, type Tipo } from "@/lib/filtrosUrl";
import { calcularRisco } from "@/lib/risco";

const atalhos: { rotulo: string; href: string }[] = [
  ...(["SUV", "Hatch", "Sedã", "Picape"] as Tipo[]).map((tipo) => ({ rotulo: tipo, href: urlComparar({ tipo }) })),
  { rotulo: "Até R$ 120 mil", href: urlComparar({ orcamento: 120000 }) },
  { rotulo: "Até R$ 160 mil", href: urlComparar({ orcamento: 160000 }) },
];

function Vitrine({
  titulo,
  subtitulo,
  href,
  verTodos,
  itens,
}: {
  titulo: string;
  subtitulo: string;
  href: string;
  verTodos: string;
  itens: CarroVitrine[];
}) {
  const id = `vitrine-${href.replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4">
        <div>
          <h2 id={id} className="text-xl font-bold tracking-tight">
            {titulo}
          </h2>
          <p className="text-muted">{subtitulo}</p>
        </div>
        <Link href={href} className="link text-sm font-semibold">
          {verTodos}
        </Link>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {itens.map((c) => (
          <li key={c.id} className="grid">
            <CartaoCarro carro={c} />
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Inicio() {
  const lista: CarroVitrine[] = carros
    .map((c) => ({ ...c, nota: calcularRisco(c).nota, incerto: temIncerteza(c) }))
    .sort((a, b) => a.nota - b.nota || a.preco - b.preco);
  const doTipo = (tipo: Tipo) => lista.filter((c) => c.tipo === tipo);

  return (
    <main>
      <section className="bg-hero py-10 text-hero-text md:py-12">
        <div className="conteudo">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Qual carro dá menos dor de cabeça?</h1>
          <p className="mt-2 text-hero-muted">
            Nota de risco de {carros.length} carros 0 km, a partir das reclamações por 1.000 vendidos.
          </p>
          <Form action="/comparar" role="search" className="mt-5 flex max-w-[820px] gap-1.5 rounded-xl bg-campo p-1.5 ring-1 ring-hero-line">
            <label htmlFor="busca-inicio" className="sr-only">
              Buscar carro
            </label>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="ml-2.5 size-4 shrink-0 self-center text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3.5 3.5" />
            </svg>
            <input
              id="busca-inicio"
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Busque por marca, modelo ou motor"
              className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-base text-ink placeholder:text-muted focus-visible:outline-none"
            />
            <button type="submit" className="rounded-lg bg-accent px-5 font-bold text-accent-ink md:px-7">
              Buscar
            </button>
          </Form>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Atalhos">
            {atalhos.map((a) => (
              <li key={a.rotulo}>
                <Link
                  href={a.href}
                  className="inline-block rounded-full px-3.5 py-1.5 text-sm text-hero-text ring-1 ring-hero-line hover:bg-white/10"
                >
                  {a.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="conteudo grid gap-12 py-10">
        <MeAjude carros={lista} />
        <Vitrine
          titulo="Menor risco até R$ 160 mil"
          subtitulo="Ordenados pela nota; menor é melhor."
          href={urlComparar({ orcamento: 160000 })}
          verTodos="Ver todos"
          itens={lista.filter((c) => c.preco <= 160000).slice(0, 4)}
        />
        <Vitrine
          titulo="SUVs com menor risco"
          subtitulo={`Os 4 melhores entre ${doTipo("SUV").length} SUVs.`}
          href={urlComparar({ tipo: "SUV" })}
          verTodos="Ver todos"
          itens={doTipo("SUV").slice(0, 4)}
        />
        <Vitrine
          titulo="Picapes com menor risco"
          subtitulo={`Os 4 melhores entre ${doTipo("Picape").length} picapes.`}
          href={urlComparar({ tipo: "Picape" })}
          verTodos="Ver todas"
          itens={doTipo("Picape").slice(0, 4)}
        />
      </div>
    </main>
  );
}
