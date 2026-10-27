import { describe, expect, it } from "vitest";
import {
  depreciacao,
  diasEntre,
  garantiaRestante,
  lerFichasSalvas,
  lerPrecoFipe,
  proximaRevisao,
  somarMeses,
} from "./ficha";

const hoje = "2026-10-27";
const intervalo = { intervaloKm: 12000, intervaloMeses: 12 };

describe("somarMeses", () => {
  it("ajusta o dia quando o mês de destino é mais curto", () => {
    expect(somarMeses("2024-01-31", 1)).toBe("2024-02-29");
    expect(somarMeses("2026-10-27", 60)).toBe("2031-10-27");
    expect(somarMeses("2026-11-15", 2)).toBe("2027-01-15");
  });
});

describe("proximaRevisao", () => {
  it("carro 0 km comprado hoje: conta da compra, vence por tempo em 12 meses", () => {
    const r = proximaRevisao({ dataCompra: hoje, kmAtual: 0, ultimaRevisao: null }, intervalo, hoje);
    expect(r).toMatchObject({
      baseInformada: false,
      kmAlvo: 12000,
      kmFaltando: 12000,
      dataAlvo: "2027-10-27",
      kmPorMes: null,
      vencePor: "tempo",
      data: "2027-10-27",
      atrasada: false,
    });
  });

  it("km passou do alvo: atrasada por km", () => {
    const r = proximaRevisao(
      { dataCompra: "2025-01-10", kmAtual: 25000, ultimaRevisao: { data: "2026-01-20", km: 12500 } },
      intervalo,
      hoje,
    );
    expect(r.kmAlvo).toBe(24500);
    expect(r.kmFaltando).toBe(-500);
    expect(r.atrasada).toBe(true);
    expect(r.vencePor).toBe("km");
    expect(r.data).toBe(hoje);
  });

  it("uso intenso: a projeção por km chega antes da data", () => {
    const r = proximaRevisao(
      { dataCompra: "2026-01-01", kmAtual: 18000, ultimaRevisao: { data: "2026-06-27", km: 10000 } },
      intervalo,
      hoje,
    );
    expect(diasEntre("2026-06-27", hoje)).toBe(122);
    expect(r.kmFaltando).toBe(4000);
    expect(r.vencePor).toBe("km");
    expect(r.dataEstimadaKm).toBe("2026-12-27");
    expect(r.data).toBe("2026-12-27");
    expect(r.kmPorMes).toBe(1996);
  });

  it("uso leve: vence por tempo", () => {
    const r = proximaRevisao({ dataCompra: "2026-04-27", kmAtual: 2000, ultimaRevisao: null }, intervalo, hoje);
    expect(r.vencePor).toBe("tempo");
    expect(r.data).toBe("2027-04-27");
    expect(r.atrasada).toBe(false);
  });

  it("data passou com km sobrando: atrasada por tempo", () => {
    const r = proximaRevisao(
      { dataCompra: "2025-01-01", kmAtual: 8000, ultimaRevisao: { data: "2025-09-01", km: 5000 } },
      intervalo,
      hoje,
    );
    expect(r.atrasada).toBe(true);
    expect(r.vencePor).toBe("tempo");
    expect(r.diasFaltando).toBeLessThan(0);
  });
});

describe("garantiaRestante", () => {
  it("5 anos a partir da compra, sem alerta", () => {
    expect(garantiaRestante(hoje, 5, hoje)).toMatchObject({
      fim: "2031-10-27",
      vencida: false,
      alerta: false,
      mesesRestantes: 59,
    });
  });

  it("alerta quando falta menos de 6 meses", () => {
    const g = garantiaRestante("2021-12-01", 5, hoje);
    expect(g.fim).toBe("2026-12-01");
    expect(g.alerta).toBe(true);
    expect(g.mesesRestantes).toBe(1);
  });

  it("sem alerta com exatamente 6 meses", () => {
    expect(garantiaRestante("2022-04-27", 5, hoje).alerta).toBe(false);
  });

  it("vencida", () => {
    const g = garantiaRestante("2021-01-10", 5, hoje);
    expect(g.vencida).toBe(true);
    expect(g.alerta).toBe(false);
    expect(g.mesesRestantes).toBe(0);
  });
});

describe("depreciacao", () => {
  it("comprado hoje: perda em R$ e %, sem valor por mês", () => {
    const d = depreciacao(125079, 116390, hoje, hoje);
    expect(d.reais).toBe(8689);
    expect(d.percentual).toBeCloseTo(0.0695, 4);
    expect(d.porMes).toBeNull();
  });

  it("divide a perda pelos meses desde a compra", () => {
    const d = depreciacao(128990, 109088, "2025-01-10", hoje);
    expect(d.reais).toBe(19902);
    expect(d.meses).toBeCloseTo(655 / 30.4375, 6);
    expect(d.porMes).toBeCloseTo(924.84, 1);
  });

  it("valorização dá número negativo", () => {
    expect(depreciacao(100000, 105000, "2026-01-27", hoje).reais).toBe(-5000);
  });
});

describe("lerPrecoFipe", () => {
  it("converte o texto da API", () => {
    expect(lerPrecoFipe("R$ 116.390,00")).toBe(116390);
    expect(lerPrecoFipe("")).toBeNull();
  });
});

describe("lerFichasSalvas", () => {
  it("ignora JSON inválido e itens incompletos", () => {
    expect(lerFichasSalvas(null)).toEqual([]);
    expect(lerFichasSalvas("{")).toEqual([]);
    const ok = {
      id: "a",
      carroId: null,
      nomeLivre: "Onix",
      anoModelo: 2024,
      dataCompra: "2024-05-02",
      kmAtual: 30000,
      precoPago: 90000,
      ultimaRevisao: { data: "2025-13-01", km: 10000 },
    };
    const lidos = lerFichasSalvas(JSON.stringify([ok, { id: "b" }, 3]));
    expect(lidos).toHaveLength(1);
    expect(lidos[0].ultimaRevisao).toBeNull();
  });
});
