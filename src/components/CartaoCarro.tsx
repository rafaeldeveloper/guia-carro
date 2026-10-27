import Link from "next/link";
import type { Carro } from "@/data/carros";
import { FotoCarro } from "@/components/FotoCarro";
import { NotaForma, corTextoNivel } from "@/components/NotaRiscoSelo";
import { nivelRisco } from "@/lib/apresentacao";
import { formatarReais } from "@/lib/formato";
import { faixaRisco } from "@/lib/risco";

export type CarroVitrine = Carro & { nota: number; incerto: boolean };

export function CartaoCarro({
  carro: c,
  posicao,
  motivos,
}: {
  carro: CarroVitrine;
  posicao?: number;
  motivos?: string[];
}) {
  return (
    <Link
      href={`/carros/${c.id}`}
      className="group grid content-start overflow-hidden rounded-xl bg-bg shadow-[0_0_0_1px_var(--border),0_1px_3px_rgb(20_23_26/0.08)] hover:shadow-[0_0_0_1px_var(--border-strong),0_2px_6px_rgb(20_23_26/0.12)]"
    >
      <div className="relative">
        <FotoCarro id={c.id} tipo={c.tipo} foto={c.foto} className="aspect-[16/10]" />
        <span className="absolute top-2.5 left-2.5 rounded-md bg-bg px-2 py-0.5 text-sm shadow-sm">
          <NotaForma nota={c.nota} incerto={c.incerto} />
        </span>
        {posicao && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-bg px-2 text-lg font-extrabold shadow-sm">
            {posicao}º<span className="sr-only"> lugar</span>
          </span>
        )}
      </div>
      <div className="grid gap-0.5 p-3.5">
        <h3 className="font-semibold leading-snug group-hover:underline">
          {c.nome} <span className="font-normal text-muted">{c.anoModelo}</span>
        </h3>
        <p className="text-sm text-muted">
          {c.tipo} · {c.motor}
        </p>
        <p className="mt-1.5 text-lg font-bold">{formatarReais(c.preco)}</p>
        {motivos ? (
          <ul className="mt-1 grid list-disc gap-1 pl-4 text-sm">
            {motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            <span className={`font-semibold ${corTextoNivel[nivelRisco(c.nota)]}`}>Risco {faixaRisco(c.nota)}</span> ·
            garantia {c.garantiaAnos} anos
          </p>
        )}
      </div>
    </Link>
  );
}
