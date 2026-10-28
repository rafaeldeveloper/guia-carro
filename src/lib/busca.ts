import type { Carro } from "@/data/carros";
import { atalhos, marcas, modelosCompostos, palavrasVazias, sinonimos } from "@/data/sinonimos";
import { formatarMilReais } from "@/lib/formato";

export type Tipo = Carro["tipo"];
export type Equipamento = keyof Carro["equipamentos"];
export type CarroPesquisavel = Pick<
  Carro,
  "id" | "nome" | "tipo" | "preco" | "motor" | "cambio" | "equipamentos" | "vaoLivreMm"
>;

export const equipamentos: { chave: Equipamento; rotulo: string }[] = [
  { chave: "camera360", rotulo: "Câmera 360°" },
  { chave: "couro", rotulo: "Banco de couro" },
  { chave: "chavePresencial", rotulo: "Chave presencial" },
  { chave: "freioEletronico", rotulo: "Freio de mão eletrônico" },
  { chave: "inducao", rotulo: "Carregador por indução" },
];

const pluralTipo: Record<Tipo, string> = { SUV: "SUVs", Hatch: "Hatches", Sedã: "Sedãs", Picape: "Picapes" };

export const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const unicos = <T>(lista: T[]) => [...new Set(lista)];

export function distancia(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const limiteErro = (palavra: string) => (palavra.length >= 7 ? 2 : palavra.length >= 4 ? 1 : 0);

function palavrasDoCampo(texto: string) {
  const saida = new Set<string>();
  for (const bruto of normalizar(texto).split(/[^a-z0-9.-]+/)) {
    const p = bruto.replace(/^[.-]+|[.-]+$/g, "");
    if (!p || palavrasVazias.includes(p)) continue;
    saida.add(p.replace(/-/g, ""));
    if (p.includes("-")) p.split("-").filter(Boolean).forEach((x) => saida.add(x));
  }
  return [...saida];
}

type Campo = "marca" | "modelo" | "versao" | "tipo" | "motor" | "cambio" | "combustivel" | "equipamento";

const pesoCampo: Record<Campo, number> = {
  marca: 100,
  modelo: 100,
  versao: 60,
  tipo: 50,
  motor: 30,
  cambio: 30,
  combustivel: 30,
  equipamento: 20,
};

type Indexado<C> = { carro: C; marca: string; modelo: string; campos: [Campo, string[]][] };

function indexar<C extends CarroPesquisavel>(c: C): Indexado<C> {
  const nome = normalizar(c.nome);
  const marca = marcas.find((m) => nome.startsWith(`${normalizar(m.nome)} `));
  const resto = marca ? c.nome.slice(marca.nome.length).trim() : c.nome;
  const restoN = normalizar(resto);
  const composto = modelosCompostos.find((m) => restoN === normalizar(m) || restoN.startsWith(`${normalizar(m)} `));
  const modelo = composto ? resto.slice(0, composto.length) : resto.split(/\s+/)[0];
  const versao = resto.slice(modelo.length).trim();
  const motor = normalizar(c.motor);
  const combustivel = motor.includes("diesel") ? "diesel" : motor.includes("hibrido") ? "flex hibrido" : motor.includes("flex") ? "flex" : "";
  const equipamento = equipamentos
    .filter((e) => c.equipamentos[e.chave] === true)
    .map((e) => e.rotulo)
    .join(" ");
  return {
    carro: c,
    marca: marca?.nome ?? "",
    modelo,
    campos: [
      ["marca", palavrasDoCampo(marca?.nome ?? "")],
      ["modelo", palavrasDoCampo(modelo)],
      ["versao", palavrasDoCampo(versao)],
      ["tipo", palavrasDoCampo(c.tipo)],
      ["motor", palavrasDoCampo(c.motor)],
      ["cambio", palavrasDoCampo(c.cambio)],
      ["combustivel", palavrasDoCampo(combustivel)],
      ["equipamento", palavrasDoCampo(equipamento)],
    ],
  };
}

type Conceito =
  | { tokens: string[]; tipo: Tipo }
  | { tokens: string[]; equipamento: Equipamento }
  | { tokens: string[]; busca: string[]; rotulo: string; aviso?: string };

const tokensDe = (frase: string) => normalizar(frase).split(/\s+/).filter(Boolean).map((t) => t.replace(/-/g, ""));

const conceitos: Conceito[] = [
  ...sinonimos.flatMap((s) => s.termos.map((t) => ({ ...s, tokens: tokensDe(t) }))),
  ...marcas.flatMap((m) =>
    m.apelidos.map((a) => ({ tokens: tokensDe(a), busca: [normalizar(m.nome)], rotulo: m.nome })),
  ),
].sort((a, b) => b.tokens.length - a.tokens.length);

type Base<C> = { indice: Indexado<C>[]; vocabulario: string[]; correcao: string[]; modelos: string[] };

const cache = new WeakMap<object, Base<CarroPesquisavel>>();

function base<C extends CarroPesquisavel>(carros: C[]): Base<C> {
  const pronta = cache.get(carros);
  if (pronta) return pronta as Base<C>;
  const indice = carros.map(indexar);
  const modelos = unicos(indice.flatMap((i) => palavrasDoCampo(i.modelo)));
  const nomesMarcas = marcas.map((m) => normalizar(m.nome));
  const palavrasConceito = unicos(conceitos.flatMap((c) => c.tokens));
  const correcao = unicos([...modelos, ...nomesMarcas, ...palavrasConceito]).filter((p) => /[a-z]/.test(p));
  const vocabulario = unicos([...indice.flatMap((i) => i.campos.flatMap(([, p]) => p)), ...palavrasConceito]);
  const nova: Base<C> = { indice, vocabulario, correcao, modelos };
  cache.set(carros, nova as Base<CarroPesquisavel>);
  return nova;
}

export type TermoTexto = { original: string; palavras: string[]; rotulo: string; corrigido: boolean; aviso?: string };

export type ChaveFiltro = "orcamento" | `tipo:${Tipo}` | `equip:${Equipamento}`;

export type Interpretacao = {
  termos: TermoTexto[];
  tipos: Tipo[];
  orcamento: number | null;
  exigidos: Equipamento[];
  correcoes: { de: string; para: string }[];
  consultaCorrigida: string | null;
  avisos: string[];
  origem: Partial<Record<ChaveFiltro, number[]>>;
};

type Token = { original: string; norma: string };

function tokenizar(consulta: string): Token[] {
  return consulta
    .replace(/(r\$)(?=\d)/gi, "$1 ")
    .replace(/(\d)(mil)\b/gi, "$1 $2")
    .split(/[\s;]+|,(?!\d)/)
    .filter(Boolean)
    .map((original) => {
      const n = normalizar(original);
      const norma = n === "r$" ? n : n.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "").replace(/-/g, "");
      return { original, norma };
    })
    .filter((t) => t.norma);
}

