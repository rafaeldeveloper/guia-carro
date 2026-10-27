import type { Carro } from "@/data/carros";

export type Tipo = Carro["tipo"];

export type ParametrosUrl = Record<string, string | string[] | undefined>;

export type FiltrosUrl = { termo: string; tipos: Tipo[]; orcamento: number };

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const valores = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);

export function lerFiltrosDaUrl(
  parametros: ParametrosUrl,
  { tipos, precoMin, precoMax }: { tipos: Tipo[]; precoMin: number; precoMax: number },
): FiltrosUrl {
  const termo = (valores(parametros.q)[0] ?? "").trim().slice(0, 80);
  const pedidos = valores(parametros.tipo).flatMap((t) => t.split(",")).map(normalizar);
  const tiposLidos = tipos.filter((t) => pedidos.includes(normalizar(t)));
  const numero = Number(valores(parametros.orcamento)[0]);
  const orcamento = Number.isFinite(numero) && numero > 0 ? Math.min(Math.max(numero, precoMin), precoMax) : precoMax;
  return { termo, tipos: tiposLidos, orcamento };
}

export function urlComparar({ q, tipo, orcamento }: { q?: string; tipo?: Tipo; orcamento?: number }) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (tipo) p.set("tipo", tipo);
  if (orcamento) p.set("orcamento", String(orcamento));
  const busca = p.toString();
  return busca ? `/comparar?${busca}` : "/comparar";
}
