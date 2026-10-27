import { fotos } from "@/data/fotos";
import type { PrecoMercado } from "@/data/precoMercado";
import { lote1 } from "./lotes/lote-1";
import { lote2 } from "./lotes/lote-2";
import { lote3 } from "./lotes/lote-3";
import { lote4 } from "./lotes/lote-4";

export type Sistema = "motor" | "cambio" | "eletrica";

export type Confianca = "alta" | "media" | "baixa";

export type Carro = {
  id: string;
  nome: string;
  anoModelo: string;
  tipo: "SUV" | "Picape" | "Hatch" | "Sedã";
  preco: number;
  precoFonte: string;
  precoTabela: number | null;
  motor: string;
  potenciaCv: number;
  torqueKgfm: number | null;
  cambio: string;
  consumoGasolina: { cidade: number; estrada: number } | null;
  consumoEtanol: { cidade: number; estrada: number } | null;
  alturaMm: number;
  vaoLivreMm: number | null;
  portaMalasL: number | null;
  equipamentos: {
    camera360: boolean;
    couro: boolean;
    chavePresencial: boolean | null;
    freioEletronico: boolean | null;
    inducao: boolean;
  };
  garantiaAnos: number;
  notaReclameAquiMarca: number;
  risco: {
    mesesDeDados: number;
    referencia: string | null;
    vendasConsideradas: number;
    reclamacoesPor1000: Record<Sistema, number>;
    custoReparo: Record<Sistema, number>;
    imobiliza: Record<Sistema, boolean>;
    confianca: Confianca;
    principais: string[];
  };
  fontes: string[];
  precoMercado?: PrecoMercado;
  foto?: string;
};