const prefixosPreco = [["abaixo", "de"], ["menos", "de"], ["no", "maximo"], ["por", "ate"], ["ate"], ["maximo"], ["max"], ["teto"]];

function lerNumero(t: string): { valor: number; mil: boolean } | null {
  const comMil = t.match(/^(\d+(?:[.,]\d+)?)(k|mil)$/);
  if (comMil) return { valor: parseFloat(comMil[1].replace(",", ".")) * 1000, mil: true };
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return { valor: Number(t.replace(/\./g, "")), mil: false };
  if (/^\d+(,\d+)?$/.test(t)) return { valor: parseFloat(t.replace(",", ".")), mil: false };
  return null;
}

function lerPreco(tokens: Token[], i: number): { valor: number; usados: number[] } | null {
  let j = i;
  const prefixo = prefixosPreco.find((p) => p.every((palavra, k) => tokens[i + k]?.norma === palavra));
  if (prefixo) j += prefixo.length;
  const real = tokens[j]?.norma === "r$";
  if (real) j++;
  const numero = tokens[j] && lerNumero(tokens[j].norma);
  if (!numero) return null;
  j++;
  const sufixo = ["mil", "k"].includes(tokens[j]?.norma ?? "");
  if (sufixo) j++;
  if (tokens[j]?.norma === "reais") j++;
  const mil = numero.mil || sufixo;
  if (!mil && !prefixo && !real && numero.valor < 50000) return null;
  const valor = mil ? numero.valor * (sufixo ? 1000 : 1) : numero.valor < 1000 ? numero.valor * 1000 : numero.valor;
  if (valor < 10000) return null;
  return { valor: Math.round(valor), usados: Array.from({ length: j - i }, (_, k) => i + k) };
}

