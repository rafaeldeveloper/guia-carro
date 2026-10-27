import { describe, expect, it } from "vitest";
import type { Carro } from "@/data/carros";
import { candidatos, motivos, sugerir, type CarroComNota, type Perguntas } from "@/lib/sugestoes";

function carro(id: string, c: Partial<Carro> & { nota: number }): CarroComNota {
  return {
    id,
    nome: id,
    anoModelo: "26/27",
    tipo: "SUV",
    preco: 150000,
    precoFonte: "",
    precoTabela: null,
    motor: "1.0",
    potenciaCv: 120,
    torqueKgfm: null,
    cambio: "AT",
    consumoGasolina: null,
    consumoEtanol: null,
    alturaMm: 1600,
    vaoLivreMm: 190,
    portaMalasL: 400,
    equipamentos: { camera360: false, couro: false, chavePresencial: null, freioEletronico: null, inducao: false },
    garantiaAnos: 3,
    notaReclameAquiMarca: 8,
    risco: {
      mesesDeDados: 24,
      referencia: null,
      vendasConsideradas: 1000,
      reclamacoesPor1000: { motor: 0, cambio: 0, eletrica: 0 },
      custoReparo: { motor: 0, cambio: 0, eletrica: 0 },
      imobiliza: { motor: false, cambio: false, eletrica: false },
      confianca: "media",
      principais: [],
    },
    fontes: [],
    ...c,
  };
}

const base = [
  carro("a", { nota: 4.25, preco: 138000, garantiaAnos: 3, vaoLivreMm: 150, potenciaCv: 116, tipo: "Hatch", portaMalasL: 300 }),
  carro("b", { nota: 4.25, preco: 160000, garantiaAnos: 5, vaoLivreMm: 190, potenciaCv: 120, portaMalasL: 422 }),
  carro("c", { nota: 5, preco: 127000, garantiaAnos: 5, vaoLivreMm: 186, potenciaCv: 176, portaMalasL: 320 }),
  carro("d", { nota: 7, preco: 138000, garantiaAnos: 3, vaoLivreMm: 175, potenciaCv: 130, portaMalasL: null }),
  carro("e", { nota: 3.25, preco: 200000, garantiaAnos: 10, vaoLivreMm: 161, potenciaCv: 175, portaMalasL: 440 }),
];

const pergunta = (p: Partial<Perguntas>): Perguntas => ({ tipo: null, ate: null, prioridade: "risco", ...p });

describe("candidatos", () => {
  it("filtra por tipo e preço e ordena pela prioridade", () => {
    expect(candidatos(base, pergunta({ ate: 160000 })).map((c) => c.id)).toEqual(["a", "b", "c", "d"]);
    expect(candidatos(base, pergunta({ tipo: "SUV", ate: 160000, prioridade: "preco" })).map((c) => c.id)).toEqual([
      "c",
      "d",
      "b",
    ]);
    expect(candidatos(base, pergunta({ prioridade: "espaco" })).map((c) => c.id)).toEqual(["e", "b", "c", "a", "d"]);
  });
});

describe("motivos", () => {
  const p = pergunta({ ate: 160000 });
  const grupo = candidatos(base, p);
  const escolhidos = grupo.slice(0, 3);

  it("compara a nota com a média do grupo filtrado", () => {
    expect(motivos(escolhidos[0], escolhidos, grupo, p)[0]).toBe("Nota 4,3, abaixo da média dos carros até R$ 160 mil (5,1)");
    expect(motivos(escolhidos[2], escolhidos, grupo, p)[0]).toBe("Nota 5,0, na média dos carros até R$ 160 mil (5,1)");
  });

  it("compara o preço com o mais barato das sugestões", () => {
    expect(motivos(escolhidos[2], escolhidos, grupo, p)[1]).toBe("O mais barato dos três");
    expect(motivos(escolhidos[1], escolhidos, grupo, p)[1]).toBe("R$ 33 mil acima do mais barato dos três");
  });

  it("destaca o maior vão livre ou a maior potência e a garantia", () => {
    expect(motivos(escolhidos[1], escolhidos, grupo, p)[2]).toBe("Maior vão livre dos três: 190 mm");
    expect(motivos(escolhidos[2], escolhidos, grupo, p)[2]).toBe("Mais potente dos três: 176 cv");
    expect(motivos(escolhidos[0], escolhidos, grupo, p)[2]).toBe("Garantia de só 3 anos");
  });

  it("fala do porta-malas quando a prioridade é espaço", () => {
    const pe = pergunta({ tipo: "SUV", prioridade: "espaco" });
    const g = candidatos(base, pe);
    expect(motivos(g[0], g.slice(0, 3), g, pe)[0]).toBe("Porta-malas de 440 L");
  });

  it("com uma só sugestão não compara preço e cita a garantia", () => {
    const pu = pergunta({ tipo: "Hatch" });
    const g = candidatos(base, pu);
    expect(motivos(g[0], g, g, pu)).toEqual(["Nota 4,3, na média dos hatches da lista (4,3)", "Garantia de só 3 anos"]);
  });
});

describe("sugerir", () => {
  it("devolve até três sugestões com no máximo três motivos", () => {
    const s = sugerir(base, pergunta({}));
    expect(s.map((x) => x.carro.id)).toEqual(["e", "a", "b"]);
    expect(s.every((x) => x.motivos.length > 0 && x.motivos.length <= 3)).toBe(true);
  });

  it("devolve lista vazia quando nada atende", () => {
    expect(sugerir(base, pergunta({ tipo: "Picape" }))).toEqual([]);
  });
});
