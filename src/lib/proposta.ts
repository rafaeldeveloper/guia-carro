export const TAXA_EMPRESTIMO_PADRAO = 0.015;
export const IOF_FIXO = 0.0038;
export const IOF_DIARIO = 0.000082;
export const IOF_TETO_DIAS = 365;
const DIAS_POR_MES = 30;
const TOLERANCIA_TAXA = 0.0005;

export type Proposta = {
  precoAVista: number;
  entrada: number;
  parcelas: number;
  valorParcela: number;
  parcelaFinal?: number;
  taxaAnunciada?: number;
  extrasForaDoPreco?: number;
};

export type Emprestimo = {
  valor: number;
  taxaMensal: number;
  parcelas: number;
  principal: number;
  iof: number;
  parcela: number;
  total: number;
  jurosEIof: number;
};

export type AnaliseProposta = {
  financiado: number;
  totalParcelas: number;
  totalPago: number;
  juros: number;
  taxaMensal: number;
  taxaAnual: number;
  taxaAnunciada: number | null;
  diferencaPP: number | null;
  taxaZeroComJuro: boolean;
  juroEscondido: boolean;
  emprestimo: Emprestimo;
  economiaComEmprestimo: number;
  taxaEmpate: number | null;
  perguntas: string[];
};

export function validarProposta(p: Proposta): string[] {
  const erros: string[] = [];
  if (!(p.precoAVista > 0)) erros.push("Informe o preço à vista.");
  if (!(p.entrada >= 0)) erros.push("A entrada não pode ser negativa.");
  if (p.precoAVista > 0 && p.entrada >= p.precoAVista) erros.push("A entrada precisa ser menor que o preço à vista.");
  if (!Number.isInteger(p.parcelas) || p.parcelas < 1) erros.push("Informe o número de parcelas.");
  if (!(p.valorParcela > 0)) erros.push("Informe o valor da parcela.");
  if (p.parcelaFinal !== undefined && p.parcelaFinal < 0) erros.push("A parcela final não pode ser negativa.");
  return erros;
}

export const parcelaPrice = (valor: number, taxa: number, n: number) =>
  taxa === 0 ? valor / n : (valor * taxa) / (1 - (1 + taxa) ** -n);

export const taxaAnualEquivalente = (mensal: number) => (1 + mensal) ** 12 - 1;

function valorPresente(taxa: number, n: number, parcela: number, final: number) {
  let vp = 0;
  for (let k = 1; k <= n; k++) vp += parcela / (1 + taxa) ** k;
  return vp + final / (1 + taxa) ** n;
}

