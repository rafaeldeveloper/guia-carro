"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Carro } from "@/data/carros";
import { FotoCarro } from "@/components/FotoCarro";
import { NotaForma, ReguaLinha } from "@/components/NotaRiscoSelo";
import { lerFiltrosDaUrl, type ParametrosUrl } from "@/lib/filtrosUrl";
import { formatarReais } from "@/lib/formato";

type CarroBusca = Carro & { nota: number; incerto: boolean };

type Equipamento = keyof Carro["equipamentos"];

const equipamentos: { chave: Equipamento; rotulo: string }[] = [
  { chave: "camera360", rotulo: "Câmera 360°" },
  { chave: "couro", rotulo: "Banco de couro" },
  { chave: "chavePresencial", rotulo: "Chave presencial" },
  { chave: "freioEletronico", rotulo: "Freio de mão eletrônico" },
  { chave: "inducao", rotulo: "Carregador por indução" },
];

type Ordem = "risco" | "preco";

type Filtros = { orcamento: number; vaoMin: number; exigidos: Equipamento[]; tipos: string[] };

type Limites = { precoMin: number; precoMax: number; vaoMax: number };

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function alternarItem<T>(lista: T[], item: T) {
  return lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item];
}

export function Busca({ carros, parametros = {} }: { carros: CarroBusca[]; parametros?: ParametrosUrl }) {
  const limites: Limites = useMemo(
    () => ({
      precoMin: Math.floor(Math.min(...carros.map((c) => c.preco)) / 1000) * 1000,
      precoMax: Math.ceil(Math.max(...carros.map((c) => c.preco)) / 1000) * 1000,
      vaoMax: Math.ceil(Math.max(...carros.map((c) => c.vaoLivreMm ?? 0)) / 5) * 5,
    }),
    [carros],
  );
  const tipos = useMemo(
    () =>
      [...new Set(carros.map((c) => c.tipo))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((tipo) => ({ tipo, total: carros.filter((c) => c.tipo === tipo).length })),
    [carros],
  );
  const inicial: Filtros = { orcamento: limites.precoMax, vaoMin: 0, exigidos: [], tipos: [] };
  const [daUrl] = useState(() =>
    lerFiltrosDaUrl(parametros, { tipos: tipos.map((t) => t.tipo), precoMin: limites.precoMin, precoMax: limites.precoMax }),
  );
  const [filtros, setFiltros] = useState<Filtros>({ ...inicial, orcamento: daUrl.orcamento, tipos: daUrl.tipos });
  const [ordem, setOrdem] = useState<Ordem>("risco");
  const [termo, setTermo] = useState(daUrl.termo);
  const folhaRef = useRef<HTMLDialogElement>(null);

  const resultado = useMemo(
    () =>
      carros
        .filter((c) => normalizar(`${c.nome} ${c.tipo} ${c.motor} ${c.cambio}`).includes(normalizar(termo.trim())))
        .filter((c) => c.preco <= filtros.orcamento)
        .filter((c) => filtros.vaoMin === 0 || (c.vaoLivreMm ?? 0) >= filtros.vaoMin)
        .filter((c) => filtros.exigidos.every((e) => c.equipamentos[e] === true))
        .filter((c) => filtros.tipos.length === 0 || filtros.tipos.includes(c.tipo))
        .sort((a, b) => (ordem === "risco" ? a.nota - b.nota : a.preco - b.preco)),
    [carros, filtros, ordem, termo],
  );

  const ativos = [
    ...(filtros.orcamento < limites.precoMax
      ? [{ id: "orcamento", rotulo: `Até ${formatarReais(filtros.orcamento)}`, remover: { orcamento: limites.precoMax } }]
      : []),
    ...(filtros.vaoMin > 0
      ? [{ id: "vao", rotulo: `Vão livre ≥ ${filtros.vaoMin} mm`, remover: { vaoMin: 0 } }]
      : []),
    ...filtros.exigidos.map((e) => ({
      id: e,
      rotulo: equipamentos.find((q) => q.chave === e)?.rotulo ?? e,
      remover: { exigidos: filtros.exigidos.filter((x) => x !== e) },
    })),
    ...filtros.tipos.map((t) => ({ id: `tipo-${t}`, rotulo: t, remover: { tipos: filtros.tipos.filter((x) => x !== t) } })),
  ];

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    const fechar = () => desktop.matches && folhaRef.current?.close();
    desktop.addEventListener("change", fechar);
    return () => desktop.removeEventListener("change", fechar);
  }, []);

  const limpar = () => setFiltros(inicial);

  return (
    <div className="grid gap-4">
    <div role="search" className="relative">
      <label htmlFor="busca-carro" className="sr-only">
        Buscar carro
      </label>
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3.5 3.5" />
      </svg>
      <input
        id="busca-carro"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar por modelo, marca, motor ou tipo"
        autoComplete="off"
        className="w-full rounded-lg border border-line-forte bg-campo py-3 pr-3 pl-10 text-base placeholder:text-muted"
      />
    </div>
    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
      <aside className="hidden md:block" aria-label="Filtros">
        <div className="sticky top-4 grid gap-5 pt-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Filtros</h2>
            {ativos.length > 0 && (
              <button type="button" onClick={limpar} className="text-sm text-brand underline underline-offset-4">
                Limpar
              </button>
            )}
          </div>
          <PainelFiltros filtros={filtros} setFiltros={setFiltros} limites={limites} tipos={tipos} />
        </div>
      </aside>

      <section className="grid content-start gap-3" aria-labelledby="titulo-resultado">
        <h2 id="titulo-resultado" className="sr-only">
          Resultado
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => folhaRef.current?.showModal()}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2 text-sm font-medium md:hidden"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
            Filtrar{ativos.length > 0 && ` (${ativos.length})`}
          </button>
          <p className="text-sm text-muted max-sm:order-last max-sm:w-full" aria-live="polite">
            <strong className="font-semibold text-ink">{resultado.length}</strong> de {carros.length} carros
          </p>
          <fieldset className="flex items-center gap-2 text-sm">
            <legend className="sr-only">Ordenar por</legend>
            <span className="hidden text-muted sm:inline" aria-hidden="true">
              Ordenar:
            </span>
            <div className="inline-flex rounded-full bg-surface-2 p-0.5">
              {(
                [
                  ["risco", "Menor risco"],
                  ["preco", "Menor preço"],
                ] as const
              ).map(([valor, rotulo]) => (
                <label
                  key={valor}
                  className="cursor-pointer rounded-full px-3 py-1 has-checked:bg-ink has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:outline-brand"
                >
                  <input
                    type="radio"
                    name="ordem"
                    value={valor}
                    checked={ordem === valor}
                    onChange={() => setOrdem(valor)}
                    className="sr-only"
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {ativos.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
            {ativos.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setFiltros((f) => ({ ...f, ...a.remover }))}
                  aria-label={`Remover filtro: ${a.rotulo}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-ink hover:bg-surface"
                >
                  {a.rotulo}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={limpar} className="px-1 text-sm text-muted underline underline-offset-4">
                Limpar tudo
              </button>
            </li>
          </ul>
        )}

        {resultado.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-6 text-sm">
            Nenhum carro atende a todos os filtros. Tire um filtro acima ou aumente o orçamento.
          </p>
        ) : (
          <div>
            <div className={`${grade} hidden border-b border-line pb-2 text-xs text-muted md:grid`} aria-hidden="true">
              <span className="col-span-3" />
              <span className="flex justify-between">
                <span>2</span>
                <span>risco · menor é melhor</span>
                <span>10,5</span>
              </span>
              <span>Nota</span>
              <span className="text-right">Preço</span>
            </div>
            <ol>
              {resultado.map((c, i) => (
                <li key={c.id}>
                  <LinhaCarro carro={c} posicao={i + 1} filtros={filtros} />
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <dialog
        ref={folhaRef}
        aria-labelledby="titulo-folha"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="folha fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-xl bg-surface p-0 text-ink md:hidden"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 id="titulo-folha" className="text-lg font-semibold">
              Filtros
            </h2>
            <div className="flex items-center gap-3">
              {ativos.length > 0 && (
                <button type="button" onClick={limpar} className="text-sm text-brand underline underline-offset-4">
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={() => folhaRef.current?.close()}
                aria-label="Fechar filtros"
                className="grid size-9 place-items-center rounded-full text-xl hover:bg-surface-2"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-4 py-4">
            <PainelFiltros filtros={filtros} setFiltros={setFiltros} limites={limites} tipos={tipos} />
          </div>
          <div className="bg-surface-2 p-4">
            <button
              type="button"
              onClick={() => folhaRef.current?.close()}
              className="w-full rounded-sm bg-accent px-4 py-3 font-medium text-accent-ink"
            >
              {resultado.length === 0 ? "Nenhum carro" : `Ver ${resultado.length} ${resultado.length === 1 ? "carro" : "carros"}`}
            </button>
          </div>
        </div>
      </dialog>
    </div>
    </div>
  );
}

function PainelFiltros({
  filtros,
  setFiltros,
  limites,
  tipos,
}: {
  filtros: Filtros;
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  limites: Limites;
  tipos: { tipo: string; total: number }[];
}) {
  const id = useId();
  return (
    <div className="grid gap-6 text-sm">
      {tipos.length > 1 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-medium">Tipo</legend>
          <div className="flex flex-wrap gap-2">
            {tipos.map(({ tipo, total }) => (
              <label
                key={tipo}
                className="cursor-pointer rounded-full bg-surface-2 px-3 py-1 has-checked:bg-ink has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:outline-brand"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={filtros.tipos.includes(tipo)}
                  onChange={() => setFiltros((f) => ({ ...f, tipos: alternarItem(f.tipos, tipo) }))}
                />
                {tipo} <span className="opacity-70">({total})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-orcamento`} className="flex justify-between font-medium">
          <span>Orçamento até</span>
          <span>{formatarReais(filtros.orcamento)}</span>
        </label>
        <input
          id={`${id}-orcamento`}
          type="range"
          min={limites.precoMin}
          max={limites.precoMax}
          step={1000}
          value={filtros.orcamento}
          onChange={(e) => setFiltros((f) => ({ ...f, orcamento: Number(e.target.value) }))}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-vao`} className="flex justify-between font-medium">
          <span>Vão livre mínimo</span>
          <span>{filtros.vaoMin > 0 ? `${filtros.vaoMin} mm` : "qualquer"}</span>
        </label>
        <input
          id={`${id}-vao`}
          type="range"
          min={0}
          max={limites.vaoMax}
          step={5}
          value={filtros.vaoMin}
          onChange={(e) => setFiltros((f) => ({ ...f, vaoMin: Number(e.target.value) }))}
        />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-medium">Precisa ter</legend>
        {equipamentos.map(({ chave, rotulo }) => (
          <label key={chave} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={filtros.exigidos.includes(chave)}
              onChange={() => setFiltros((f) => ({ ...f, exigidos: alternarItem(f.exigidos, chave) }))}
            />
            {rotulo}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

const grade = "md:grid-cols-[1.5rem_6rem_minmax(0,1fr)_minmax(7rem,11rem)_4rem_7.5rem] md:gap-x-4";

function LinhaCarro({ carro: c, posicao, filtros }: { carro: CarroBusca; posicao: number; filtros: Filtros }) {
  const extras = [
    ...(filtros.vaoMin > 0 ? [`vão livre ${c.vaoLivreMm ?? "?"} mm`] : []),
    ...filtros.exigidos.map((e) => `✓ ${equipamentos.find((q) => q.chave === e)?.rotulo}`),
  ];
  return (
    <Link
      href={`/carros/${c.id}`}
      className={`${grade} group grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-line py-3`}
    >
      <span className="hidden text-right text-sm font-semibold text-muted md:block">{posicao}</span>
      <FotoCarro id={c.id} tipo={c.tipo} foto={c.foto} className="row-span-2 aspect-[16/10] rounded-md md:row-span-1" />
      <div className="min-w-0">
        <h3 className="font-semibold leading-snug group-hover:underline">
          {c.nome} <span className="font-normal text-muted">{c.anoModelo}</span>
        </h3>
        <p className="text-sm text-muted">
          {c.tipo} · garantia {c.garantiaAnos} anos
          {extras.length > 0 && <span className="text-ink"> · {extras.join(" · ")}</span>}
        </p>
      </div>
      <div className="col-start-2 row-start-2 md:col-start-auto md:row-start-auto">
        <ReguaLinha nota={c.nota} incerto={c.incerto} />
      </div>
      <NotaForma nota={c.nota} incerto={c.incerto} className="col-start-3 row-start-1 justify-self-end md:col-start-auto md:row-start-auto md:justify-self-start" />
      <span className="col-start-3 row-start-2 text-right font-semibold md:col-start-auto md:row-start-auto">
        {formatarReais(c.preco)}
      </span>
    </Link>
  );
}
