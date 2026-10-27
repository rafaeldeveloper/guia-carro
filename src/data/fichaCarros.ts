export type Revisao = {
  intervaloKm: number;
  intervaloMeses: number;
  custos: { ateKm: number; total: number }[];
  fonte: string;
};

export type DadosFicha = {
  fipe: { codigo: string; porAno: Record<number, string> } | null;
  revisao: Revisao | null;
  observar: string[];
  montadora: { nome: string; site: string };
};

export const LINKS_RECALL = {
  senatran: "https://portalservicos.senatran.serpro.gov.br/",
  senacon: "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/consumidor/saude-e-seguranca/recall",
};

export const dadosFicha: Record<string, DadosFicha> = {
  "jeep-avenger-altitude-hybrid-2027": {
    fipe: { codigo: "017112-3", porAno: {} },
    revisao: {
      intervaloKm: 12000,
      intervaloMeses: 12,
      custos: [
        { ateKm: 36000, total: 2773 },
        { ateKm: 60000, total: 7204 },
      ],
      fonte: "Plano de revisões Jeep levantado em 2026-10-27",
    },
    observar: [
      "Luz do sistema híbrido ou start-stop parando de funcionar: peça a atualização de software na concessionária",
      "Trancos ou patinação do CVT em saídas e baixa velocidade",
      "Qualquer pane elétrica ou aviso no painel enquanto há garantia: registre com foto e abra chamado",
    ],
    montadora: { nome: "Jeep", site: "https://www.jeep.com.br/" },
  },
  "jeep-renegade-altitude-t270-2027": {
    fipe: { codigo: "017105-0", porAno: { 2025: "017103-4" } },
    revisao: {
      intervaloKm: 12000,
      intervaloMeses: 12,
      custos: [{ ateKm: 60000, total: 7287 }],
      fonte: "Plano de revisões Jeep levantado em 2026-10-27 (aproximado)",
    },
    observar: [
      "Nível do líquido de arrefecimento com o motor frio: se baixar sem vazamento visível, pode ser o trocador de calor contaminando o câmbio",
      "Ponteiro de temperatura subindo e consumo de óleo entre as revisões",
      "Trancos ou demora nas trocas de marcha",
    ],
    montadora: { nome: "Jeep", site: "https://www.jeep.com.br/" },
  },
  "peugeot-2008-active-2026": {
    fipe: { codigo: "024274-8", porAno: {} },
    revisao: null,
    observar: [
      "Avisos elétricos no painel e carro apagando",
      "Trancos ou patinação do CVT",
    ],
    montadora: { nome: "Peugeot", site: "https://www.peugeot.com.br/" },
  },
  "fiat-strada-ultra-2026": {
    fipe: { codigo: "001571-7", porAno: {} },
    revisao: null,
    observar: [
      "Trancos, patinação ou luz de câmbio no CVT, sobretudo entre 12 e 50 mil km",
      "Consumo de óleo e assobio da turbina",
      "Revisões em dia e na rede: atraso já foi motivo de garantia negada",
    ],
    montadora: { nome: "Fiat", site: "https://www.fiat.com.br/" },
  },
};

export function codigoFipe(carroId: string, anoModelo: number) {
  const fipe = dadosFicha[carroId]?.fipe;
  if (!fipe) return null;
  return fipe.porAno[anoModelo] ?? fipe.codigo;
}
