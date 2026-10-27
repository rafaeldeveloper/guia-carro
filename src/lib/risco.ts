import type { Carro, Sistema } from "@/data/carros";

export const sistemas: Sistema[] = ["motor", "cambio", "eletrica"];

export const nomeSistema: Record<Sistema, string> = {
  motor: "Motor",
  cambio: "Câmbio",
  eletrica: "Parte elétrica",
};

export function pontosFrequencia(por1000: number) {
  if (por1000 < 0.5) return 1;
  if (por1000 < 1) return 2;
  if (por1000 < 2) return 3;
  if (por1000 < 3.5) return 4;
  return 5;
}

export function pontosGravidade(custoReparo: number, imobiliza: boolean) {
  let pontos = 1;
  if (custoReparo >= 5000) pontos = 2;
  if (custoReparo >= 10000) pontos = 3;
  if (custoReparo >= 20000) pontos = 4;
  if (custoReparo >= 30000) pontos = 5;
  return imobiliza ? Math.min(pontos + 1, 5) : pontos;
}

export function pontosPosVenda(garantiaAnos: number, notaReclameAquiMarca: number) {
  const garantia = garantiaAnos >= 5 ? 1 : garantiaAnos >= 3 ? 3 : 4;
  return garantia + (notaReclameAquiMarca < 7.5 ? 1 : 0);
}

export type NotaRisco = {
  sistemas: Record<Sistema, { frequencia: number; gravidade: number; pontos: number }>;
  posVenda: number;
  incerteza: number;
  nota: number;
};

export function calcularRisco(carro: Carro): NotaRisco {
  const { risco } = carro;
  const porSistema = Object.fromEntries(
    sistemas.map((s) => {
      const frequencia = pontosFrequencia(risco.reclamacoesPor1000[s]);
      const gravidade = pontosGravidade(risco.custoReparo[s], risco.imobiliza[s]);
      return [s, { frequencia, gravidade, pontos: (frequencia + gravidade) / 2 }];
    }),
  ) as NotaRisco["sistemas"];
  const posVenda = pontosPosVenda(carro.garantiaAnos, carro.notaReclameAquiMarca);
  const incerteza = risco.mesesDeDados < 12 ? 0.5 : 0;
  const soma = sistemas.reduce((t, s) => t + porSistema[s].pontos, 0) + posVenda;
  return { sistemas: porSistema, posVenda, incerteza, nota: soma / 2 + incerteza };
}

export function faixaRisco(nota: number) {
  if (nota < 4) return "baixo";
  if (nota < 5.5) return "médio";
  if (nota < 7) return "médio-alto";
  return "alto";
}
