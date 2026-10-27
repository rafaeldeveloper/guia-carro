import { describe, expect, it } from "vitest";
import { buscarCarro, carros, type Carro } from "@/data/carros";
import type { PrecoMercado } from "@/data/precoMercado";
import { avaliarPreco, calcularFaixa, distribuirRotulos } from "./precoJusto";

const hoje = "2026-10-27";

function carroCom(precoMercado: PrecoMercado): Carro {
  return { ...buscarCarro("jeep-renegade-altitude-t270-2027")!, id: "teste", precoMercado };
}

const vazio: PrecoMercado = { fipe: null, fipeZeroKm: null, tabela: null, anuncios: null, promocoes: [] };

describe("calcularFaixa", () => {
  it("usa a tabela recente como base: alvo 4% abaixo, máximo 2% abaixo, mínimo 8% abaixo", () => {
    const f = calcularFaixa(carroCom({ ...vazio, tabela: { valor: 100000, fonte: "x", data: "2026-10-01" } }), hoje)!;
    expect(f.baseOrigem).toBe("preço de tabela");
    expect([f.min, f.alvo, f.max]).toEqual([92000, 96000, 98000]);
  });

  it("ignora tabela com mais de 6 meses e cai para a FIPE 0 km", () => {
    const f = calcularFaixa(
      carroCom({
        ...vazio,
        tabela: { valor: 150000, fonte: "x", data: "2026-04-26" },
        fipeZeroKm: { valor: 100000, mesReferencia: "2026-10", codigo: "1" },
      }),
      hoje,
    )!;
    expect(f.baseOrigem).toBe("FIPE 0 km");
    expect(f.base).toBe(100000);
  });

  it("usa a mediana dos anúncios quando não há tabela nem FIPE 0 km", () => {
    const f = calcularFaixa(
      carroCom({
        ...vazio,
        anuncios: { min: 90000, mediana: 95000, max: 99000, quantidade: 3, regiao: "CE", fonte: "x", data: hoje },
      }),
      hoje,
    )!;
    expect(f.baseOrigem).toBe("mediana dos anúncios");
    expect(f.base).toBe(95000);
  });

  it("usa promoção vigente sem troca se for menor que a base; ignora encerrada e com troca", () => {
    const tabela = { valor: 100000, fonte: "x", data: "2026-10-01" };
    const promo = (valor: number, validaAte: string | null, exigeTroca = false) => ({
      valor,
      descricao: "p",
      exigeTroca,
      validaAte,
      fonte: "x",
    });
    expect(calcularFaixa(carroCom({ ...vazio, tabela, promocoes: [promo(95000, hoje)] }), hoje)!.base).toBe(95000);
    expect(calcularFaixa(carroCom({ ...vazio, tabela, promocoes: [promo(95000, "2026-10-26")] }), hoje)!.base).toBe(
      100000,
    );
    expect(calcularFaixa(carroCom({ ...vazio, tabela, promocoes: [promo(95000, hoje, true)] }), hoje)!.base).toBe(
      100000,
    );
    expect(calcularFaixa(carroCom({ ...vazio, tabela, promocoes: [promo(95000, null)] }), hoje)!.base).toBe(100000);
  });

  it("sobe o mínimo até a FIPE do ano-modelo, sem passar do alvo", () => {
    const tabela = { valor: 100000, fonte: "x", data: "2026-10-01" };
    const fipe = (valor: number) => ({ valor, anoModelo: 2027, mesReferencia: "2026-10", codigo: "1" });
    expect(calcularFaixa(carroCom({ ...vazio, tabela, fipe: fipe(94000) }), hoje)!.min).toBe(94000);
    expect(calcularFaixa(carroCom({ ...vazio, tabela, fipe: fipe(97000) }), hoje)!.min).toBe(96000);
  });

  it("devolve null sem nenhuma referência de preço", () => {
    expect(calcularFaixa(carroCom(vazio), hoje)).toBeNull();
  });

  it("calcula faixa ordenada para todos os carros da base", () => {
    for (const carro of carros) {
      const f = calcularFaixa(carro, hoje);
      if (!f) continue;
      expect(f.min).toBeLessThanOrEqual(f.alvo);
      expect(f.alvo).toBeLessThan(f.max);
      expect(f.max).toBeLessThan(f.base);
    }
  });
});

describe("avaliarPreco", () => {
  const f = calcularFaixa(carroCom({ ...vazio, tabela: { valor: 100000, fonte: "x", data: "2026-10-01" } }), hoje)!;

  it.each([
    [92000, "otimo"],
    [92001, "bom"],
    [96000, "bom"],
    [96001, "media"],
    [98000, "media"],
    [98001, "caro"],
    [100000, "caro"],
  ])("R$ %d é %s", (preco, veredito) => {
    expect(avaliarPreco(f, preco).veredito).toBe(veredito);
  });

  it("desconta opcionais antes de comparar", () => {
    const a = avaliarPreco(f, 101000, 5000);
    expect(a.precoComparado).toBe(96000);
    expect(a.veredito).toBe("bom");
    expect(a.explicacao).toContain("opcionais");
  });
});

describe("casos reais", () => {
  it("Renegade: proposta de 127.035 fica na média; a promoção de 124.990 ficaria no limite, logo acima do alvo", () => {
    const f = calcularFaixa(buscarCarro("jeep-renegade-altitude-t270-2027")!, hoje)!;
    expect(f.base).toBe(129990);
    expect(avaliarPreco(f, 127035).veredito).toBe("media");
    expect(f.alvo).toBe(124790);
    expect(avaliarPreco(f, 124990).veredito).toBe("media");
    expect(avaliarPreco(f, 120857).veredito).toBe("otimo");
  });

  it("Avenger: 125.079 com pacote de 5.200 fica caro (menos de 2% de desconto)", () => {
    const f = calcularFaixa(buscarCarro("jeep-avenger-altitude-hybrid-2027")!, hoje)!;
    expect(f.base).toBe(121990);
    expect(avaliarPreco(f, 125079, 127190 - 121990).veredito).toBe("caro");
  });
});

describe("distribuirRotulos", () => {
  const semColisao = (esquerdas: number[], tamanho: number, largura: number) => {
    const ord = [...esquerdas].sort((a, b) => a - b);
    ord.forEach((e, i) => {
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e + tamanho).toBeLessThanOrEqual(largura);
      if (i > 0) expect(e - ord[i - 1]).toBeGreaterThanOrEqual(tamanho);
    });
  };

  it("mantém rótulos distantes centrados no marcador", () => {
    expect(distribuirRotulos([50, 150, 250], 300, 20)).toEqual([40, 140, 240]);
  });

  it("empurra rótulos próximos sem sobrepor e sem sair da caixa", () => {
    for (const largura of [280, 340, 700]) {
      const centros = [0.1, 0.42, 0.44, 0.45, 0.99].map((p) => p * largura);
      semColisao(distribuirRotulos(centros, largura, 20), 20, largura);
    }
  });

  it("devolve na ordem de entrada", () => {
    const r = distribuirRotulos([290, 10], 300, 20);
    expect(r[0]).toBeGreaterThan(r[1]);
  });
});
