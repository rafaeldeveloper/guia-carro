import Link from "next/link";
import { FotoCarro } from "@/components/FotoCarro";
import { Topo } from "@/components/Topo";
import { carros } from "@/data/carros";
import { fotos } from "@/data/fotos";

export const metadata = { title: "Créditos das fotos · Guia do Carro" };

export default function Creditos() {
  const comFoto = carros.filter((c) => c.foto && fotos[c.id]);
  return (
    <main className="conteudo grid gap-6 py-6 md:py-8">
      <Topo titulo="Créditos das fotos">
        As fotos vêm da Wikimedia Commons, com licença livre e crédito ao autor. Só redimensionamos e recomprimimos os
        arquivos; nenhuma foi cortada ou editada. Quando não há foto do carro vendido no Brasil, usamos a mesma geração de
        outro mercado e dizemos qual.
      </Topo>
      <ul className="grid gap-4 md:grid-cols-2">
        {comFoto.map((c) => {
          const f = fotos[c.id];
          return (
            <li key={c.id} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-b border-line pb-4">
              <FotoCarro id={c.id} tipo={c.tipo} foto={c.foto} className="aspect-[16/10] rounded-md" />
              <div className="grid content-start gap-0.5 text-sm">
                <Link href={`/carros/${c.id}`} className="font-semibold hover:underline">
                  {c.nome}
                </Link>
                <p>
                  Foto:{" "}
                  <a href={f.urlOrigem} className="link">
                    {f.autor}
                  </a>
                  ,{" "}
                  <a href={f.urlLicenca} className="link" rel="license">
                    {f.licenca}
                  </a>
                  , via Wikimedia Commons
                </p>
                <p className="text-muted">{f.observacao}.</p>
                <p className="text-muted">{f.alterada}.</p>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
