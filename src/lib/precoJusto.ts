import type { Carro } from "@/data/carros";
import { precosMercado, type PrecoMercado } from "@/data/precoMercado";
import { formatarReais } from "@/lib/formato";

export const DESCONTO_MINIMO = 0.02;
export const DESCONTO_ALVO = 0.04;
export const DESCONTO_MAXIMO = 0.08;
export const MESES_VALIDADE_TABELA = 6;

export type Veredito = "otimo" | "bom" | "media" | "caro";

export const rotuloVeredito: Record<Veredito, string> = {
  otimo: "Ótimo preço",
  bom: "Bom preço",
  media: "Na média",
  caro: "Caro",
};

export type Referencia = {
  nome: string;
  valor: number | null;
  usada: boolean;
  explicacao: string;
};

export type Marcador = { rotulo: string; valor: number };

export type FaixaPrecoJusto = {
  base: number;
  baseOrigem: string;
  min: number;
  alvo: number;
  max: number;
  referencias: Referencia[];
  marcadores: Marcador[];
};

export type Avaliacao = {
  precoComparado: number;
  veredito: Veredito;
  descontoSobreBase: number;
  explicacao: string;
};

export function mercadoDoCarro(carro: Carro): PrecoMercado | null {
  return carro.precoMercado ?? precosMercado[carro.id] ?? null;
}

