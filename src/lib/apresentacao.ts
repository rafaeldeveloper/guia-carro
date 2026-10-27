import type { Carro, Sistema } from "@/data/carros";
import { faixaRisco } from "@/lib/risco";

export const NOTA_MIN = 2;
export const NOTA_MAX = 10.5;
export const LIMITES_FAIXA = [4, 5.5, 7];

export function nivelRisco(nota: number): 1 | 2 | 3 | 4 {
  const faixa = faixaRisco(nota);
  if (faixa === "baixo") return 1;
  if (faixa === "médio") return 2;
  if (faixa === "médio-alto") return 3;
  return 4;
}

export function temIncerteza(carro: Carro) {
  return carro.risco.referencia !== null || carro.risco.mesesDeDados < 12;
}

export function dataMaisRecente(carro: Carro) {
  const datas = [carro.precoFonte, ...carro.fontes].flatMap((t) => t.match(/\d{4}-\d{2}-\d{2}/g) ?? []);
  return datas.sort().at(-1) ?? null;
}

export function marca(carro: Carro) {
  return carro.nome.split(" ")[0];
}

export function grupoComparacao(carro: Carro, todos: Carro[]) {
  const mesmoTipo = todos.filter((c) => c.tipo === carro.tipo);
  return mesmoTipo.length >= 3
    ? { carros: mesmoTipo, rotulo: `média dos ${mesmoTipo.length} carros tipo ${carro.tipo} da lista` }
    : { carros: todos, rotulo: `média dos ${todos.length} carros da lista` };
}

export function mediaPor1000(grupo: Carro[], sistema: Sistema) {
  return grupo.reduce((t, c) => t + c.risco.reclamacoesPor1000[sistema], 0) / grupo.length;
}

export function comparacaoComMedia(valor: number, media: number) {
  if (valor > media * 1.1) return "acima" as const;
  if (valor < media * 0.9) return "abaixo" as const;
  return "na média" as const;
}