function conhecida(palavra: string, b: Base<CarroPesquisavel>) {
  return (
    palavrasVazias.includes(palavra) ||
    b.vocabulario.some((v) => v.startsWith(palavra) || (palavra.length >= 3 && v.includes(palavra)))
  );
}

function corrigir(palavra: string, b: Base<CarroPesquisavel>) {
  const limite = limiteErro(palavra);
  if (!limite || !/^[a-z]+$/.test(palavra) || conhecida(palavra, b)) return null;
  let melhor: { palavra: string; d: number } | null = null;
  for (const v of b.correcao) {
    const inteira = Math.abs(v.length - palavra.length) <= limite ? distancia(palavra, v) : Infinity;
    const inicio = v.length > palavra.length ? distancia(palavra, v.slice(0, palavra.length)) + 0.5 : Infinity;
    const d = Math.min(inteira, inicio <= 1.5 ? inicio : Infinity);
    if (d <= limite + 0.5 && (!melhor || d < melhor.d)) melhor = { palavra: v, d };
  }
  return melhor?.palavra ?? null;
}

export function interpretar(consulta: string, carros: CarroPesquisavel[]): Interpretacao {
  const b = base(carros);
  const tokens = tokenizar(consulta);
  const usado = tokens.map(() => false);
  const origem: Interpretacao["origem"] = {};
  const marcar = (chave: ChaveFiltro, indices: number[]) => {
    indices.forEach((k) => (usado[k] = true));
    origem[chave] = [...(origem[chave] ?? []), ...indices];
  };
  let orcamento: number | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const preco = lerPreco(tokens, i);
    if (!preco) continue;
    orcamento = orcamento === null ? preco.valor : Math.min(orcamento, preco.valor);
    marcar("orcamento", preco.usados);
    i = preco.usados[preco.usados.length - 1];
  }

  const correcoes: Interpretacao["correcoes"] = [];
  const norma = tokens.map((t, i) => {
    if (usado[i]) return t.norma;
    const certa = corrigir(t.norma, b);
    if (!certa) return t.norma;
    correcoes.push({ de: t.norma, para: certa });
    return certa;
  });

  const tipos: Tipo[] = [];
  const exigidos: Equipamento[] = [];
  const termos: TermoTexto[] = [];
  const avisos: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    if (usado[i]) continue;
    const conceito = conceitos.find((c) => c.tokens.every((t, k) => !usado[i + k] && norma[i + k] === t));
    if (!conceito) continue;
    const indices = conceito.tokens.map((_, k) => i + k);
    if ("tipo" in conceito) {
      if (!tipos.includes(conceito.tipo)) tipos.push(conceito.tipo);
      marcar(`tipo:${conceito.tipo}`, indices);
    } else if ("equipamento" in conceito) {
      if (!exigidos.includes(conceito.equipamento)) exigidos.push(conceito.equipamento);
      marcar(`equip:${conceito.equipamento}`, indices);
    } else {
      indices.forEach((k) => (usado[k] = true));
      const termo: TermoTexto = {
        original: indices.map((k) => tokens[k].original).join(" "),
        palavras: conceito.busca,
        rotulo: conceito.rotulo,
        corrigido: indices.some((k) => norma[k] !== tokens[k].norma),
        aviso: conceito.aviso,
      };
      termos.push(termo);
      if (conceito.aviso && !avisos.includes(conceito.aviso)) avisos.push(conceito.aviso);
    }
    i += conceito.tokens.length - 1;
  }

  const livres = tokens
    .map((t, i) => ({ i, original: t.original, norma: norma[i], corrigido: norma[i] !== t.norma }))
    .filter(({ i, norma: n }) => !usado[i] && !palavrasVazias.includes(n));
  for (let k = 0; k < livres.length; k++) {
    const atual = livres[k];
    const proximo = livres[k + 1];
    if (proximo && proximo.i === atual.i + 1 && b.modelos.includes(atual.norma + proximo.norma)) {
      termos.push({
        original: `${atual.original} ${proximo.original}`,
        palavras: [atual.norma + proximo.norma],
        rotulo: atual.norma + proximo.norma,
        corrigido: atual.corrigido || proximo.corrigido,
      });
      k++;
      continue;
    }
    termos.push({ original: atual.original, palavras: [atual.norma], rotulo: atual.norma, corrigido: atual.corrigido });
  }

  const consultaCorrigida = correcoes.length
    ? tokens
        .map((t, i) => (norma[i] !== t.norma ? norma[i] : t.original))
        .join(" ")
    : null;

  return { termos, tipos, orcamento, exigidos, correcoes, consultaCorrigida, avisos, origem };
}

