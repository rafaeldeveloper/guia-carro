export type CarroDoUsuario = {
  id: string;
  carroId: string | null;
  nomeLivre: string;
  anoModelo: number;
  dataCompra: string;
  kmAtual: number;
  precoPago: number;
  ultimaRevisao: { data: string; km: number } | null;
};

export const DIAS_POR_MES = 30.4375;
export const MESES_ALERTA_GARANTIA = 6;

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function utc(data: string) {
  return Date.parse(`${data}T00:00:00Z`);
}

export function diasEntre(de: string, ate: string) {
  return Math.round((utc(ate) - utc(de)) / 86_400_000);
}

export function somarDias(data: string, dias: number) {
  return new Date(utc(data) + dias * 86_400_000).toISOString().slice(0, 10);
}

export function somarMeses(data: string, meses: number) {
  const [a, m, d] = data.split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = total % 12;
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(d, ultimoDia))).toISOString().slice(0, 10);
}

export type ProximaRevisao = {
  baseInformada: boolean;
  kmAlvo: number;
  kmFaltando: number;
  dataAlvo: string;
  diasFaltando: number;
  kmPorMes: number | null;
  dataEstimadaKm: string | null;
  vencePor: "km" | "tempo";
  data: string;
  atrasada: boolean;
};

export function proximaRevisao(
  carro: Pick<CarroDoUsuario, "dataCompra" | "kmAtual" | "ultimaRevisao">,
  intervalo: { intervaloKm: number; intervaloMeses: number },
  hoje: string,
): ProximaRevisao {
  const base = carro.ultimaRevisao ?? { data: carro.dataCompra, km: 0 };
  const kmAlvo = base.km + intervalo.intervaloKm;
  const kmFaltando = kmAlvo - carro.kmAtual;
  const dataAlvo = somarMeses(base.data, intervalo.intervaloMeses);
  const diasFaltando = diasEntre(hoje, dataAlvo);

  const rodados = carro.kmAtual - base.km;
  const diasDesdeBase = diasEntre(base.data, hoje);
  const temRitmo = diasDesdeBase >= 30 && rodados > 0;
  const dataEstimadaKm = !temRitmo
    ? null
    : kmFaltando <= 0
      ? hoje
      : somarDias(hoje, Math.ceil((kmFaltando * diasDesdeBase) / rodados));

  const atrasada = kmFaltando <= 0 || diasFaltando < 0;
  const porKm = kmFaltando <= 0 || (dataEstimadaKm !== null && dataEstimadaKm < dataAlvo);
  return {
    baseInformada: carro.ultimaRevisao !== null,
    kmAlvo,
    kmFaltando,
    dataAlvo,
    diasFaltando,
    kmPorMes: temRitmo ? Math.round((rodados / diasDesdeBase) * DIAS_POR_MES) : null,
    dataEstimadaKm,
    vencePor: porKm ? "km" : "tempo",
    data: porKm && dataEstimadaKm ? dataEstimadaKm : dataAlvo,
    atrasada,
  };
}

export type Garantia = {
  fim: string;
  diasRestantes: number;
  mesesRestantes: number;
  vencida: boolean;
  alerta: boolean;
};

export function garantiaRestante(dataCompra: string, anos: number, hoje: string): Garantia {
  const fim = somarMeses(dataCompra, anos * 12);
  const diasRestantes = diasEntre(hoje, fim);
  const vencida = diasRestantes < 0;
  return {
    fim,
    diasRestantes,
    mesesRestantes: vencida ? 0 : Math.floor(diasRestantes / DIAS_POR_MES),
    vencida,
    alerta: !vencida && fim < somarMeses(hoje, MESES_ALERTA_GARANTIA),
  };
}

export type Depreciacao = {
  reais: number;
  percentual: number;
  meses: number;
  porMes: number | null;
};

export function depreciacao(precoPago: number, valorHoje: number, dataCompra: string, hoje: string): Depreciacao {
  const reais = precoPago - valorHoje;
  const meses = Math.max(0, diasEntre(dataCompra, hoje)) / DIAS_POR_MES;
  return {
    reais,
    percentual: reais / precoPago,
    meses,
    porMes: meses >= 1 ? reais / meses : null,
  };
}

export function lerPrecoFipe(texto: string) {
  const limpo = texto.replace(/[^\d,]/g, "").replace(",", ".");
  const n = Number(limpo);
  return limpo && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

const numero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const data = (v: unknown): v is string => typeof v === "string" && DATA.test(v) && !Number.isNaN(utc(v));

export function lerFichasSalvas(texto: string | null): CarroDoUsuario[] {
  if (!texto) return [];
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return [];
  }
  if (!Array.isArray(bruto)) return [];
  return bruto.flatMap((item): CarroDoUsuario[] => {
    if (typeof item !== "object" || item === null) return [];
    const c = item as Record<string, unknown>;
    const rev = c.ultimaRevisao as Record<string, unknown> | null | undefined;
    const ultimaRevisao = rev && data(rev.data) && numero(rev.km) ? { data: rev.data, km: rev.km } : null;
    if (
      typeof c.id !== "string" ||
      !(typeof c.carroId === "string" || c.carroId === null) ||
      typeof c.nomeLivre !== "string" ||
      !numero(c.anoModelo) ||
      !data(c.dataCompra) ||
      !numero(c.kmAtual) ||
      !numero(c.precoPago)
    )
      return [];
    return [
      {
        id: c.id,
        carroId: c.carroId,
        nomeLivre: c.nomeLivre,
        anoModelo: c.anoModelo,
        dataCompra: c.dataCompra,
        kmAtual: c.kmAtual,
        precoPago: c.precoPago,
        ultimaRevisao,
      },
    ];
  });
}
