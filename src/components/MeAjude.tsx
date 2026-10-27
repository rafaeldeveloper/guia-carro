"use client";

import { useId, useState } from "react";
import { CartaoCarro, type CarroVitrine } from "@/components/CartaoCarro";
import type { Tipo } from "@/lib/filtrosUrl";
import { formatarMilReais } from "@/lib/formato";
import { candidatos, rotuloGrupo, sugerir, type Perguntas, type Prioridade } from "@/lib/sugestoes";

const tipos: [Tipo | null, string][] = [
  [null, "Qualquer"],
  ["SUV", "SUV"],
  ["Hatch", "Hatch"],
  ["Sedã", "Sedã"],
  ["Picape", "Picape"],
];

const tetos: (number | null)[] = [120000, 160000, 200000, null];

const prioridades: [Prioridade, string][] = [
  ["risco", "Menor risco"],
  ["preco", "Menor preço"],
  ["espaco", "Mais espaço"],
];

function Grupo<T>({
  titulo,
  opcoes,
  valor,
  aoMudar,
}: {
  titulo: string;
  opcoes: [T, string][];
  valor: T;
  aoMudar: (v: T) => void;
}) {
  const nome = useId();
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([v, rotulo]) => (
          <label
            key={rotulo}
            className="cursor-pointer rounded-full bg-bg px-3.5 py-1.5 text-sm shadow-[0_0_0_1px_var(--border-strong)] has-checked:bg-ink has-checked:text-bg has-checked:shadow-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
          >
            <input type="radio" name={nome} className="sr-only" checked={v === valor} onChange={() => aoMudar(v)} />
            {rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MeAjude({ carros }: { carros: CarroVitrine[] }) {
  const [p, setP] = useState<Perguntas>({ tipo: null, ate: 160000, prioridade: "risco" });
  const sugestoes = sugerir(carros, p);
  const total = candidatos(carros, p).length;

  return (
    <section aria-labelledby="titulo-ajuda" className="grid gap-4">
      <div>
        <h2 id="titulo-ajuda" className="text-xl font-bold tracking-tight">
          Me ajude a escolher
        </h2>
        <p className="text-muted">Três perguntas e mostramos os carros que combinam.</p>
      </div>
      <div className="grid gap-5 rounded-xl bg-surface-2 p-4 md:grid-cols-[1fr_1.1fr_1fr] md:p-5">
        <Grupo titulo="Tipo" opcoes={tipos} valor={p.tipo} aoMudar={(tipo) => setP({ ...p, tipo })} />
        <Grupo
          titulo="Até quanto?"
          opcoes={tetos.map((t) => [t, t === null ? "Sem limite" : formatarMilReais(t)])}
          valor={p.ate}
          aoMudar={(ate) => setP({ ...p, ate })}
        />
        <Grupo
          titulo="O que pesa mais?"
          opcoes={prioridades}
          valor={p.prioridade}
          aoMudar={(prioridade) => setP({ ...p, prioridade })}
        />
      </div>
      <div aria-live="polite" className="grid gap-3">
        <h3 className="text-lg font-bold tracking-tight">
          {sugestoes.length === 0
            ? `Nenhum ${p.tipo ? p.tipo : "carro"} até ${p.ate ? formatarMilReais(p.ate) : "esse valor"} na lista`
            : `Nossas sugestões entre ${total} ${rotuloGrupo(p)}`}
        </h3>
        {sugestoes.length > 0 && (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sugestoes.map((s, i) => (
              <li key={s.carro.id} className="grid">
                <CartaoCarro carro={s.carro} posicao={i + 1} motivos={s.motivos} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