function pontuarTermo(idx: Indexado<CarroPesquisavel>, termo: TermoTexto) {
  let melhor = 0;
  for (const palavra of termo.palavras) {
    for (const [campo, palavras] of idx.campos) {
      const peso = pesoCampo[campo];
      for (const p of palavras) {
        const fator = p === palavra ? 1 : p.startsWith(palavra) ? 0.7 : palavra.length >= 3 && p.includes(palavra) ? 0.4 : 0;
        melhor = Math.max(melhor, peso * fator);
      }
    }
  }
  return termo.corrigido ? melhor * 0.6 : melhor;
}

export type FiltrosBusca = { orcamento: number | null; vaoMin: number; exigidos: Equipamento[]; tipos: Tipo[] };

export const semFiltros: FiltrosBusca = { orcamento: null, vaoMin: 0, exigidos: [], tipos: [] };

export function combinarFiltros(ui: FiltrosBusca, i: Interpretacao): FiltrosBusca {
  return {
    orcamento: i.orcamento === null ? ui.orcamento : ui.orcamento === null ? i.orcamento : Math.min(ui.orcamento, i.orcamento),
    vaoMin: ui.vaoMin,
    exigidos: unicos([...ui.exigidos, ...i.exigidos]),
    tipos: unicos([...ui.tipos, ...i.tipos]),
  };
}

function passa(c: CarroPesquisavel, f: FiltrosBusca) {
  return (
    (f.orcamento === null || c.preco <= f.orcamento) &&
    (f.vaoMin === 0 || (c.vaoLivreMm ?? 0) >= f.vaoMin) &&
    f.exigidos.every((e) => c.equipamentos[e] === true) &&
    (f.tipos.length === 0 || f.tipos.includes(c.tipo))
  );
}

export type Resultado<C> = { interpretacao: Interpretacao; filtros: FiltrosBusca; itens: { carro: C; pontos: number }[] };

export function buscar<C extends CarroPesquisavel>(consulta: string, carros: C[], ui: FiltrosBusca = semFiltros): Resultado<C> {
  const interpretacao = interpretar(consulta, carros);
  const filtros = combinarFiltros(ui, interpretacao);
  const itens = base(carros)
    .indice.filter((idx) => passa(idx.carro, filtros))
    .map((idx) => {
      const pontos = interpretacao.termos.map((t) => pontuarTermo(idx as Indexado<CarroPesquisavel>, t));
      return { carro: idx.carro, pontos: pontos.includes(0) ? -1 : pontos.reduce((s, p) => s + p, 0) };
    })
    .filter((i) => i.pontos >= 0)
    .sort((a, b) => b.pontos - a.pontos);
  return { interpretacao, filtros, itens };
}

export function removerDaConsulta(consulta: string, chave: ChaveFiltro, carros: CarroPesquisavel[]) {
  const tokens = tokenizar(consulta);
  const indices = new Set(interpretar(consulta, carros).origem[chave] ?? []);
  if (indices.size === 0) return consulta;
  const primeiro = Math.min(...indices);
  if (primeiro > 0 && ["com", "de", "e"].includes(tokens[primeiro - 1].norma)) indices.add(primeiro - 1);
  return tokens
    .filter((_, i) => !indices.has(i))
    .map((t) => t.original)
    .join(" ");
}

