import { describe, expect, it } from "vitest";
import { carros, buscarCarro } from "@/data/carros";
import { calcularRisco, pontosFrequencia, pontosGravidade, pontosPosVenda } from "./risco";

describe("pontosFrequencia", () => {
  it.each([
    [0, 1],
    [0.49, 1],
    [0.5, 2],
    [1, 3],
    [2, 4],
    [3.5, 5],
  ])("%d por 1.000 vale %d", (por1000, pontos) => {
    expect(pontosFrequencia(por1000)).toBe(pontos);
  });
});

describe("pontosGravidade", () => {
  it("sobe por faixa de custo de reparo", () => {
    expect(pontosGravidade(2000, false)).toBe(1);
    expect(pontosGravidade(8000, false)).toBe(2);
    expect(pontosGravidade(15000, false)).toBe(3);
    expect(pontosGravidade(25000, false)).toBe(4);
    expect(pontosGravidade(36000, false)).toBe(5);
  });

  it("soma 1 quando o defeito imobiliza o carro, sem passar de 5", () => {
    expect(pontosGravidade(3000, true)).toBe(2);
    expect(pontosGravidade(36000, true)).toBe(5);
  });
});

describe("pontosPosVenda", () => {
  it("premia garantia longa e penaliza marca mal avaliada", () => {
    expect(pontosPosVenda(5, 7.8)).toBe(1);
    expect(pontosPosVenda(3, 7.8)).toBe(3);
    expect(pontosPosVenda(3, 7.2)).toBe(4);
    expect(pontosPosVenda(1, 8)).toBe(4);
  });
});

describe("calcularRisco", () => {
  it("fica entre 2 e 10,5 para todos os carros", () => {
    for (const carro of carros) {
      const { nota } = calcularRisco(carro);
      expect(nota).toBeGreaterThanOrEqual(2);
      expect(nota).toBeLessThanOrEqual(10.5);
    }
  });

  it("acrescenta incerteza a modelo com menos de 12 meses de dados", () => {
    expect(calcularRisco(buscarCarro("jeep-avenger-altitude-hybrid-2027")!).incerteza).toBe(0.5);
    expect(calcularRisco(buscarCarro("jeep-renegade-altitude-t270-2027")!).incerteza).toBe(0);
  });

  it("reproduz a nota do 2008 Active", () => {
    const risco = calcularRisco(buscarCarro("peugeot-2008-active-2026")!);
    expect(risco.sistemas.cambio).toEqual({ frequencia: 3, gravidade: 5, pontos: 4 });
    expect(risco.posVenda).toBe(4);
    expect(risco.nota).toBe(7);
  });
});
