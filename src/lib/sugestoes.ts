import type { Carro } from "@/data/carros";
import { comparacaoComMedia } from "@/lib/apresentacao";
import type { Tipo } from "@/lib/filtrosUrl";
import { formatarMilReais, formatarNota } from "@/lib/formato";

export type Prioridade = "risco" | "preco" | "espaco";

export type Perguntas = { tipo: Tipo | null; ate: number | null; prioridade: Prioridade };

export type CarroComNota = Carro & { nota: number };

export type Sugestao<C extends CarroComNota> = { carro: C; motivos: string[] };

export const plural: Record<Tipo, string> = { SUV: "SUVs", Hatch: "hatches", Sedã: "sedãs", Picape: "picapes" };

const quantos = (n: number) => (n === 2 ? "dos dois" : n === 3 ? "dos três" : `dos ${n}`);

const ordenacao: Record<Prioridade, (a: CarroComNota, b: CarroComNota) => number> = {
  risco: (a, b) => a.nota - b.nota || a.preco - b.preco,
  preco: (a, b) => a.preco - b.preco || a.nota - b.nota,
  espaco: (a, b) => (b.portaMalasL ?? -1) - (a.portaMalasL ?? -1) || a.nota - b.nota,
};

export function candidatos<C extends CarroComNota>(carros: C[], p: Perguntas) {
  return carros
    .filter((c) => p.tipo === null || c.tipo === p.tipo)
    .filter((c) => p.ate === null || c.preco <= p.ate)
    .sort(ordenacao[p.prioridade]);
}

export function rotuloGrupo(p: Pick<Perguntas, "tipo" | "ate">) {
  const tipo = p.tipo ? plural[p.tipo] : "carros";
  return p.ate ? `${tipo} até ${formatarMilReais(p.ate)}` : `${tipo} da lista`;
}

export function motivos<C extends CarroComNota>(carro: C, escolhidos: C[], grupo: C[], p: Perguntas): string[] {
  const media = grupo.reduce((t, c) => t + c.nota, 0) / grupo.length;
  const comparacao = comparacaoComMedia(carro.nota, media);
  const lista: string[] = [];

  if (p.prioridade === "espaco" && carro.portaMalasL !== null) {
    lista.push(`Porta-malas de ${carro.portaMalasL} L`);
  }

  lista.push(
    comparacao === "na média"
      ? `Nota ${formatarNota(carro.nota)}, na média dos ${rotuloGrupo(p)} (${formatarNota(media)})`
      : `Nota ${formatarNota(carro.nota)}, ${comparacao} da média dos ${rotuloGrupo(p)} (${formatarNota(media)})`,
  );

  if (escolhidos.length > 1) {
    const maisBarato = Math.min(...escolhidos.map((c) => c.preco));
    lista.push(
      carro.preco === maisBarato
        ? `O mais barato ${quantos(escolhidos.length)}`
        : `${formatarMilReais(carro.preco - maisBarato)} acima do mais barato ${quantos(escolhidos.length)}`,
    );
  }

  const garantia =
    carro.garantiaAnos <= 3 ? `Garantia de só ${carro.garantiaAnos} anos` : `Garantia de ${carro.garantiaAnos} anos`;
  const vaos = escolhidos.map((c) => c.vaoLivreMm ?? 0);
  const potencias = escolhidos.map((c) => c.potenciaCv);
  const unicoMaior = (valores: number[], v: number) => v === Math.max(...valores) && valores.filter((x) => x === v).length === 1;

  if (escolhidos.length > 1 && carro.vaoLivreMm !== null && unicoMaior(vaos, carro.vaoLivreMm)) {
    lista.push(`Maior vão livre ${quantos(escolhidos.length)}: ${carro.vaoLivreMm} mm`);
  } else if (escolhidos.length > 1 && unicoMaior(potencias, carro.potenciaCv)) {
    lista.push(`Mais potente ${quantos(escolhidos.length)}: ${carro.potenciaCv} cv`);
  }
  lista.push(garantia);

  return lista.slice(0, 3);
}

export function sugerir<C extends CarroComNota>(carros: C[], p: Perguntas, total = 3): Sugestao<C>[] {
  const grupo = candidatos(carros, p);
  const escolhidos = grupo.slice(0, total);
  return escolhidos.map((carro) => ({ carro, motivos: motivos(carro, escolhidos, grupo, p) }));
}