export function descrever(i: Interpretacao) {
  const partes = [
    ...i.tipos.map((t) => pluralTipo[t]),
    ...i.termos.map((t) => t.rotulo),
    ...i.exigidos.map((e) => `com ${equipamentos.find((q) => q.chave === e)?.rotulo.toLowerCase()}`),
    ...(i.orcamento !== null ? [`até ${formatarMilReais(i.orcamento)}`] : []),
  ].join(" ");
  return partes.charAt(0).toUpperCase() + partes.slice(1);
}

export type Sugestao = { id: string; rotulo: string; detalhe: string; consulta: string; carroId?: string };

export function sugerir(texto: string, carros: CarroPesquisavel[], maximo = 6): Sugestao[] {
  const palavras = tokensDe(texto);
  if (palavras.length === 0) return [];
  const { interpretacao, itens } = buscar(texto, carros);
  const contar = (consulta: string) => buscar(consulta, carros).itens.length;
  const atalho = (rotulo: string, consulta: string): Sugestao => {
    const n = contar(consulta);
    return { id: `atalho-${normalizar(rotulo)}`, rotulo, detalhe: `${n} ${n === 1 ? "carro" : "carros"}`, consulta };
  };

  const temFiltro = interpretacao.tipos.length + interpretacao.exigidos.length > 0 || interpretacao.orcamento !== null;
  const soConceitos = interpretacao.termos.every((t) => t.palavras.join() !== t.rotulo);
  const dinamico = (temFiltro || interpretacao.termos.length > 0) && soConceitos ? [atalho(descrever(interpretacao), texto.trim())] : [];

  const modelos: Sugestao[] =
    interpretacao.termos.length > 0
      ? itens.slice(0, 4).map(({ carro }) => ({
          id: `carro-${carro.id}`,
          rotulo: carro.nome,
          detalhe: `${carro.tipo} · ${formatarMilReais(carro.preco)}`,
          consulta: carro.nome,
          carroId: carro.id,
        }))
      : [];

  const marcasComCarro = marcas.filter((m) => base(carros).indice.some((i) => i.marca === m.nome));
  const estaticos = [
    ...marcasComCarro.map((m) => ({ rotulo: m.nome, consulta: normalizar(m.nome), extras: m.apelidos.map(normalizar) })),
    ...atalhos.map((a) => ({
      ...a,
      extras: tokensDe(a.consulta).flatMap((t) => conceitos.filter((c) => c.tokens.includes(t)).flatMap((c) => c.tokens)),
    })),
  ]
    .filter((a) => {
      const alvo = [...tokensDe(a.rotulo), ...tokensDe(a.consulta), ...a.extras].map((p) => p.replace(/[^a-z0-9]/g, ""));
      return palavras.every((p) => alvo.some((x) => x.startsWith(p.replace(/[^a-z0-9]/g, ""))));
    })
    .map((a) => atalho(a.rotulo, a.consulta));

  const vistos = new Set<string>();
  return [...dinamico, ...estaticos.slice(0, 2), ...modelos, ...estaticos.slice(2)]
    .filter((s) => {
      const chave = normalizar(s.rotulo);
      if (vistos.has(chave) || s.detalhe.startsWith("0 ")) return false;
      vistos.add(chave);
      return true;
    })
    .slice(0, maximo);
}

export function sugestoesProximas(consulta: string, carros: CarroPesquisavel[], maximo = 3) {
  const termos = interpretar(consulta, carros).termos.flatMap((t) => t.palavras);
  if (termos.length === 0) return [];
  const modelos = unicos(base(carros).indice.map((i) => i.modelo));
  return modelos
    .map((modelo) => ({
      modelo,
      d: Math.min(...termos.flatMap((t) => palavrasDoCampo(modelo).map((p) => distancia(t, p) / Math.max(t.length, p.length)))),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, maximo)
    .map((s) => s.modelo);
}