function mesesAntes(hoje: string, meses: number) {
  const d = new Date(`${hoje}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - meses);
  return d.toISOString().slice(0, 10);
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function calcularFaixa(carro: Carro, hoje: string): FaixaPrecoJusto | null {
  const mercado = mercadoDoCarro(carro);
  if (!mercado) return null;
  const { fipe, fipeZeroKm, tabela, anuncios, promocoes } = mercado;

  const tabelaRecente = tabela !== null && tabela.data >= mesesAntes(hoje, MESES_VALIDADE_TABELA);
  let base: number | null = null;
  let baseOrigem = "";
  if (tabela && tabelaRecente) {
    base = tabela.valor;
    baseOrigem = "preço de tabela";
  } else if (fipeZeroKm) {
    base = fipeZeroKm.valor;
    baseOrigem = "FIPE 0 km";
  } else if (anuncios) {
    base = anuncios.mediana;
    baseOrigem = "mediana dos anúncios";
  }

  const vigentes = promocoes.filter((p) => p.validaAte !== null && p.validaAte >= hoje && !p.exigeTroca);
  const promo = vigentes.reduce<(typeof promocoes)[number] | null>((m, p) => (!m || p.valor < m.valor ? p : m), null);
  if (promo && (base === null || promo.valor < base)) {
    base = promo.valor;
    baseOrigem = "promoção vigente";
  }
  if (base === null) return null;

  const alvo = Math.round(base * (1 - DESCONTO_ALVO));
  const max = Math.round(base * (1 - DESCONTO_MINIMO));
  const pisoDesconto = Math.round(base * (1 - DESCONTO_MAXIMO));
  const pisoFipe = fipe ? fipe.valor : 0;
  const min = Math.min(alvo, Math.max(pisoDesconto, pisoFipe));

  const referencias: Referencia[] = [
    {
      nome: `FIPE ${fipe ? fipe.anoModelo : "do ano-modelo"}`,
      valor: fipe?.valor ?? null,
      usada: fipe !== null && min === fipe.valor,
      explicacao: fipe
        ? `Média de mercado do ano-modelo ${fipe.anoModelo} (${fipe.mesReferencia}, código ${fipe.codigo}). Serve de piso: pagar isso ou menos num 0 km é raro.`
        : "Não encontrada.",
    },
    {
      nome: "FIPE 0 km",
      valor: fipeZeroKm?.valor ?? null,
      usada: baseOrigem === "FIPE 0 km",
      explicacao: fipeZeroKm
        ? `Média pesquisada pela FIPE para o carro zero (${fipeZeroKm.mesReferencia}). Vira a base quando não há preço de tabela recente.`
        : "Não encontrada.",
    },
    {
      nome: "Tabela da montadora",
      valor: tabela?.valor ?? null,
      usada: baseOrigem === "preço de tabela",
      explicacao: tabela
        ? `${tabela.fonte}, ${tabela.data}.${tabelaRecente ? "" : ` Ignorada: tem mais de ${MESES_VALIDADE_TABELA} meses.`}`
        : "Não encontrada.",
    },
    {
      nome: "Anúncios de concessionárias",
      valor: anuncios?.mediana ?? null,
      usada: baseOrigem === "mediana dos anúncios",
      explicacao: anuncios
        ? `${anuncios.quantidade} anúncios de ${formatarReais(anuncios.min)} a ${formatarReais(anuncios.max)}, mediana ${formatarReais(anuncios.mediana)} (${anuncios.regiao}; ${anuncios.fonte}, ${anuncios.data}). Só para comparar: é preço pedido, não fechado.`
        : "Não encontrados.",
    },
    ...promocoes.map((p) => {
      const situacao =
        p.validaAte === null
          ? "validade desconhecida, não usada"
          : p.validaAte < hoje
            ? `encerrada em ${p.validaAte}`
            : p.exigeTroca
              ? `vigente até ${p.validaAte}, mas exige usado na troca, não usada`
              : `vigente até ${p.validaAte}`;
      return {
        nome: "Promoção",
        valor: p.valor,
        usada: p === promo && baseOrigem === "promoção vigente",
        explicacao: `${p.descricao} (${p.fonte}); ${situacao}.`,
      };
    }),
  ];

  const marcadores: Marcador[] = [
    fipe && { rotulo: `FIPE ${fipe.anoModelo}`, valor: fipe.valor },
    fipeZeroKm && { rotulo: "FIPE 0 km", valor: fipeZeroKm.valor },
    tabela && { rotulo: "Tabela", valor: tabela.valor },
    anuncios && { rotulo: "Anúncios", valor: anuncios.mediana },
    { rotulo: "Alvo", valor: alvo },
  ].filter((m): m is Marcador => Boolean(m));

  return { base, baseOrigem, min, alvo, max, referencias, marcadores };
}

export function avaliarPreco(faixa: FaixaPrecoJusto, precoOfertado: number, opcionais = 0): Avaliacao {
  const precoComparado = precoOfertado - opcionais;
  const descontoSobreBase = 1 - precoComparado / faixa.base;
  const veredito: Veredito =
    precoComparado <= faixa.min
      ? "otimo"
      : precoComparado <= faixa.alvo
        ? "bom"
        : precoComparado <= faixa.max
          ? "media"
          : "caro";
  const desconto =
    descontoSobreBase >= 0
      ? `${pct(descontoSobreBase)} abaixo da base (${faixa.baseOrigem}, ${formatarReais(faixa.base)})`
      : `${pct(-descontoSobreBase)} acima da base (${faixa.baseOrigem}, ${formatarReais(faixa.base)})`;
  const opc = opcionais > 0 ? ` depois de descontar ${formatarReais(opcionais)} de opcionais` : "";
  return {
    precoComparado,
    veredito,
    descontoSobreBase,
    explicacao: `${formatarReais(precoComparado)}${opc} fica ${desconto}.`,
  };
}

export function distribuirRotulos(centros: number[], largura: number, tamanho: number, folga = 4): number[] {
  const ordem = centros.map((c, i) => [c, i] as const).sort((a, b) => a[0] - b[0]);
  const max = Math.max(0, largura - tamanho);
  const esquerdas = ordem.map(([c]) => Math.min(Math.max(c - tamanho / 2, 0), max));
  for (let i = 1; i < esquerdas.length; i++) esquerdas[i] = Math.max(esquerdas[i], esquerdas[i - 1] + tamanho + folga);
  for (let i = esquerdas.length - 1; i >= 0; i--) {
    const limite = i === esquerdas.length - 1 ? max : esquerdas[i + 1] - tamanho - folga;
    esquerdas[i] = Math.max(Math.min(esquerdas[i], limite), 0);
  }
  const resultado = new Array<number>(centros.length);
  ordem.forEach(([, i], k) => (resultado[i] = esquerdas[k]));
  return resultado;
}
