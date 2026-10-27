"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { buscarCarro, carros, type Carro } from "@/data/carros";
import { dadosFicha, LINKS_RECALL } from "@/data/fichaCarros";
import { precosMercado } from "@/data/precoMercado";
import { nivelRisco } from "@/lib/apresentacao";
import { buscarFipe, type RespostaFipe } from "@/lib/fipe";
import {
  depreciacao,
  garantiaRestante,
  lerFichasSalvas,
  proximaRevisao,
  type CarroDoUsuario,
} from "@/lib/ficha";
import { formatarNota, formatarNumero, formatarReais } from "@/lib/formato";
import { calcularRisco, faixaRisco } from "@/lib/risco";

const CHAVE = "minha-ficha";
const avisos = new Set<() => void>();
let memoria: string | null | undefined;

function lerArmazenado() {
  if (memoria === undefined) {
    try {
      memoria = localStorage.getItem(CHAVE);
    } catch {
      memoria = null;
    }
  }
  return memoria;
}

function gravar(fichas: CarroDoUsuario[]) {
  memoria = fichas.length ? JSON.stringify(fichas) : null;
  try {
    if (memoria === null) localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, memoria);
  } catch {}
  avisos.forEach((a) => a());
}

function assinar(aviso: () => void) {
  avisos.add(aviso);
  const outraAba = (e: StorageEvent) => {
    if (e.key !== CHAVE) return;
    memoria = e.newValue;
    aviso();
  };
  window.addEventListener("storage", outraAba);
  return () => {
    avisos.delete(aviso);
    window.removeEventListener("storage", outraAba);
  };
}