const finalistas: Carro[] = [
  {
    id: "jeep-avenger-altitude-hybrid-2027",
    nome: "Jeep Avenger Altitude Hybrid",
    anoModelo: "26/27",
    tipo: "SUV",
    preco: 125079,
    precoFonte: "Preço de concessionária, 2026-10-26 (com pacote High Altitude)",
    precoTabela: 121990,
    motor: "1.0 T200 turbo flex + híbrido leve 12 V",
    potenciaCv: 116,
    torqueKgfm: 20.4,
    cambio: "CVT (7 marchas simuladas)",
    consumoGasolina: { cidade: 12.7, estrada: 13.5 },
    consumoEtanol: { cidade: 8.8, estrada: 9.4 },
    alturaMm: 1580,
    vaoLivreMm: 221,
    portaMalasL: 321,
    equipamentos: {
      camera360: false,
      couro: false,
      chavePresencial: true,
      freioEletronico: true,
      inducao: false,
    },
    garantiaAnos: 5,
    notaReclameAquiMarca: 7.8,
    risco: {
      mesesDeDados: 2,
      referencia: "Pulse, Fastback, 208 e 2008 com o mesmo T200 + CVT",
      vendasConsideradas: 170000,
      reclamacoesPor1000: { motor: 2.75, cambio: 0.67, eletrica: 0.57 },
      custoReparo: { motor: 8000, cambio: 36000, eletrica: 3000 },
      imobiliza: { motor: true, cambio: true, eletrica: true },
      confianca: "baixa",
      principais: [
        "Híbrido leve desligando sozinho (Pulse e Fastback), resolvido com atualização de software",
        "CVT falhando entre 12 e 50 mil km na Strada; CVT travando em P no Pulse",
        "Pane elétrica em carros da mesma plataforma CMP (2008)",
        "No próprio Avenger: atraso de entrega, acabamento e uma falha elétrica em carro 0 km",
      ],
    },
    fontes: [
      "Guia do Carro, 2026-08-13",
      "Itatiaia, 2026-10-14",
      "Diário do Nordeste, teste, 2026-10-21",
      "Inmetro/PBEV via Webmotors",
      "Reclame Aqui out/2024-out/2026 e emplacamentos Autoo/Fenabrave",
    ],
  },
  {
    id: "jeep-renegade-altitude-t270-2027",
    nome: "Jeep Renegade Altitude T270",
    anoModelo: "26/27",
    tipo: "SUV",
    preco: 127035,
    precoFonte: "Preço de concessionária, 2026-10-26",
    precoTabela: 129990,
    motor: "1.3 T270 turbo flex",
    potenciaCv: 176,
    torqueKgfm: 27.5,
    cambio: "Automático 6 marchas",
    consumoGasolina: { cidade: 10.9, estrada: 12.0 },
    consumoEtanol: { cidade: 7.6, estrada: 8.6 },
    alturaMm: 1700,
    vaoLivreMm: 186,
    portaMalasL: 320,
    equipamentos: {
      camera360: false,
      couro: false,
      chavePresencial: true,
      freioEletronico: true,
      inducao: false,
    },
    garantiaAnos: 5,
    notaReclameAquiMarca: 7.8,
    risco: {
      mesesDeDados: 24,
      referencia: null,
      vendasConsideradas: 89300,
      reclamacoesPor1000: { motor: 3.1, cambio: 0.7, eletrica: 0.3 },
      custoReparo: { motor: 20000, cambio: 30000, eletrica: 2000 },
      imobiliza: { motor: true, cambio: true, eletrica: false },
      confianca: "media",
      principais: [
        "Câmbio contaminado por líquido de arrefecimento (trocador de calor), conserto de R$ 25 a 35 mil; investigado pelo MPMG",
        "Consumo de óleo e superaquecimento do T270",
        "Multimídia trocada e start-stop falhando",
        "Garantia negada ou parcial",
      ],
    },
    fontes: [
      "Webmotors, ficha Renegade 2027",
      "Autoo, 2026-06-23",
      "Motorshow, 2026-09-17",
      "Reclame Aqui out/2024-out/2026 e emplacamentos Autoo/Fenabrave",
    ],
  },
  {
    id: "peugeot-2008-active-2026",
    nome: "Peugeot 2008 Active",
    anoModelo: "26/26",
    tipo: "SUV",
    preco: 138000,
    precoFonte: "Preço de concessionária, 2026-10-24",
    precoTabela: null,
    motor: "1.0 T200 turbo flex",
    potenciaCv: 130,
    torqueKgfm: null,
    cambio: "CVT (7 marchas simuladas)",
    consumoGasolina: null,
    consumoEtanol: null,
    alturaMm: 1549,
    vaoLivreMm: 175,
    portaMalasL: null,
    equipamentos: {
      camera360: false,
      couro: false,
      chavePresencial: false,
      freioEletronico: null,
      inducao: false,
    },
    garantiaAnos: 3,
    notaReclameAquiMarca: 7.2,
    risco: {
      mesesDeDados: 24,
      referencia: null,
      vendasConsideradas: 21700,
      reclamacoesPor1000: { motor: 3.3, cambio: 1.6, eletrica: 1.0 },
      custoReparo: { motor: 8000, cambio: 36000, eletrica: 3000 },
      imobiliza: { motor: true, cambio: true, eletrica: true },
      confianca: "media",
      principais: [
        "Pane elétrica e carro apagando com poucos km",
        "Peças com espera de 15 a 20 dias úteis",
        "Revenda fraca: perdeu cerca de 10% da FIPE em 12 meses",
      ],
    },
    fontes: [
      "Preço de concessionária, 2026-10-24",
      "Reclame Aqui out/2024-out/2026 e emplacamentos Autoo/Fenabrave",
    ],
  },
  {
    id: "fiat-strada-ultra-2026",
    nome: "Fiat Strada Ultra",
    anoModelo: "26/26",
    tipo: "Picape",
    preco: 138000,
    precoFonte: "Preço de concessionária, 2026-10-24",
    precoTabela: null,
    motor: "1.0 T200 turbo flex",
    potenciaCv: 130,
    torqueKgfm: null,
    cambio: "CVT (7 marchas simuladas)",
    consumoGasolina: null,
    consumoEtanol: null,
    alturaMm: 1595,
    vaoLivreMm: 210,
    portaMalasL: null,
    equipamentos: {
      camera360: false,
      couro: true,
      chavePresencial: false,
      freioEletronico: false,
      inducao: true,
    },
    garantiaAnos: 3,
    notaReclameAquiMarca: 7.2,
    risco: {
      mesesDeDados: 24,
      referencia: null,
      vendasConsideradas: 69000,
      reclamacoesPor1000: { motor: 0.5, cambio: 0.3, eletrica: 0.1 },
      custoReparo: { motor: 8000, cambio: 36000, eletrica: 3000 },
      imobiliza: { motor: true, cambio: true, eletrica: false },
      confianca: "baixa",
      principais: [
        "CVT falhando entre 12 e 50 mil km, conserto de R$ 32 a 40 mil fora da garantia",
        "Turbina com defeito e consumo de óleo",
        "Garantia negada por revisão atrasada ou fora da rede",
        "Concessionárias Fiat de Fortaleza mal avaliadas no Reclame Aqui",
      ],
    },
    fontes: [
      "Preço de concessionária, 2026-10-24",
      "Reclame Aqui out/2024-out/2026 e emplacamentos Autoo/Fenabrave (vendas T200 CVT estimadas em 22%; frota reclama pouco)",
    ],
  },
];

export const carros: Carro[] = [...finalistas, ...lote1, ...lote2, ...lote3, ...lote4].map((c) => ({
  ...c,
  foto: fotos[c.id]?.arquivo,
}));

export function buscarCarro(id: string) {
  return carros.find((c) => c.id === id);
}
