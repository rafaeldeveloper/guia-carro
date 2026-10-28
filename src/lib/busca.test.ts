import { describe, expect, it } from "vitest";
import { carros } from "@/data/carros";
import {
  buscar,
  distancia,
  interpretar,
  removerDaConsulta,
  semFiltros,
  sugerir,
  sugestoesProximas,
} from "@/lib/busca";

const ids = (consulta: string) => buscar(consulta, carros).itens.map((i) => i.carro.id);
const nomes = (consulta: string) => buscar(consulta, carros).itens.map((i) => i.carro.nome);

describe("diagnóstico de 2026-10-27", () => {
  it("jeep acha os dois Jeep", () => {
    expect(nomes("jeep")).toEqual(["Jeep Avenger Altitude Hybrid", "Jeep Renegade Altitude T270"]);
  });

  it("vw e volks viram Volkswagen", () => {
    expect(nomes("vw")).toHaveLength(5);
    expect(nomes("vw").every((n) => n.startsWith("Volkswagen"))).toBe(true);
    expect(nomes("Volks")).toEqual(nomes("vw"));
  });

  it("várias palavras em qualquer ordem", () => {
    expect(ids("suv jeep")).toHaveLength(2);
    expect(ids("jeep suv").sort()).toEqual(ids("suv jeep").sort());
    expect(buscar("suv jeep", carros).interpretacao.tipos).toEqual(["SUV"]);
  });

  it("sedan, sedã e seda filtram o tipo Sedã", () => {
    for (const q of ["sedan", "sedã", "SEDA", "sedans"]) {
      const r = buscar(q, carros);
      expect(r.interpretacao.tipos).toEqual(["Sedã"]);
      expect(r.itens).toHaveLength(4);
    }
  });

  it("hb20s mostra o HB20 com aviso", () => {
    const r = buscar("hb20s", carros);
    expect(r.itens.map((i) => i.carro.id)).toEqual(["hyundai-hb20-limited-tgdi-2027"]);
    expect(r.interpretacao.avisos[0]).toMatch(/HB20S/);
  });

  it("corola é corrigido para corolla", () => {
    const r = buscar("corola", carros);
    expect(r.interpretacao.consultaCorrigida).toBe("corolla");
    expect(r.itens.map((i) => i.carro.nome).sort()).toEqual(["Toyota Corolla Cross XRE 2.0", "Toyota Corolla XEi 2.0"]);
  });

  it("120 mil vira orçamento, sem exigir texto", () => {
    const r = buscar("120 mil", carros);
    expect(r.interpretacao.orcamento).toBe(120000);
    expect(r.interpretacao.termos).toEqual([]);
    expect(r.itens.length).toBeGreaterThan(0);
    expect(r.itens.every((i) => i.carro.preco <= 120000)).toBe(true);
  });

  it("camera 360 e couro viram equipamentos exigidos", () => {
    expect(buscar("camera 360", carros).interpretacao.exigidos).toEqual(["camera360"]);
    expect(nomes("câmera 360")).toEqual(["Nissan Kicks Exclusive 1.0 Turbo"]);
    const couro = buscar("couro", carros);
    expect(couro.interpretacao.exigidos).toEqual(["couro"]);
    expect(couro.itens.length).toBe(carros.filter((c) => c.equipamentos.couro).length);
  });

  it("picape diesel acha as três picapes diesel", () => {
    expect(ids("picape diesel").sort()).toEqual([
      "chevrolet-s10-ltz-28-diesel-2026",
      "ram-rampage-rebel-22-diesel-2026",
      "toyota-hilux-srv-28-2026",
    ]);
  });

  it("turbo mantém os 23 e põe quem tem turbo no nome primeiro", () => {
    const r = buscar("turbo", carros);
    expect(r.itens).toHaveLength(23);
    expect(r.itens[0].pontos).toBeGreaterThan(r.itens[r.itens.length - 1].pontos);
    expect(r.itens[0].carro.nome).toMatch(/Turbo/);
  });
});