const hojeLocal = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Fortaleza" });
const formatarData = (data: string) =>
  new Date(`${data}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
const pct = (v: number) => `${formatarNumero(Math.round(v * 1000) / 10)}%`;
const anoPadrao = (carro: Carro) => 2000 + Number(carro.anoModelo.split("/").at(-1));
const nomeDoCarro = (f: CarroDoUsuario) => (f.carroId ? (buscarCarro(f.carroId)?.nome ?? f.nomeLivre) : f.nomeLivre);

function lerInteiro(texto: string) {
  const digitos = texto.split(",")[0].replace(/\D/g, "");
  return digitos ? Number(digitos) : null;
}

const corTexto = { 1: "text-nivel-1", 2: "text-nivel-2", 3: "text-nivel-3", 4: "text-nivel-4" };
const estiloCampo = "w-full rounded-md border border-line-forte bg-campo px-2.5 py-2";

type Campos = {
  modelo: string;
  nomeLivre: string;
  anoModelo: string;
  dataCompra: string;
  kmAtual: string;
  precoPago: string;
  revisaoData: string;
  revisaoKm: string;
};

function camposDe(f: CarroDoUsuario | null): Campos {
  if (!f)
    return {
      modelo: carros[0].id,
      nomeLivre: "",
      anoModelo: String(anoPadrao(carros[0])),
      dataCompra: hojeLocal(),
      kmAtual: "",
      precoPago: "",
      revisaoData: "",
      revisaoKm: "",
    };
  return {
    modelo: f.carroId ?? "outro",
    nomeLivre: f.nomeLivre,
    anoModelo: String(f.anoModelo),
    dataCompra: f.dataCompra,
    kmAtual: String(f.kmAtual),
    precoPago: String(f.precoPago),
    revisaoData: f.ultimaRevisao?.data ?? "",
    revisaoKm: f.ultimaRevisao ? String(f.ultimaRevisao.km) : "",
  };
}

function Formulario({
  inicial,
  onSalvar,
  onCancelar,
}: {
  inicial: CarroDoUsuario | null;
  onSalvar: (f: CarroDoUsuario) => void;
  onCancelar: (() => void) | null;
}) {
  const [c, setC] = useState<Campos>(() => camposDe(inicial));
  const [erros, setErros] = useState<string[]>([]);
  const alterar = (campo: keyof Campos, valor: string) => setC((atual) => ({ ...atual, [campo]: valor }));

  function trocarModelo(modelo: string) {
    const carro = buscarCarro(modelo);
    setC((atual) => ({ ...atual, modelo, anoModelo: carro ? String(anoPadrao(carro)) : atual.anoModelo }));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const hoje = hojeLocal();
    const ano = lerInteiro(c.anoModelo);
    const km = lerInteiro(c.kmAtual);
    const preco = lerInteiro(c.precoPago);
    const revKm = lerInteiro(c.revisaoKm);
    const lista: string[] = [];
    if (c.modelo === "outro" && !c.nomeLivre.trim()) lista.push("Informe o modelo do carro.");
    if (ano === null || ano < 1990 || ano > Number(hoje.slice(0, 4)) + 1) lista.push("Ano-modelo inválido.");
    if (!c.dataCompra || c.dataCompra > hoje) lista.push("Data da compra inválida ou no futuro.");
    if (km === null) lista.push("Informe o km atual.");
    if (preco === null || preco < 1000) lista.push("Informe o preço pago.");
    if ((c.revisaoData === "") !== (revKm === null)) lista.push("Para a última revisão, informe data e km, ou deixe os dois vazios.");
    if (c.revisaoData && c.revisaoData > hoje) lista.push("Data da última revisão no futuro.");
    if (revKm !== null && km !== null && revKm > km) lista.push("Km da última revisão maior que o km atual.");
    setErros(lista);
    if (lista.length) return;
    onSalvar({
      id: inicial?.id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      carroId: c.modelo === "outro" ? null : c.modelo,
      nomeLivre: c.modelo === "outro" ? c.nomeLivre.trim() : "",
      anoModelo: ano!,
      dataCompra: c.dataCompra,
      kmAtual: km!,
      precoPago: preco!,
      ultimaRevisao: c.revisaoData && revKm !== null ? { data: c.revisaoData, km: revKm } : null,
    });
  }

  const rotulo = "grid content-start gap-1 text-sm";
  return (
    <form onSubmit={enviar} noValidate className="grid gap-4">
      <h2 className="font-semibold">{inicial ? "Atualizar dados do carro" : "Cadastrar meu carro"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={rotulo}>
          <span className="font-medium">Modelo</span>
          <select className={estiloCampo} value={c.modelo} onChange={(e) => trocarModelo(e.target.value)}>
            {carros.map((carro) => (
              <option key={carro.id} value={carro.id}>
                {carro.nome}
              </option>
            ))}
            <option value="outro">Outro (digitar)</option>
          </select>
        </label>
        {c.modelo === "outro" ? (
          <label className={rotulo}>
            <span className="font-medium">Qual modelo?</span>
            <input
              className={estiloCampo}
              value={c.nomeLivre}
              maxLength={80}
              placeholder="ex.: Chevrolet Onix LT 1.0"
              onChange={(e) => alterar("nomeLivre", e.target.value)}
            />
          </label>
        ) : (
          <span className="hidden sm:block" />
        )}
        <label className={rotulo}>
          <span className="font-medium">Ano-modelo</span>
          <input className={`${estiloCampo}`} inputMode="numeric" value={c.anoModelo} onChange={(e) => alterar("anoModelo", e.target.value)} />
        </label>
        <label className={rotulo}>
          <span className="font-medium">Data da compra</span>
          <input type="date" className={`${estiloCampo}`} value={c.dataCompra} onChange={(e) => alterar("dataCompra", e.target.value)} />
        </label>
        <label className={rotulo}>
          <span className="font-medium">Km atual</span>
          <input className={`${estiloCampo}`} inputMode="numeric" value={c.kmAtual} onChange={(e) => alterar("kmAtual", e.target.value)} />
        </label>
        <label className={rotulo}>
          <span className="font-medium">Preço pago (R$)</span>
          <input className={`${estiloCampo}`} inputMode="numeric" value={c.precoPago} onChange={(e) => alterar("precoPago", e.target.value)} />
        </label>
        <label className={rotulo}>
          <span className="font-medium">
            Data da última revisão <span className="font-normal text-muted">(opcional)</span>
          </span>
          <input type="date" className={`${estiloCampo}`} value={c.revisaoData} onChange={(e) => alterar("revisaoData", e.target.value)} />
        </label>
        <label className={rotulo}>
          <span className="font-medium">
            Km na última revisão <span className="font-normal text-muted">(opcional)</span>
          </span>
          <input className={`${estiloCampo}`} inputMode="numeric" value={c.revisaoKm} onChange={(e) => alterar("revisaoKm", e.target.value)} />
        </label>
      </div>
      {erros.length > 0 && (
        <ul className="grid gap-1 text-sm text-nivel-4" role="alert">
          {erros.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted">
        Não pedimos placa, chassi, RENAVAM nem dados pessoais. Tudo fica só neste navegador.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded-md bg-accent px-4 py-2 font-semibold text-accent-ink">
          Salvar ficha
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="rounded-md border border-line-forte px-4 py-2 font-medium">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid content-start gap-3 rounded-xl bg-surface-2 p-4 md:p-5">
      <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 border-b border-line/60 pb-2 text-sm last:border-0 last:pb-0">
      <dt className="text-muted">{rotulo}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function ValorHoje({ ficha, hoje }: { ficha: CarroDoUsuario; hoje: string }) {
  const chave = ficha.carroId ? `${ficha.carroId}:${ficha.anoModelo}` : null;
  const [resposta, setResposta] = useState<{ chave: string; dados: RespostaFipe } | null>(null);

  const { carroId, anoModelo } = ficha;
  useEffect(() => {
    if (!carroId) return;
    let ativo = true;
    buscarFipe(carroId, anoModelo).then((dados) => ativo && setResposta({ chave: `${carroId}:${anoModelo}`, dados }));
    return () => {
      ativo = false;
    };
  }, [carroId, anoModelo]);

  if (!chave)
    return (
      <Cartao titulo="Valor hoje">
        <p className="text-sm text-muted">
          Este modelo não está na base, então não temos o código FIPE dele. Consulte em{" "}
          <a href="https://veiculos.fipe.org.br/" target="_blank" rel="noreferrer" className="text-brand underline underline-offset-4">
            veiculos.fipe.org.br
          </a>
          .
        </p>
        <dl className="grid gap-2">
          <Linha rotulo="Preço pago">{formatarReais(ficha.precoPago)}</Linha>
        </dl>
      </Cartao>
    );

  const dados = resposta?.chave === chave ? resposta.dados : null;
  const anuncios = ficha.carroId ? precosMercado[ficha.carroId]?.anuncios : null;
  const fipeSalva = ficha.carroId ? precosMercado[ficha.carroId]?.fipe : null;
  const d = dados && "valor" in dados ? depreciacao(ficha.precoPago, dados.valor, ficha.dataCompra, hoje) : null;

  return (
    <Cartao titulo="Valor hoje">
      {!dados && <p className="text-sm text-muted">Buscando a FIPE…</p>}
      {dados && "erro" in dados && (
        <p className="text-sm text-nivel-3" role="alert">
          {dados.erro} {fipeSalva && fipeSalva.anoModelo !== ficha.anoModelo && `Temos salvo só o ano-modelo ${fipeSalva.anoModelo}.`}
        </p>
      )}
      {dados && "valor" in dados && d && (
        <>
          <div>
            <p className="text-2xl font-semibold">{formatarReais(dados.valor)}</p>
            <p className="text-sm text-muted">
              FIPE {dados.anoModelo}, {dados.mesReferencia} · código {dados.codigo}
              {dados.modelo && ` · ${dados.modelo}`}
            </p>
            {dados.origem === "salvo" && (
              <p className="mt-1 text-sm text-nivel-3">
                {dados.aviso} Mostrando o valor salvo no app ({dados.mesReferencia}).
              </p>
            )}
          </div>
          <dl className="grid gap-2">
            <Linha rotulo="Preço pago">{formatarReais(ficha.precoPago)}</Linha>
            <Linha rotulo={d.reais >= 0 ? "Depreciação" : "Valorização"}>
              <span className={`${d.reais > 0 ? "text-nivel-3" : "text-nivel-1"}`}>
                {formatarReais(Math.abs(d.reais))} ({pct(Math.abs(d.percentual))})
              </span>
            </Linha>
            <Linha rotulo="Por mês desde a compra">
              {d.porMes === null ? (
                <span className="text-muted">menos de 1 mês de uso</span>
              ) : (
                <span>
                  {formatarReais(Math.abs(d.porMes))} em {formatarNumero(Math.round(d.meses * 10) / 10)} meses
                </span>
              )}
            </Linha>
            {anuncios && fipeSalva?.anoModelo === ficha.anoModelo && (
              <Linha rotulo="Anúncios (preço pedido)">
                <span>{formatarReais(anuncios.mediana)}</span>{" "}
                <span className="text-muted">mediana, {anuncios.data}</span>
              </Linha>
            )}
          </dl>
          <p className="text-xs text-muted">
            A FIPE é a média de negócios do ano-modelo; não considera km, estado nem opcionais. Atualizada uma vez por dia.
          </p>
        </>
      )}
    </Cartao>
  );
}

function Manutencao({ ficha, carro, hoje }: { ficha: CarroDoUsuario; carro: Carro | null; hoje: string }) {
  const revisao = ficha.carroId ? dadosFicha[ficha.carroId]?.revisao : null;
  const r = revisao ? proximaRevisao(ficha, revisao, hoje) : null;
  const g = carro ? garantiaRestante(ficha.dataCompra, carro.garantiaAnos, hoje) : null;

  return (
    <Cartao titulo="Manutenção e garantia">
      {revisao && r ? (
        <div className={`grid gap-1 rounded-sm p-3 ${r.atrasada ? "bg-nivel-bg-4" : "bg-bg"}`}>
          <p className="text-sm font-semibold">
            {r.atrasada
              ? `Revisão atrasada (${r.kmFaltando <= 0 ? `passou ${formatarNumero(-r.kmFaltando)} km` : `venceu em ${formatarData(r.dataAlvo)}`})`
              : `Próxima revisão por volta de ${formatarData(r.data)}`}
          </p>
          <p className="text-sm">
            Aos <span>{formatarNumero(r.kmAlvo)} km</span> ou em{" "}
            <span>{formatarData(r.dataAlvo)}</span>, o que vier primeiro
            {!r.atrasada && ` (deve vencer por ${r.vencePor === "km" ? "km" : "tempo"})`}.
          </p>
          <p className="text-xs text-muted">
            Intervalo de {formatarNumero(revisao.intervaloKm)} km ou {revisao.intervaloMeses} meses.{" "}
            {r.kmPorMes !== null && `Seu ritmo: ~${formatarNumero(r.kmPorMes)} km/mês. `}
            {!r.baseInformada && "Sem última revisão informada: contamos da data da compra e do km 0."}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">Intervalo de revisão não levantado para este carro. Veja o manual do proprietário.</p>
      )}
      {revisao && revisao.custos.length > 0 && (
        <dl className="grid gap-2">
          {revisao.custos.map((c) => (
            <Linha key={c.ateKm} rotulo={`Revisões até ${formatarNumero(c.ateKm)} km`}>
              <span>{formatarReais(c.total)}</span>
            </Linha>
          ))}
          <p className="text-xs text-muted">{revisao.fonte}. Valores somados de todas as revisões até essa marca.</p>
        </dl>
      )}
      {g && carro ? (
        <div className={`grid gap-1 rounded-sm p-3 ${g.vencida ? "bg-bg" : g.alerta ? "bg-nivel-bg-3" : "bg-bg"}`}>
          <p className="text-sm font-semibold">
            {g.vencida
              ? `Garantia de fábrica encerrada em ${formatarData(g.fim)}`
              : `Garantia até ${formatarData(g.fim)} (${g.mesesRestantes} ${g.mesesRestantes === 1 ? "mês" : "meses"})`}
          </p>
          {g.alerta && (
            <p className="text-sm">Faltam menos de 6 meses: faça uma revisão e anote qualquer defeito para resolver dentro da garantia.</p>
          )}
          <p className="text-xs text-muted">
            {carro.garantiaAnos} anos a partir da compra. Revisão atrasada ou fora da rede autorizada pode anular a garantia.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">Garantia não levantada para este modelo. Revisão atrasada pode anular a garantia.</p>
      )}
    </Cartao>
  );
}

function Riscos({ carro }: { carro: Carro }) {
  const risco = calcularRisco(carro);
  const nivel = nivelRisco(risco.nota);
  const observar = dadosFicha[carro.id]?.observar ?? [];
  return (
    <Cartao titulo="Riscos do conjunto">
      <p className={`flex items-baseline gap-2 ${corTexto[nivel]}`}>
        <span className="text-2xl font-semibold">{formatarNota(risco.nota)}</span>
        <span className="font-medium">Risco {faixaRisco(risco.nota)}</span>
      </p>
      <ul className="grid gap-1.5 text-sm">
        {carro.risco.principais.map((p) => (
          <li key={p} className="border-l-2 border-nivel-3 pl-2">
            {p}
          </li>
        ))}
      </ul>
      {observar.length > 0 && (
        <>
          <h4 className="text-sm font-semibold">O que observar</h4>
          <ul className="grid list-disc gap-1 pl-5 text-sm">
            {observar.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </>
      )}
      <Link href={`/carros/${carro.id}`} className="w-fit text-sm text-brand underline underline-offset-4">
        Ver a nota completa →
      </Link>
    </Cartao>
  );
}

function Recalls({ ficha }: { ficha: CarroDoUsuario }) {
  const montadora = ficha.carroId ? dadosFicha[ficha.carroId]?.montadora : null;
  const link = "text-brand underline underline-offset-4";
  return (
    <Cartao titulo="Recalls">
      <p className="text-sm">
        A consulta oficial é pelo chassi (ou pela placa no portal do governo). O app não pede esses dados: consulte direto
        na fonte.
      </p>
      <ul className="grid gap-1.5 text-sm">
        {montadora && (
          <li>
            <a href={montadora.site} target="_blank" rel="noreferrer" className={link}>
              Site da {montadora.nome}
            </a>
            <span className="text-muted">: área de recall, digite o chassi</span>
          </li>
        )}
        <li>
          <a href={LINKS_RECALL.senatran} target="_blank" rel="noreferrer" className={link}>
            Portal de Serviços da Senatran
          </a>
          <span className="text-muted">: login gov.br, Veículos → Consultar recall pendente</span>
        </li>
        <li>
          <a href={LINKS_RECALL.senacon} target="_blank" rel="noreferrer" className={link}>
            Recall na Senacon (Ministério da Justiça)
          </a>
          <span className="text-muted">: campanhas anunciadas pelas montadoras</span>
        </li>
      </ul>
      <p className="text-xs text-muted">O chassi fica no documento do carro (CRLV) e gravado no para-brisa.</p>
    </Cartao>
  );
}

function Ficha({ ficha, hoje }: { ficha: CarroDoUsuario; hoje: string }) {
  const carro = ficha.carroId ? (buscarCarro(ficha.carroId) ?? null) : null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ValorHoje ficha={ficha} hoje={hoje} />
      <Manutencao ficha={ficha} carro={carro} hoje={hoje} />
      {carro ? (
        <Riscos carro={carro} />
      ) : (
        <Cartao titulo="Riscos do conjunto">
          <p className="text-sm text-muted">Este modelo ainda não tem nota de risco na base.</p>
        </Cartao>
      )}
      <Recalls ficha={ficha} />
    </div>
  );
}

export function MinhaFicha() {
  const bruto = useSyncExternalStore(assinar, lerArmazenado, () => undefined);
  const fichas = useMemo(() => (bruto === undefined ? null : lerFichasSalvas(bruto)), [bruto]);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [modo, setModo] = useState<"ver" | "novo" | "editar">("ver");

  if (fichas === null) return <p className="text-sm text-muted">Carregando…</p>;

  const hoje = hojeLocal();
  const selecionada = fichas.find((f) => f.id === selecionadaId) ?? fichas[0] ?? null;

  function salvar(f: CarroDoUsuario) {
    const lista = fichas!.some((x) => x.id === f.id) ? fichas!.map((x) => (x.id === f.id ? f : x)) : [...fichas!, f];
    gravar(lista);
    setSelecionadaId(f.id);
    setModo("ver");
  }

  function apagar(id: string) {
    gravar(fichas!.filter((f) => f.id !== id));
    setSelecionadaId(null);
  }

  if (!selecionada || modo === "novo")
    return <Formulario inicial={null} onSalvar={salvar} onCancelar={selecionada ? () => setModo("ver") : null} />;

  if (modo === "editar")
    return <Formulario key={selecionada.id} inicial={selecionada} onSalvar={salvar} onCancelar={() => setModo("ver")} />;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Meus carros">
        {fichas.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === selecionada.id}
            onClick={() => setSelecionadaId(f.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${f.id === selecionada.id ? "border-ink bg-ink font-semibold text-bg" : "border-line-forte text-muted"}`}
          >
            {nomeDoCarro(f)} {f.anoModelo}
          </button>
        ))}
        <button type="button" onClick={() => setModo("novo")} className="px-2 py-1.5 text-sm text-brand underline underline-offset-4">
          + Outro carro
        </button>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {nomeDoCarro(selecionada)} <span className="text-base font-normal text-muted">{selecionada.anoModelo}</span>
          </h2>
          <p className="text-sm text-muted">
            Comprado em {formatarData(selecionada.dataCompra)} · {formatarNumero(selecionada.kmAtual)} km ·{" "}
            {formatarReais(selecionada.precoPago)}
            {selecionada.ultimaRevisao &&
              ` · última revisão em ${formatarData(selecionada.ultimaRevisao.data)} com ${formatarNumero(selecionada.ultimaRevisao.km)} km`}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <button type="button" onClick={() => setModo("editar")} className="text-brand underline underline-offset-4">
            Atualizar km e dados
          </button>
          <button type="button" onClick={() => apagar(selecionada.id)} className="text-muted underline-offset-4 hover:underline">
            Apagar
          </button>
        </div>
      </header>

      <Ficha ficha={selecionada} hoje={hoje} />
    </div>
  );
}
