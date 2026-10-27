const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const formatarReais = (valor: number) => reais.format(valor);
export const formatarNumero = (valor: number) => decimal.format(valor);

export function formatarSimNao(valor: boolean | null) {
  if (valor === null) return "não confirmado";
  return valor ? "sim" : "não";
}

const umaCasa = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatarNota = (valor: number) => umaCasa.format(valor);

export function formatarMilReais(valor: number) {
  return valor >= 1000 ? `R$ ${decimal.format(Math.round(valor / 100) / 10)} mil` : formatarReais(valor);
}
