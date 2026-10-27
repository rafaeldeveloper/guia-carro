import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { carros } from "@/data/carros";
import { LICENCAS_PERMITIDAS, fotos } from "@/data/fotos";

const publico = join(__dirname, "../../public");

describe("fotos", () => {
  it.each(Object.entries(fotos))("%s tem licença permitida e campos preenchidos", (id, f) => {
    expect(LICENCAS_PERMITIDAS).toContain(f.licenca);
    for (const campo of ["arquivo", "thumb", "arquivoCommons", "autor", "urlLicenca", "urlOrigem", "alt", "observacao", "alterada"] as const) {
      expect(f[campo].trim(), `${id}.${campo}`).not.toBe("");
    }
    expect(f.urlOrigem).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(f.urlLicenca).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(f.autor).not.toMatch(/[<>]/);
  });

  it.each(Object.entries(fotos))("%s aponta para arquivos que existem em public/fotos", (_, f) => {
    for (const caminho of [f.arquivo, f.thumb]) {
      expect(caminho).toMatch(/^\/fotos\//);
      expect(existsSync(join(publico, caminho)), caminho).toBe(true);
    }
  });

  it("todo item é de um carro da base e o carro recebe a foto", () => {
    for (const id of Object.keys(fotos)) {
      expect(carros.find((c) => c.id === id)?.foto).toBe(fotos[id].arquivo);
    }
  });
});
