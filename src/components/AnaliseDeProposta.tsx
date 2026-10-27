"use client";

import { useState } from "react";
import type { ExtracaoProposta } from "@/lib/extracaoProposta";
import { formatarReais } from "@/lib/formato";
import {
  TAXA_EMPRESTIMO_PADRAO,
  analisarProposta,
  validarProposta,
  type AnaliseProposta,
  type Proposta,
} from "@/lib/proposta";

type Campos = {
  precoAVista: string;
  entrada: string;
  parcelas: string;
  valorParcela: string;
  parcelaFinal: string;
  taxaAnunciada: string;
  extras: string;
  taxaEmprestimo: string;
};

const vazio: Campos = {
  precoAVista: "",
  entrada: "",
  parcelas: "",
  valorParcela: "",
  parcelaFinal: "",
  taxaAnunciada: "",
  extras: "",
  taxaEmprestimo: String(TAXA_EMPRESTIMO_PADRAO * 100).replace(".", ","),
};

const rotulos: { campo: keyof Campos; rotulo: string; dica?: string; opcional?: boolean }[] = [
  { campo: "precoAVista", rotulo: "Preço à vista (R$)" },
  { campo: "entrada", rotulo: "Entrada (R$)" },
  { campo: "parcelas", rotulo: "Nº de parcelas" },
  { campo: "valorParcela", rotulo: "Valor da parcela (R$)" },
  { campo: "parcelaFinal", rotulo: "Parcela final / balão (R$)", opcional: true },
  { campo: "taxaAnunciada", rotulo: "Taxa anunciada (% ao mês)", dica: "0 se for taxa zero", opcional: true },
  { campo: "extras", rotulo: "Opcionais e emplacamento à parte (R$)", opcional: true },
  { campo: "taxaEmprestimo", rotulo: "Taxa do empréstimo (% ao mês)", dica: "o que seu banco oferece" },
];

function lerNumero(texto: string) {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  if (!limpo) return undefined;
  const milhar = /^-?\d{1,3}(\.\d{3})+$/.test(limpo);
  const normal = limpo.includes(",") || milhar ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal);
  return Number.isFinite(n) ? n : undefined;
}

const umDecimal = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
const centavos = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const LEITURA_FOTO = process.env.NEXT_PUBLIC_LEITURA_FOTO !== "false";
const pct = (taxa: number) => `${(taxa * 100).toFixed(2).replace(".", ",")}%`;

async function reduzirFoto(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("foto"))), "image/jpeg", 0.85));
}

type Leitura =
  | { estado: "parado" }
  | { estado: "lendo" }
  | { estado: "lido"; dados: ExtracaoProposta }
  | { estado: "erro"; mensagem: string };

