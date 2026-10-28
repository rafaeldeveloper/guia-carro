import type { Carro } from "@/data/carros";

type Tipo = Carro["tipo"];
type Equipamento = keyof Carro["equipamentos"];

export type Sinonimo =
  | { termos: string[]; tipo: Tipo }
  | { termos: string[]; equipamento: Equipamento }
  | { termos: string[]; busca: string[]; rotulo: string; aviso?: string };

export const marcas: { nome: string; apelidos: string[] }[] = [
  { nome: "Chevrolet", apelidos: ["chevy", "gm", "chevrolé"] },
  { nome: "Citroën", apelidos: ["citroen"] },
  { nome: "Fiat", apelidos: [] },
  { nome: "Honda", apelidos: [] },
  { nome: "Hyundai", apelidos: [] },
  { nome: "Jeep", apelidos: [] },
  { nome: "Nissan", apelidos: [] },
  { nome: "Peugeot", apelidos: [] },
  { nome: "Ram", apelidos: ["dodge"] },
  { nome: "Renault", apelidos: [] },
  { nome: "Toyota", apelidos: [] },
  { nome: "Volkswagen", apelidos: ["vw", "volks", "volkswagem"] },
];

export const modelosCompostos = ["Onix Plus", "Corolla Cross"];

export const sinonimos: Sinonimo[] = [
  { termos: ["suv", "suvs", "utilitario", "utilitarios", "crossover"], tipo: "SUV" },
  { termos: ["hatch", "hatches", "hatchs", "hatchback", "hatchbacks"], tipo: "Hatch" },
  { termos: ["sedan", "sedans", "seda", "sedas", "sedam"], tipo: "Sedã" },
  { termos: ["picape", "picapes", "pickup", "pickups", "pick up", "caminhonete", "caminhonetes"], tipo: "Picape" },

  {
    termos: ["camera 360", "cameras 360", "camera de 360", "camera 360 graus", "360", "360 graus", "visao 360"],
    equipamento: "camera360",
  },
  { termos: ["couro", "banco de couro", "bancos de couro", "bancos em couro", "banco em couro"], equipamento: "couro" },
  {
    termos: ["chave presencial", "presencial", "keyless", "partida sem chave", "entrada sem chave"],
    equipamento: "chavePresencial",
  },
  {
    termos: [
      "freio eletronico",
      "freio de mao eletronico",
      "freio de estacionamento eletronico",
      "freio eletrico",
      "epb",
      "auto hold",
      "autohold",
    ],
    equipamento: "freioEletronico",
  },
  {
    termos: [
      "inducao",
      "carregador por inducao",
      "carregador de inducao",
      "carregador sem fio",
      "carregamento sem fio",
      "wireless",
    ],
    equipamento: "inducao",
  },

  {
    termos: ["automatico", "automatica", "automaticos", "automaticas", "at", "cambio automatico"],
    busca: ["automatico", "automatizado", "cvt"],
    rotulo: "automático",
  },
  { termos: ["dupla embreagem", "dct", "edc"], busca: ["embreagem", "edc"], rotulo: "dupla embreagem" },
  {
    termos: ["hibrido", "hibridos", "hibrida", "hybrid", "mhev", "hibrido leve", "mild hybrid"],
    busca: ["hibrido", "hybrid"],
    rotulo: "híbrido",
  },
  { termos: ["diesel", "turbodiesel", "turbo diesel"], busca: ["diesel", "turbodiesel"], rotulo: "diesel" },
  { termos: ["flex", "etanol", "alcool"], busca: ["flex"], rotulo: "flex" },
  {
    termos: ["hb20s", "hb20 s", "hb 20s", "hb 20 s"],
    busca: ["hb20"],
    rotulo: "HB20",
    aviso: "O HB20S (sedã) não está na lista; mostrando o HB20 hatch.",
  },
];

export const palavrasVazias = [
  "a", "as", "o", "os", "e", "de", "da", "do", "das", "dos", "com", "sem", "em", "um", "uma",
  "para", "pra", "que", "tem", "ter", "carro", "carros", "modelo", "modelos", "ate", "abaixo", "menos", "reais",
];

export const atalhos: { rotulo: string; consulta: string }[] = [
  { rotulo: "SUVs", consulta: "suv" },
  { rotulo: "Hatches", consulta: "hatch" },
  { rotulo: "Sedãs", consulta: "sedan" },
  { rotulo: "Picapes", consulta: "picape" },
  { rotulo: "Picapes diesel", consulta: "picape diesel" },
  { rotulo: "Híbridos", consulta: "hibrido" },
  { rotulo: "Com câmera 360°", consulta: "camera 360" },
  { rotulo: "Com banco de couro", consulta: "couro" },
  { rotulo: "Com carregador por indução", consulta: "inducao" },
  { rotulo: "Até R$ 120 mil", consulta: "ate 120 mil" },
  { rotulo: "Até R$ 160 mil", consulta: "ate 160 mil" },
  { rotulo: "SUVs até R$ 160 mil", consulta: "suv ate 160 mil" },
];