function bissecao(f: (x: number) => number, a: number, b: number) {
  let fa = f(a);
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (Math.abs(b - a) < 1e-12) return m;
    if (fa * fm <= 0) b = m;
    else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

export function taxaImplicita(financiado: number, n: number, parcela: number, final = 0) {
  if (parcela * n + final <= financiado) return 0;
  return bissecao((r) => valorPresente(r, n, parcela, final) - financiado, 0, 1);
}

export function iofFinanciamento(principal: number, taxa: number, n: number) {
  const pmt = parcelaPrice(principal, taxa, n);
  let saldo = principal;
  let diario = 0;
  for (let k = 1; k <= n; k++) {
    const amortizacao = pmt - saldo * taxa;
    saldo -= amortizacao;
    diario += amortizacao * IOF_DIARIO * Math.min(k * DIAS_POR_MES, IOF_TETO_DIAS);
  }
  return principal * IOF_FIXO + diario;
}

export function simularEmprestimo(valor: number, taxaMensal: number, parcelas: number): Emprestimo {
  let principal = valor;
  for (let i = 0; i < 100; i++) {
    const proximo = valor + iofFinanciamento(principal, taxaMensal, parcelas);
    if (Math.abs(proximo - principal) < 1e-6) break;
    principal = proximo;
  }
  const parcela = parcelaPrice(principal, taxaMensal, parcelas);
  const total = parcela * parcelas;
  return {
    valor,
    taxaMensal,
    parcelas,
    principal,
    iof: principal - valor,
    parcela,
    total,
    jurosEIof: total - valor,
  };
}

export function taxaDeEmpate(valor: number, parcelas: number, totalProposta: number) {
  const custo = (r: number) => simularEmprestimo(valor, r, parcelas).total - totalProposta;
  if (custo(0) > 0) return null;
  return bissecao(custo, 0, 1);
}

const pp = (v: number) => `${(v * 100).toFixed(2).replace(".", ",")}%`;

function gerarPerguntas(p: Proposta, a: Omit<AnaliseProposta, "perguntas">) {
  const perguntas: string[] = [];
  if (a.taxaZeroComJuro) {
    perguntas.push(
      "A proposta diz taxa zero, mas entrada mais parcelas somam mais que o preço à vista. Qual é o preço à vista desse carro, sem financiamento? E qual o desconto se eu pagar tudo agora?",
    );
  } else if (a.juroEscondido && a.taxaAnunciada !== null) {
    perguntas.push(
      `A taxa anunciada é ${pp(a.taxaAnunciada)} ao mês, mas sobre o preço à vista a conta dá ${pp(a.taxaMensal)}. O preço usado no financiamento é o mesmo do à vista? Qual o desconto se eu pagar à vista?`,
    );
    perguntas.push("Qual é o CET (custo efetivo total) mensal e anual dessa proposta? O CET inclui tarifa de cadastro, registro e seguro?");
  }
  if (p.parcelaFinal) {
    perguntas.push("A parcela final (balão) pode ser refinanciada? Com qual taxa? O carro fica alienado até ela ser paga?");
  }
  if (p.extrasForaDoPreco) {
    perguntas.push("Os opcionais e o emplacamento estão incluídos no preço à vista ou são cobrados à parte?");
  }
  if (a.economiaComEmprestimo > 0) {
    perguntas.push(
      `Um empréstimo a ${pp(a.emprestimo.taxaMensal)} ao mês sai mais barato. Vocês cobrem o preço à vista se eu trouxer o dinheiro?`,
    );
  }
  perguntas.push("Pode me passar o CET por escrito, na proposta assinada pelo banco?");
  perguntas.push("O seguro (prestamista, garantia estendida, proteção) é opcional? Quanto cai a parcela sem ele?");
  perguntas.push("Se eu quitar antes, o desconto dos juros é proporcional (pela taxa do contrato)? Há tarifa de quitação?");
  return perguntas;
}

export function analisarProposta(p: Proposta, taxaEmprestimo = TAXA_EMPRESTIMO_PADRAO): AnaliseProposta {
  const financiado = p.precoAVista - p.entrada;
  const final = p.parcelaFinal ?? 0;
  const totalParcelas = p.parcelas * p.valorParcela + final;
  const totalPago = p.entrada + totalParcelas;
  const juros = totalPago - p.precoAVista;
  const taxaMensal = taxaImplicita(financiado, p.parcelas, p.valorParcela, final);
  const taxaAnunciada = p.taxaAnunciada ?? null;
  const emprestimo = simularEmprestimo(financiado, taxaEmprestimo, p.parcelas);
  const base = {
    financiado,
    totalParcelas,
    totalPago,
    juros,
    taxaMensal,
    taxaAnual: taxaAnualEquivalente(taxaMensal),
    taxaAnunciada,
    diferencaPP: taxaAnunciada === null ? null : (taxaMensal - taxaAnunciada) * 100,
    taxaZeroComJuro: taxaAnunciada === 0 && juros > 1,
    juroEscondido: taxaAnunciada !== null && taxaMensal - taxaAnunciada > TOLERANCIA_TAXA,
    emprestimo,
    economiaComEmprestimo: totalParcelas - emprestimo.total,
    taxaEmpate: taxaDeEmpate(financiado, p.parcelas, totalParcelas),
  };
  return { ...base, perguntas: gerarPerguntas(p, base) };
}
