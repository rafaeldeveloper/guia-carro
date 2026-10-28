import type { Carro } from "@/data/carros";
import { equipamentos, type Equipamento } from "@/lib/busca";

export type Tipo = Carro["tipo"];

export type ParametrosUrl = Record<string, string | string[] | undefined>;

export type FiltrosUrl = { termo: string; tipos: Tipo[]; orcamento: number; exigidos: Equipamento[] };

export const urlEscrita = { busca: "" };

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
  const equip = valores(parametros.equip).flatMap((e) => e.split(","));
  const exigidos = equipamentos.map((e) => e.chave).filter((e) => equip.includes(e));
  return { termo, tipos: tiposLidos, orcamento, exigidos };
}

export function urlComparar({ q, tipo, orcamento }: { q?: string; tipo?: Tipo; orcamento?: number }) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (tipo) p.set("tipo", tipo);
  if (orcamento) p.set("orcamento", String(orcamento));
  const busca = p.toString();
  return busca ? `/comparar?${busca}` : "/comparar";
}