describe("sinônimos", () => {
  it("chevy e gm viram Chevrolet", () => {
    expect(nomes("chevy").every((n) => n.startsWith("Chevrolet"))).toBe(true);
    expect(nomes("gm")).toEqual(nomes("chevy"));
    expect(nomes("chevy")).toHaveLength(4);
  });

  it("hatchback e pickup", () => {
    expect(buscar("hatchback", carros).interpretacao.tipos).toEqual(["Hatch"]);
    expect(buscar("pickup", carros).interpretacao.tipos).toEqual(["Picape"]);
    expect(buscar("caminhonete", carros).interpretacao.tipos).toEqual(["Picape"]);
  });

  it("automático, AT e automatico casam com qualquer câmbio automático, CVT só com CVT", () => {
    expect(ids("automático")).toHaveLength(28);
    expect(ids("at")).toHaveLength(28);
    expect(ids("cvt").length).toBe(carros.filter((c) => c.cambio.includes("CVT")).length);
  });

  it("híbrido, hybrid e MHEV", () => {
    const esperado = ids("hibrido");
    expect(esperado).toHaveLength(3);
    expect(ids("hybrid")).toEqual(esperado);
    expect(ids("MHEV")).toEqual(esperado);
  });

  it("turbodiesel vira diesel", () => {
    expect(ids("turbodiesel").sort()).toEqual(ids("diesel").sort());
    expect(ids("diesel")).toHaveLength(3);
  });

  it("chave presencial, keyless, indução, carregador sem fio e freio de mão eletrônico", () => {
    expect(buscar("keyless", carros).interpretacao.exigidos).toEqual(["chavePresencial"]);
    expect(buscar("chave presencial", carros).interpretacao.exigidos).toEqual(["chavePresencial"]);
    expect(buscar("carregador sem fio", carros).interpretacao.exigidos).toEqual(["inducao"]);
    expect(buscar("indução", carros).interpretacao.exigidos).toEqual(["inducao"]);
    expect(buscar("freio de mão eletrônico", carros).interpretacao.exigidos).toEqual(["freioEletronico"]);
    expect(buscar("freio eletronico", carros).interpretacao.exigidos).toEqual(["freioEletronico"]);
  });

  it("junta palavras separadas que formam um modelo", () => {
    expect(nomes("t cross")).toEqual(["Volkswagen T-Cross Comfortline 200 TSI"]);
    expect(nomes("hr-v")).toEqual(["Honda HR-V EXL 1.5"]);
    expect(nomes("hrv")).toEqual(["Honda HR-V EXL 1.5"]);
  });
});

describe("erro de digitação", () => {
  it("distância com transposição", () => {
    expect(distancia("corola", "corolla")).toBe(1);
    expect(distancia("tarcker", "tracker")).toBe(1);
    expect(distancia("abc", "abc")).toBe(0);
  });

  it("corrige marcas, modelos e sinônimos", () => {
    expect(nomes("hiunday")).toHaveLength(2);
    expect(nomes("tarcker")).toEqual(["Chevrolet Tracker LTZ 1.0 Turbo AT"]);
    expect(nomes("tarck")).toEqual(["Chevrolet Tracker LTZ 1.0 Turbo AT"]);
    expect(buscar("picapi", carros).interpretacao.tipos).toEqual(["Picape"]);
    expect(buscar("hilux", carros).interpretacao.correcoes).toEqual([]);
    expect(buscar("preto", carros).interpretacao.correcoes).toEqual([]);
  });

  it("palavras de 3 letras não são corrigidas e 4 letras aceitam só 1 erro", () => {
    expect(buscar("toor", carros).interpretacao.consultaCorrigida).toBe("toro");
    expect(buscar("trro", carros).interpretacao.consultaCorrigida).toBe("toro");
    expect(buscar("tx", carros).interpretacao.correcoes).toEqual([]);
    expect(buscar("xyzw", carros).itens).toEqual([]);
  });

  it("aproximado pontua menos que exato", () => {
    const exato = buscar("corolla", carros).itens[0].pontos;
    const aproximado = buscar("corola", carros).itens[0].pontos;
    expect(aproximado).toBeLessThan(exato);
  });
});

