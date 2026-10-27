import { describe, expect, it } from "vitest";
import {
  analisarProposta,
  simularEmprestimo,
  taxaAnualEquivalente,
  taxaDeEmpate,
  taxaImplicita,
  validarProposta,
} from "@/lib/proposta";

const TOL_PP = 0.02;
const emPP = (taxa: number) => taxa * 100;

const avenger = { precoAVista: 125079, entrada: 80000, parcelas: 24, valorParcela: 2492, taxaAnunciada: 0.0099 };

describe("taxa implícita sobre o preço à vista", () => {
  it.each([
    ["Avenger 24x, anunciado 0,99%", avenger, 2.41],
    ["Compass taxa zero 24x", { precoAVista: 139490, entrada: 84307, parcelas: 24, valorParcela: 3080 }, 2.48],
    ["Avenger taxa zero 12x", { precoAVista: 125079, entrada: 100064, parcelas: 12, valorParcela: 2681.54 }, 4.1],
    ["Renegade 60x", { precoAVista: 127035, entrada: 80000, parcelas: 60, valorParcela: 1445 }, 2.28],
  ])("%s", (_, proposta, esperado) => {
    expect(Math.abs(emPP(analisarProposta(proposta).taxaMensal) - esperado)).toBeLessThanOrEqual(TOL_PP);
  });

  it("é zero quando as parcelas somam o valor financiado", () => {
    expect(taxaImplicita(24000, 24, 1000)).toBe(0);
  });

  it("considera a parcela final (balão)", () => {
    const semBalao = taxaImplicita(50000, 24, 1500);
    const comBalao = taxaImplicita(50000, 24, 1500, 20000);
    expect(comBalao).toBeGreaterThan(semBalao);
  });
});

describe("analisarProposta", () => {
  const a = analisarProposta(avenger);

  it("calcula total, juros e taxa anual", () => {
    expect(a.financiado).toBe(45079);
    expect(a.totalParcelas).toBe(59808);
    expect(a.totalPago).toBe(139808);
    expect(a.juros).toBe(14729);
    expect(a.taxaAnual).toBeCloseTo(taxaAnualEquivalente(a.taxaMensal), 10);
    expect(emPP(a.taxaAnual)).toBeGreaterThan(32);
  });

  it("mostra a diferença entre a taxa anunciada e a real", () => {
    expect(a.diferencaPP).toBeCloseTo(emPP(a.taxaMensal) - 0.99, 6);
    expect(a.juroEscondido).toBe(true);
    expect(a.taxaZeroComJuro).toBe(false);
    expect(a.perguntas.some((p) => p.includes("CET (custo efetivo total)"))).toBe(true);
  });

  it("detecta taxa zero com juro escondido", () => {
    const compass = analisarProposta({
      precoAVista: 139490,
      entrada: 84307,
      parcelas: 24,
      valorParcela: 3080,
      taxaAnunciada: 0,
    });
    expect(compass.taxaZeroComJuro).toBe(true);
    expect(compass.perguntas[0]).toMatch(/taxa zero/);
  });

  it("não acusa taxa zero quando ela é real", () => {
    const real = analisarProposta({ precoAVista: 100000, entrada: 40000, parcelas: 12, valorParcela: 5000, taxaAnunciada: 0 });
    expect(real.taxaMensal).toBe(0);
    expect(real.taxaZeroComJuro).toBe(false);
    expect(real.juroEscondido).toBe(false);
  });

  it("sempre pergunta CET por escrito, seguro e quitação antecipada", () => {
    const textos = a.perguntas.join(" ");
    expect(textos).toMatch(/CET por escrito/);
    expect(textos).toMatch(/seguro/);
    expect(textos).toMatch(/quitar antes/);
  });

  it("pergunta sobre opcionais e balão quando existem", () => {
    const r = analisarProposta({ ...avenger, parcelaFinal: 10000, extrasForaDoPreco: 3000 });
    const textos = r.perguntas.join(" ");
    expect(textos).toMatch(/balão/);
    expect(textos).toMatch(/opcionais/);
  });

  it("compara com o empréstimo e a taxa de empate", () => {
    expect(a.economiaComEmprestimo).toBeGreaterThan(0);
    expect(a.taxaEmpate).not.toBeNull();
    expect(Math.abs(emPP(a.taxaEmpate!) - 2.14)).toBeLessThanOrEqual(TOL_PP);
  });
});

describe("empréstimo com IOF financiado", () => {
  it("47.035 a 1,5% em 24x", () => {
    const e = simularEmprestimo(47035, 0.015, 24);
    expect(e.parcela).toBeCloseTo(2415, -1);
    expect(e.iof).toBeCloseTo(1334, -1);
    expect(e.principal).toBeCloseTo(47035 + e.iof, 6);
    expect(e.jurosEIof).toBeCloseTo(e.total - 47035, 6);
  });

  it("limita os dias de IOF a 365", () => {
    const curto = simularEmprestimo(10000, 0.015, 12).iof / 10000;
    const longo = simularEmprestimo(10000, 0.015, 60).iof / 10000;
    expect(longo).toBeLessThan(0.0038 + 0.000082 * 365 + 1e-9);
    expect(longo).toBeGreaterThan(curto);
  });

  it("taxa de empate do Avenger: 45.079 contra 24x 2.492", () => {
    expect(Math.abs(emPP(taxaDeEmpate(45079, 24, 24 * 2492)!) - 2.14)).toBeLessThanOrEqual(TOL_PP);
  });

  it("sem empate quando nem o empréstimo a juro zero ganha", () => {
    expect(taxaDeEmpate(45079, 24, 45079)).toBeNull();
  });
});

describe("validarProposta", () => {
  it("aceita uma proposta completa", () => {
    expect(validarProposta(avenger)).toEqual([]);
  });

  it("recusa entrada maior que o preço e parcelas vazias", () => {
    const erros = validarProposta({ precoAVista: 100, entrada: 200, parcelas: 0, valorParcela: 0 });
    expect(erros).toHaveLength(3);
  });
});
