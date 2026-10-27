export type PrecoMercado = {
  fipe: { valor: number; anoModelo: number; mesReferencia: string; codigo: string } | null;
  fipeZeroKm: { valor: number; mesReferencia: string; codigo: string } | null;
  tabela: { valor: number; fonte: string; data: string } | null;
  anuncios: {
    min: number;
    mediana: number;
    max: number;
    quantidade: number;
    regiao: string;
    fonte: string;
    data: string;
  } | null;
  promocoes: {
    valor: number;
    descricao: string;
    exigeTroca: boolean;
    validaAte: string | null;
    fonte: string;
  }[];
};

export const precosMercado: Record<string, PrecoMercado> = {
  "jeep-avenger-altitude-hybrid-2027": {
    fipe: { valor: 116390, anoModelo: 2027, mesReferencia: "2026-10", codigo: "017112-3" },
    fipeZeroKm: { valor: 121844, mesReferencia: "2026-10", codigo: "017112-3" },
    tabela: { valor: 121990, fonte: "Preço público Jeep, via Autos Segredos", data: "2026-10-11" },
    anuncios: {
      min: 119000,
      mediana: 120540,
      max: 129900,
      quantidade: 6,
      regiao: "Brasil (nenhum anúncio no CE com preço confirmado)",
      fonte: "9car, anúncios 26/27 sem quilometragem",
      data: "2026-10-27",
    },
    promocoes: [
      {
        valor: 117990,
        descricao: "À vista com usado na troca (bônus de R$ 4 mil), Preto Carbon, 100 unidades, exceto PB e MA",
        exigeTroca: true,
        validaAte: "2026-11-03",
        fonte: "Autos Segredos, 2026-10-11",
      },
    ],
  },
  "jeep-renegade-altitude-t270-2027": {
    fipe: { valor: 120857, anoModelo: 2027, mesReferencia: "2026-10", codigo: "017105-0" },
    fipeZeroKm: { valor: 127295, mesReferencia: "2026-10", codigo: "017105-0" },
    tabela: {
      valor: 129990,
      fonte: "Preço público Jeep, citado pela Motorshow",
      data: "2026-10-26",
    },
    anuncios: null,
    promocoes: [
      {
        valor: 124990,
        descricao: "À vista, Preto Carbon sem opcionais, 100 unidades",
        exigeTroca: false,
        validaAte: "2026-10-01",
        fonte: "Motorshow, 2026-09-17",
      },
    ],
  },
  "peugeot-2008-active-2026": {
    fipe: { valor: 115893, anoModelo: 2026, mesReferencia: "2026-10", codigo: "024274-8" },
    fipeZeroKm: { valor: 133187, mesReferencia: "2026-10", codigo: "024274-8" },
    tabela: { valor: 151990, fonte: "Preço sugerido Peugeot, via Tabela Carros", data: "2026-01-28" },
    anuncios: null,
    promocoes: [
      {
        valor: 133990,
        descricao: "À vista, R$ 20 mil abaixo da tabela, 30 unidades",
        exigeTroca: false,
        validaAte: "2026-02-04",
        fonte: "Tabela Carros e Canaltech, 2026-01-28",
      },
    ],
  },
  "fiat-strada-ultra-2026": {
    fipe: { valor: 130299, anoModelo: 2026, mesReferencia: "2026-10", codigo: "001571-7" },
    fipeZeroKm: { valor: 146310, mesReferencia: "2026-10", codigo: "001571-7" },
    tabela: { valor: 150450, fonte: "Site da Fiat, via Garagem360", data: "2026-02-19" },
    anuncios: null,
    promocoes: [],
  },
};