describe("preço e tipo na frase", () => {
  it.each([
    ["até 120 mil", 120000],
    ["120k", 120000],
    ["120mil", 120000],
    ["abaixo de 150000", 150000],
    ["menos de 150.000", 150000],
    ["R$ 140 mil", 140000],
    ["ate 120", 120000],
    ["135,5 mil", 135500],
  ])("%s vira orçamento de %i", (consulta, valor) => {
    const i = interpretar(consulta, carros);
    expect(i.orcamento).toBe(valor);
    expect(i.termos).toEqual([]);
  });

  it("suv até 160 mil vira tipo e orçamento", () => {
    const r = buscar("suv até 160 mil", carros);
    expect(r.interpretacao.tipos).toEqual(["SUV"]);
    expect(r.interpretacao.orcamento).toBe(160000);
    expect(r.itens.every((i) => i.carro.tipo === "SUV" && i.carro.preco <= 160000)).toBe(true);
    expect(r.itens.length).toBeGreaterThan(0);
  });

  it("números de modelo e motor não viram preço", () => {
    expect(interpretar("2008", carros).orcamento).toBeNull();
    expect(interpretar("1.0", carros).orcamento).toBeNull();
    expect(interpretar("t200", carros).orcamento).toBeNull();
    expect(nomes("2008")).toEqual(["Peugeot 2008 Active"]);
  });

  it("filtros da tela somam com os da frase", () => {
    const r = buscar("suv", carros, { ...semFiltros, orcamento: 130000, exigidos: ["chavePresencial"] });
    expect(r.filtros).toEqual({ orcamento: 130000, vaoMin: 0, exigidos: ["chavePresencial"], tipos: ["SUV"] });
    expect(r.itens.map((i) => i.carro.id).sort()).toEqual([
      "jeep-avenger-altitude-hybrid-2027",
      "jeep-renegade-altitude-t270-2027",
    ]);
  });

  it("remove da frase o trecho de um filtro", () => {
    expect(removerDaConsulta("suv até 160 mil", "orcamento", carros)).toBe("suv");
    expect(removerDaConsulta("suv até 160 mil", "tipo:SUV", carros)).toBe("até 160 mil");
    expect(removerDaConsulta("jeep com câmera 360", "equip:camera360", carros)).toBe("jeep");
    expect(removerDaConsulta("jeep", "orcamento", carros)).toBe("jeep");
  });
});

describe("relevância", () => {
  it("marca/modelo vale mais que versão, que vale mais que motor", () => {
    const r = buscar("tsi", carros).itens;
    expect(r[0].carro.nome).toMatch(/TSI/);
    const pontos = Object.fromEntries(buscar("t270", carros).itens.map((i) => [i.carro.id, i.pontos]));
    expect(pontos["jeep-renegade-altitude-t270-2027"]).toBeGreaterThan(pontos["fiat-toro-volcano-t270-2026"] - 1);
    const onix = buscar("onix", carros).itens;
    expect(onix.map((i) => i.carro.nome)).toEqual(["Chevrolet Onix LT 1.0 Turbo AT", "Chevrolet Onix Plus LT 1.0 Turbo AT"]);
  });

  it("palavra inteira vale mais que prefixo", () => {
    const inteira = buscar("corolla", carros).itens[0].pontos;
    const prefixo = buscar("coro", carros).itens[0].pontos;
    expect(prefixo).toBeLessThan(inteira);
  });

  it("sem termo de texto todos ficam com zero pontos e na ordem original", () => {
    const r = buscar("", carros);
    expect(r.itens).toHaveLength(28);
    expect(r.itens.map((i) => i.carro.id)).toEqual(carros.map((c) => c.id));
  });
});

describe("autocomplete", () => {
  it("sugere modelos enquanto digita", () => {
    const s = sugerir("coro", carros);
    expect(s.map((x) => x.rotulo)).toContain("Toyota Corolla XEi 2.0");
    expect(s.length).toBeLessThanOrEqual(6);
  });

  it("sugere atalhos de tipo, combinação e preço", () => {
    expect(sugerir("su", carros).map((x) => x.rotulo)).toContain("SUVs");
    expect(sugerir("picape d", carros)[0].rotulo).toBe("Picapes diesel");
    expect(sugerir("120k", carros)[0]).toMatchObject({ rotulo: "Até R$ 120 mil", consulta: "120k" });
    expect(sugerir("vw", carros)[0].rotulo).toBe("Volkswagen");
  });

  it("não sugere nada para texto vazio e nunca atalho sem carro", () => {
    expect(sugerir("  ", carros)).toEqual([]);
    expect(sugerir("até 50 mil", carros).every((s) => !s.detalhe.startsWith("0 "))).toBe(true);
  });
});

describe("estado vazio", () => {
  it("sugere modelos próximos", () => {
    expect(buscar("zzzz", carros).itens).toEqual([]);
    expect(sugestoesProximas("kiks xyz", carros)[0]).toBe("Kicks");
    expect(sugestoesProximas("120 mil", carros)).toEqual([]);
  });
});
