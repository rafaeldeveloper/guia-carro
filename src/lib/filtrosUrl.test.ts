import { describe, expect, it } from "vitest";
import { lerFiltrosDaUrl, urlComparar, type Tipo } from "@/lib/filtrosUrl";

const opcoes = { tipos: ["Hatch", "Picape", "SUV", "Sedã"] as Tipo[], precoMin: 108000, precoMax: 320000 };

describe("lerFiltrosDaUrl", () => {
  it("sem parâmetros devolve busca vazia, sem tipo e orçamento no máximo", () => {
    expect(lerFiltrosDaUrl({}, opcoes)).toEqual({ termo: "", tipos: [], orcamento: 320000, exigidos: [] });
  });

  it("lê termo, tipo e orçamento", () => {
    expect(lerFiltrosDaUrl({ q: " creta ", tipo: "SUV", orcamento: "160000" }, opcoes)).toEqual({
      termo: "creta",
      tipos: ["SUV"],
      orcamento: 160000,
      exigidos: [],
    });
  });

  it("aceita tipo repetido, separado por vírgula, sem acento e em minúsculas", () => {
    expect(lerFiltrosDaUrl({ tipo: ["picape", "seda,suv"] }, opcoes).tipos).toEqual(["Picape", "SUV", "Sedã"]);
  });

  it("ignora tipo desconhecido", () => {
    expect(lerFiltrosDaUrl({ tipo: "conversível" }, opcoes).tipos).toEqual([]);
  });

  it("limita o orçamento à faixa de preços e ignora valor inválido", () => {
    expect(lerFiltrosDaUrl({ orcamento: "50000" }, opcoes).orcamento).toBe(108000);
    expect(lerFiltrosDaUrl({ orcamento: "999999" }, opcoes).orcamento).toBe(320000);
    expect(lerFiltrosDaUrl({ orcamento: "abc" }, opcoes).orcamento).toBe(320000);
    expect(lerFiltrosDaUrl({ orcamento: "-1" }, opcoes).orcamento).toBe(320000);
  });

  it("lê equipamentos exigidos e ignora os desconhecidos", () => {
    expect(lerFiltrosDaUrl({ equip: "couro,camera360,teto" }, opcoes).exigidos).toEqual(["camera360", "couro"]);
  });

  it("usa só o primeiro termo quando q vem repetido", () => {
    expect(lerFiltrosDaUrl({ q: ["polo", "onix"] }, opcoes).termo).toBe("polo");
  });
});

describe("urlComparar", () => {
  it("monta a URL só com os filtros informados", () => {
    expect(urlComparar({})).toBe("/comparar");
    expect(urlComparar({ tipo: "Sedã", orcamento: 160000 })).toBe("/comparar?tipo=Sed%C3%A3&orcamento=160000");
    expect(urlComparar({ q: "hb20" })).toBe("/comparar?q=hb20");
  });

  it("a URL montada é lida de volta pelos mesmos filtros", () => {
    const url = new URL(urlComparar({ q: "t200", tipo: "Sedã", orcamento: 150000 }), "http://x");
    const parametros = Object.fromEntries(url.searchParams);
    expect(lerFiltrosDaUrl(parametros, opcoes)).toEqual({ termo: "t200", tipos: ["Sedã"], orcamento: 150000, exigidos: [] });
  });
});