export function AnaliseDeProposta() {
  const [campos, setCampos] = useState<Campos>(vazio);
  const [leitura, setLeitura] = useState<Leitura>({ estado: "parado" });
  const [erros, setErros] = useState<string[]>([]);
  const [analise, setAnalise] = useState<{ proposta: Proposta; resultado: AnaliseProposta } | null>(null);

  const alterar = (campo: keyof Campos, valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));

  async function lerFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setLeitura({ estado: "lendo" });
    try {
      const corpo = new FormData();
      corpo.set("imagem", await reduzirFoto(arquivo), "proposta.jpg");
      const r = await fetch("/api/proposta/extrair", { method: "POST", body: corpo });
      const json = await r.json().catch(() => null);
      if (!r.ok) {
        setLeitura({
          estado: "erro",
          mensagem:
            r.status === 501
              ? "A leitura por foto precisa do Claude Code logado no servidor. Preencha os campos abaixo."
              : (json?.erro ?? "Não deu para ler a foto. Preencha os campos abaixo."),
        });
        return;
      }
      const d = json as ExtracaoProposta;
      const extras = d.opcionais.reduce((s, o) => s + o.valor, 0) + (d.emplacamento ?? 0);
      setCampos((c) => ({
        ...c,
        precoAVista: umDecimal(d.precoAVista),
        entrada: umDecimal(d.entrada),
        parcelas: umDecimal(d.parcelas),
        valorParcela: umDecimal(d.valorParcela),
        parcelaFinal: umDecimal(d.parcelaFinal),
        taxaAnunciada: umDecimal(d.taxaAnunciadaMensalPct),
        extras: extras ? umDecimal(extras) : "",
      }));
      setAnalise(null);
      setLeitura({ estado: "lido", dados: d });
    } catch {
      setLeitura({ estado: "erro", mensagem: "Não deu para ler a foto. Preencha os campos abaixo." });
    }
  }

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const taxa = lerNumero(campos.taxaAnunciada);
    const proposta: Proposta = {
      precoAVista: lerNumero(campos.precoAVista) ?? 0,
      entrada: lerNumero(campos.entrada) ?? 0,
      parcelas: lerNumero(campos.parcelas) ?? 0,
      valorParcela: lerNumero(campos.valorParcela) ?? 0,
      parcelaFinal: lerNumero(campos.parcelaFinal),
      taxaAnunciada: taxa === undefined ? undefined : taxa / 100,
      extrasForaDoPreco: lerNumero(campos.extras),
    };
    const problemas = validarProposta(proposta);
    const taxaEmprestimo = (lerNumero(campos.taxaEmprestimo) ?? TAXA_EMPRESTIMO_PADRAO * 100) / 100;
    if (!(taxaEmprestimo >= 0 && taxaEmprestimo < 1)) problemas.push("Informe uma taxa de empréstimo válida.");
    setErros(problemas);
    setAnalise(problemas.length ? null : { proposta, resultado: analisarProposta(proposta, taxaEmprestimo) });
  }

  return (
    <div className="grid gap-6">
      {LEITURA_FOTO ? (
        <section className="grid gap-3" aria-labelledby="titulo-foto">
          <h2 id="titulo-foto" className="font-semibold">
            1. Foto da proposta
          </h2>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-md bg-ink px-4 py-2 text-sm font-medium text-bg">
              Tirar foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => lerFoto(e.target.files?.[0])}
              />
            </label>
            <label className="cursor-pointer rounded-md border border-line-forte px-4 py-2 text-sm font-medium">
              Escolher imagem
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => lerFoto(e.target.files?.[0])} />
            </label>
          </div>
          <p className="text-xs text-muted">
            A foto vai para o servidor só para ler os valores e é descartada em seguida: não guardamos a imagem nem o
            conteúdo. A leitura ignora nome, CPF, endereço, telefone, e-mail, placa e chassi. Se preferir, cubra esses
            dados antes de fotografar ou preencha à mão.
          </p>
          <div aria-live="polite" className="text-sm">
            {leitura.estado === "lendo" && <p className="text-muted">Lendo a proposta…</p>}
            {leitura.estado === "erro" && <p className="text-nivel-3">{leitura.mensagem}</p>}
            {leitura.estado === "lido" && <ResumoLeitura dados={leitura.dados} />}
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted">
          A leitura da proposta por foto só funciona na versão local do app; aqui, preencha os valores à mão.
        </p>
      )}

      <form
        onSubmit={calcular}
        className="grid gap-4 border-t border-line pt-6"
        aria-labelledby="titulo-form"
        noValidate
      >
        <h2 id="titulo-form" className="font-semibold">
          {LEITURA_FOTO ? "2. Confira os valores" : "Valores da proposta"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {rotulos.map(({ campo, rotulo, dica, opcional }) => (
            <label key={campo} className="grid content-start gap-1 text-sm">
              <span className="font-medium">
                {rotulo}
                {opcional && <span className="font-normal text-muted"> (opcional)</span>}
              </span>
              <input
                name={campo}
                inputMode="decimal"
                autoComplete="off"
                placeholder={dica}
                className="w-full rounded-md border border-line-forte bg-campo px-2.5 py-2"
                value={campos[campo]}
                onChange={(e) => alterar(campo, e.target.value)}
              />
            </label>
          ))}
        </div>
        {erros.length > 0 && (
          <ul className="grid gap-1 text-sm text-nivel-4" role="alert">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <button type="submit" className="rounded-md bg-accent px-4 py-3 font-semibold text-accent-ink">
          Calcular
        </button>
      </form>

      {analise && <Resultado proposta={analise.proposta} a={analise.resultado} />}
    </div>
  );
}

function ResumoLeitura({ dados }: { dados: ExtracaoProposta }) {
  return (
    <div className="grid gap-1 rounded-xl bg-surface-2 p-3">
      <p className="font-medium">Lido{dados.modelo ? `: ${dados.modelo}` : ""}. Confira os campos antes de calcular.</p>
      {dados.precoProposta !== null && (
        <p>
          Preço usado na proposta: <span>{formatarReais(dados.precoProposta)}</span>. A conta usa
          o preço à vista.
        </p>
      )}
      {dados.precoAVista === null && <p className="text-nivel-3">A proposta não mostra o preço à vista. Pergunte e preencha.</p>}
      {dados.opcionais.length > 0 && (
        <p>
          Opcionais: {dados.opcionais.map((o) => `${o.nome} (${formatarReais(o.valor)})`).join(", ")}
        </p>
      )}
      {dados.emplacamento !== null && <p>Emplacamento: {formatarReais(dados.emplacamento)}</p>}
    </div>
  );
}

function Resultado({ proposta, a }: { proposta: Proposta; a: AnaliseProposta }) {
  const alerta = a.taxaZeroComJuro || a.juroEscondido;
  const e = a.emprestimo;
  const maior = Math.max(a.totalParcelas, e.total);
  const largura = (v: number) => `${(v / maior) * 100}%`;
  const barras = [
    { rotulo: "Proposta da loja", total: a.totalParcelas, custo: a.totalParcelas - a.financiado, extra: "juros" },
    { rotulo: `Empréstimo a ${pct(e.taxaMensal)} a.m.`, total: e.total, custo: e.jurosEIof, extra: "juros + IOF" },
  ];

  return (
    <section className="grid gap-5" aria-live="polite" aria-labelledby="titulo-resultado">
      <h2 id="titulo-resultado" className="sr-only">
        Resultado
      </h2>

      <div className={`grid gap-2 rounded-xl p-4 ${alerta ? "bg-nivel-bg-4" : "bg-surface-2"}`}>
        <p className="text-sm text-muted">Taxa real sobre o preço à vista</p>
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={`text-4xl font-semibold ${alerta ? "text-nivel-4" : ""}`}>{pct(a.taxaMensal)}</span>
          <span className="text-sm">ao mês · {pct(a.taxaAnual)} ao ano</span>
        </p>
        {a.taxaAnunciada !== null && (
          <p className="text-sm">
            Anunciada: <span>{pct(a.taxaAnunciada)}</span> ao mês
            {a.diferencaPP !== null && Math.abs(a.diferencaPP) >= 0.01 && (
              <>
                {" "}
                · diferença de <span className="font-semibold">{a.diferencaPP.toFixed(2).replace(".", ",")} p.p.</span>
              </>
            )}
          </p>
        )}
        {a.taxaZeroComJuro && (
          <p className="text-sm font-medium text-nivel-4">
            &ldquo;Taxa zero&rdquo; com juro escondido: entrada e parcelas somam {formatarReais(a.juros)} a mais que o preço
            à vista.
          </p>
        )}
        {!a.taxaZeroComJuro && a.juroEscondido && (
          <p className="text-sm font-medium text-nivel-4">A taxa anunciada não bate com o preço à vista: o juro está no preço.</p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-4">
        <Item termo="Financiado" valor={formatarReais(a.financiado)} />
        <Item termo="Parcelas" valor={`${proposta.parcelas}x ${centavos.format(proposta.valorParcela)}`} />
        <Item termo="Total pago" valor={formatarReais(a.totalPago)} />
        <Item termo="Juros" valor={formatarReais(a.juros)} destaque={a.juros > 0} />
      </dl>

      <div className="grid gap-3 rounded-xl bg-surface-2 p-4">
        <h3 className="font-semibold">Proposta ou empréstimo para pagar à vista?</h3>
        <p className="text-sm text-muted">
          Mesma entrada; o empréstimo cobre os {formatarReais(a.financiado)} restantes em {proposta.parcelas}x, com IOF
          financiado.
        </p>
        <div className="grid gap-3">
          {barras.map((b) => (
            <div key={b.rotulo} className="grid gap-1 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{b.rotulo}</span>
                <span>{formatarReais(b.total)}</span>
              </div>
              <div className="flex h-4 overflow-hidden rounded bg-surface-2" aria-hidden>
                <div className="bg-brand" style={{ width: largura(b.total - b.custo) }} />
                <div className="bg-nivel-faixa-3" style={{ width: largura(b.custo) }} />
              </div>
              <span className="text-xs text-muted">
                {b.extra}: <span>{formatarReais(b.custo)}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> valor do carro
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-nivel-faixa-3" /> custo do crédito
          </span>
        </p>
        <p className="text-sm">
          Empréstimo: {proposta.parcelas}x <span>{centavos.format(e.parcela)}</span>, IOF{" "}
          <span>{formatarReais(e.iof)}</span>.{" "}
          {a.economiaComEmprestimo > 0 ? (
            <strong>Pagar à vista com o empréstimo economiza {formatarReais(a.economiaComEmprestimo)}.</strong>
          ) : (
            <strong>A proposta sai {formatarReais(-a.economiaComEmprestimo)} mais barata que o empréstimo.</strong>
          )}
        </p>
        <p className="rounded-xl bg-surface-2 p-3 text-sm">
          {a.taxaEmpate === null ? (
            "Nenhum empréstimo bate essa proposta: só o IOF já custa mais que os juros dela."
          ) : (
            <>
              Taxa de empate: <span className="font-semibold">{pct(a.taxaEmpate)}</span> ao mês. Um empréstimo
              abaixo disso (já com IOF) sai mais barato que a proposta.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-2 rounded-xl bg-surface-2 p-4">
        <h3 className="font-semibold">Perguntas para fazer na loja</h3>
        <ol className="grid list-decimal gap-2 pl-5 text-sm">
          {a.perguntas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-muted">
        Como calculamos: taxa pela tabela Price que iguala as parcelas (e a parcela final, se houver) ao preço à vista
        menos a entrada. O empréstimo usa a mesma tabela, com IOF de pessoa física (0,38% mais 0,0082% ao dia sobre cada
        amortização, até 365 dias) somado ao valor emprestado. A comparação soma o que sai do bolso depois da entrada;
        não desconta inflação nem rendimento do dinheiro. Tarifas e seguros não entram: peça o CET.
      </p>
    </section>
  );
}

function Item({ termo, valor, destaque }: { termo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted">{termo}</dt>
      <dd className={`font-semibold ${destaque ? "text-nivel-4" : ""}`}>{valor}</dd>
    </div>
  );
}
