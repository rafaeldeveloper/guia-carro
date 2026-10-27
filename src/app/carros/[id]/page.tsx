import Link from "next/link";
import { notFound } from "next/navigation";
import { NaoLevantado } from "@/components/NaoLevantado";
import { PrecoJusto } from "@/components/PrecoJusto";
import { IconeAlerta, IconeRisco, ReguaRisco, corTextoNivel } from "@/components/NotaRiscoSelo";
import { buscarCarro, carros, type Carro } from "@/data/carros";
import {
  comparacaoComMedia,
  dataMaisRecente,
  grupoComparacao,
  marca,
  mediaPor1000,
  nivelRisco,
  temIncerteza,
} from "@/lib/apresentacao";
import { formatarMilReais, formatarNota, formatarNumero, formatarReais } from "@/lib/formato";
import { avaliarPreco, calcularFaixa, rotuloVeredito, type Veredito } from "@/lib/precoJusto";
import { calcularRisco, faixaRisco, nomeSistema, sistemas } from "@/lib/risco";

export const revalidate = 86400;

const rotuloConfianca = { alta: "alta", media: "média", baixa: "baixa" };

const corVeredito: Record<Veredito, string> = {
  otimo: "bg-nivel-bg-1 text-nivel-1",
  bom: "bg-nivel-bg-2 text-nivel-2",
  media: "bg-nivel-bg-3 text-nivel-3",
  caro: "bg-nivel-bg-4 text-nivel-4",
};

const fundoNivel = { 1: "bg-nivel-bg-1", 2: "bg-nivel-bg-2", 3: "bg-nivel-bg-3", 4: "bg-nivel-bg-4" };

const versoMedia = (comp: "acima" | "abaixo" | "na média", media: string) =>
  comp === "na média" ? `na média (${media})` : `${comp} da média (${media})`;

const estiloComparacao = {
  acima: { simbolo: "▲", texto: "acima da média", cor: "text-nivel-3" },
  abaixo: { simbolo: "▼", texto: "abaixo da média", cor: "text-nivel-1" },
  "na média": { simbolo: "●", texto: "na média", cor: "text-muted" },
};

export function generateStaticParams() {
  return carros.map((c) => ({ id: c.id }));
}

function SimNao({ valor }: { valor: boolean | null }) {
  if (valor === null) return <NaoLevantado texto="não confirmado" />;
  return valor ? (
    <span>
      <span aria-hidden="true">✓ </span>sim
    </span>
  ) : (
    <span className="text-muted">
      <span aria-hidden="true">✕ </span>não
    </span>
  );
}

function Pontos({ valor, de = 5, rotulo }: { valor: number; de?: number; rotulo: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${rotulo}: ${valor} de ${de}`}>
      {Array.from({ length: de }, (_, i) => (
        <span
          key={i}
          className={`size-2.5 rounded-full border border-ink ${i < valor ? "bg-ink" : "bg-transparent opacity-40"}`}
        />
      ))}
    </span>
  );
}

function Bloco({ titulo, itens }: { titulo: string; itens: [string, React.ReactNode][] }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold">{titulo}</h3>
      <dl className="grid text-sm">
        {itens.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex flex-wrap justify-between gap-x-4 border-b border-line py-2">
            <dt className="text-muted">{rotulo}</dt>
            <dd className="text-right">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TituloSecao({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold tracking-tight md:text-2xl">
      {children}
    </h2>
  );
}

function Rotulo({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xs font-semibold tracking-wider text-muted uppercase">
      {children}
    </h2>
  );
}

const consumo = (c: Carro["consumoGasolina"]) =>
  c ? `${formatarNumero(c.cidade)} / ${formatarNumero(c.estrada)} km/l` : <NaoLevantado />;

const atalhos = [
  ["#risco", "Risco"],
  ["#preco-justo", "Preço justo"],
  ["#ficha", "Ficha técnica"],
  ["#fontes", "Fontes"],
] as const;

export default async function PaginaCarro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carro = buscarCarro(id);
  if (!carro) notFound();

  const risco = calcularRisco(carro);
  const nivel = nivelRisco(risco.nota);
  const incerto = temIncerteza(carro);
  const atualizado = dataMaisRecente(carro);
  const grupo = grupoComparacao(carro, carros);
  const marcas = [...new Map(carros.map((c) => [marca(c), c])).values()];
  const mediaGarantia = marcas.reduce((t, c) => t + c.garantiaAnos, 0) / marcas.length;
  const mediaReclameAqui = marcas.reduce((t, c) => t + c.notaReclameAquiMarca, 0) / marcas.length;
  const somaPontos = sistemas.reduce((t, s) => t + risco.sistemas[s].pontos, 0) + risco.posVenda;
  const faixa = calcularFaixa(carro, new Date().toLocaleDateString("sv-SE", { timeZone: "America/Fortaleza" }));
  const avaliacao = faixa ? avaliarPreco(faixa, carro.preco) : null;

  return (
    <main className="conteudo grid gap-8 py-6 md:py-8">
      <div className="grid gap-3">
        <Link href="/comparar" className="link w-fit text-sm">
          ← Comparar carros
        </Link>
        <header className="grid gap-1">
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
            {carro.nome} <span className="text-lg font-normal text-muted">{carro.anoModelo}</span>
          </h1>
          <p className="text-muted">
            {carro.tipo} · {carro.motor} · {carro.potenciaCv} cv · {carro.cambio}
          </p>
        </header>
      </div>

      <div className="grid gap-6 border-y border-line py-6 md:grid-cols-[1.2fr_1fr_1fr] md:gap-10">
        <section aria-labelledby="titulo-nota" className="grid content-start gap-2">
          <Rotulo id="titulo-nota">Nota de risco</Rotulo>
          <div className={`flex items-center gap-3 ${corTextoNivel[nivel]}`}>
            <span className="text-4xl leading-none font-extrabold">
              {incerto ? "~" : ""}
              {formatarNota(risco.nota)}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm font-semibold ${fundoNivel[nivel]}`}>
              <IconeRisco nivel={nivel} />
              Risco {faixaRisco(risco.nota)}
            </span>
          </div>
          <ReguaRisco nota={risco.nota} incerteza={incerto ? Math.max(risco.incerteza, 0.5) : 0} />
          {incerto && (
            <p className="flex gap-2 text-sm">
              <IconeAlerta className="mt-1" />
              <span>
                {carro.risco.mesesDeDados < 12 ? (
                  <>
                    <strong className="font-semibold">Modelo novo: só {carro.risco.mesesDeDados} meses de dados.</strong>{" "}
                    Somamos {formatarNota(risco.incerteza)} à nota por isso.
                  </>
                ) : (
                  <strong className="font-semibold">Dados de modelos parecidos.</strong>
                )}{" "}
                {carro.risco.referencia &&
                  `As reclamações vêm de ${carro.risco.referencia} (${carro.risco.vendasConsideradas.toLocaleString("pt-BR")} vendidos).`}
              </span>
            </p>
          )}
          <p className="text-sm text-muted">
            {atualizado && <>Dados de até {atualizado} · </>}
            Confiança {rotuloConfianca[carro.risco.confianca]} ·{" "}
            <Link href="/como-calculamos" className="link text-muted">
              como calculamos
            </Link>
          </p>
        </section>

        <section aria-labelledby="titulo-preco" className="grid content-start gap-2">
          <Rotulo id="titulo-preco">Preço</Rotulo>
          <p className="text-4xl leading-none font-extrabold">{formatarReais(carro.preco)}</p>
          {faixa && avaliacao ? (
            <p className="text-sm">
              <span className={`mr-2 inline-block rounded px-2 py-0.5 font-semibold ${corVeredito[avaliacao.veredito]}`}>
                {rotuloVeredito[avaliacao.veredito]}
              </span>
              <span className="text-muted">
                faixa justa {formatarReais(faixa.min)} a {formatarReais(faixa.max)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted">Sem FIPE, tabela ou anúncios para dizer se o preço é justo.</p>
          )}
          <p className="text-sm text-muted">{carro.precoFonte}</p>
        </section>

        <section aria-labelledby="titulo-garantia" className="grid content-start gap-2">
          <Rotulo id="titulo-garantia">Garantia</Rotulo>
          <p className="text-4xl leading-none font-extrabold">{carro.garantiaAnos} anos</p>
          <p className="text-sm text-muted">
            Marca com nota {formatarNumero(carro.notaReclameAquiMarca)} no Reclame Aqui
          </p>
        </section>
      </div>

      <nav aria-label="Seções da página" className="-mt-4">
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {atalhos.map(([href, rotulo]) => (
            <li key={href}>
              <a href={href} className="link">
                {rotulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="risco" aria-labelledby="titulo-preocupa" className="grid scroll-mt-4 gap-8">
        {carro.risco.principais.length > 0 && (
          <div className="grid gap-3">
            <TituloSecao id="titulo-preocupa">O que preocupa</TituloSecao>
            <ul className="grid max-w-3xl list-disc gap-1.5 pl-5">
              {carro.risco.principais.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4">
          <TituloSecao id="titulo-sistemas">Por sistema</TituloSecao>
          <p className="text-sm text-muted">
            Comparação com a {grupo.rotulo}. Frequência e gravidade vão de 1 a 5; menos é melhor.
          </p>
          <ul className="grid gap-6 md:grid-cols-3 md:gap-10">
            {sistemas.map((s) => {
              const por1000 = carro.risco.reclamacoesPor1000[s];
              const media = mediaPor1000(grupo.carros, s);
              const comp = estiloComparacao[comparacaoComMedia(por1000, media)];
              const r = risco.sistemas[s];
              return (
                <li key={s} className="grid content-start gap-1.5 text-sm">
                  <h3 className="text-base font-semibold">{nomeSistema[s]}</h3>
                  {carro.risco.imobiliza[s] && <p className="-mt-1 text-xs text-muted">defeito deixa o carro parado</p>}
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-muted">Frequência</span>
                    <Pontos valor={r.frequencia} rotulo="Frequência" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-muted">Gravidade</span>
                    <Pontos valor={r.gravidade} rotulo="Gravidade" />
                  </div>
                  <p>
                    {formatarNumero(por1000)} reclamações por 1.000 ·{" "}
                    <span className="whitespace-nowrap">
                      <span aria-hidden="true" className={comp.cor}>
                        {comp.simbolo}
                      </span>{" "}
                      {comp.texto}
                    </span>{" "}
                    <span className="text-muted">(média {formatarNumero(media)})</span>
                  </p>
                  <p>Conserto típico ~{formatarMilReais(carro.risco.custoReparo[s])}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid max-w-3xl gap-2">
          <h3 className="text-lg font-bold tracking-tight">Pós-venda</h3>
          <p>
            Garantia de {carro.garantiaAnos} anos,{" "}
            {versoMedia(
              comparacaoComMedia(carro.garantiaAnos, mediaGarantia),
              `${formatarNumero(Math.round(mediaGarantia * 10) / 10)} anos`,
            )}{" "}
            das {marcas.length} marcas da lista; a marca tem nota {formatarNumero(carro.notaReclameAquiMarca)} no
            Reclame Aqui,{" "}
            {versoMedia(
              comparacaoComMedia(carro.notaReclameAquiMarca, mediaReclameAqui),
              formatarNumero(Math.round(mediaReclameAqui * 10) / 10),
            )}
            .
          </p>
          <p className="text-sm text-muted">
            Garantia de 5 anos ou mais vale 1 ponto, de 3 a 4 anos vale 3, menos que isso vale 4; Reclame Aqui abaixo de
            7,5 soma 1.
          </p>
        </div>

        <details className="group max-w-3xl">
          <summary className="link cursor-pointer text-sm font-medium">Ver a conta completa</summary>
          <div className="grid gap-3 pt-3 text-sm">
            <ul className="grid gap-2">
              {sistemas.map((s) => {
                const r = risco.sistemas[s];
                return (
                  <li key={s}>
                    <strong className="font-semibold">{nomeSistema[s]}:</strong>{" "}
                    <span>{formatarNumero(carro.risco.reclamacoesPor1000[s])}</span> por 1.000 →
                    frequência {r.frequencia}; conserto{" "}
                    <span>{formatarReais(carro.risco.custoReparo[s])}</span>
                    {carro.risco.imobiliza[s] ? " e imobiliza" : ""} → gravidade {r.gravidade}; pontos ({r.frequencia} +{" "}
                    {r.gravidade}) ÷ 2 = <span>{formatarNumero(r.pontos)}</span>
                  </li>
                );
              })}
              <li>
                <strong className="font-semibold">Pós-venda:</strong> garantia de {carro.garantiaAnos} anos, Reclame
                Aqui {formatarNumero(carro.notaReclameAquiMarca)} → <span>{risco.posVenda}</span>
              </li>
              {risco.incerteza > 0 && (
                <li>
                  <strong className="font-semibold">Incerteza:</strong> só {carro.risco.mesesDeDados} meses de vendas →
                  + <span>{formatarNumero(risco.incerteza)}</span>
                </li>
              )}
            </ul>
            <p className="border-t border-line pt-3">
              Nota = <span>{formatarNumero(somaPontos)}</span> ÷ 2
              {risco.incerteza > 0 && (
                <>
                  {" "}+ <span>{formatarNumero(risco.incerteza)}</span>
                </>
              )}{" "}
              = <strong>{formatarNumero(risco.nota)}</strong>
            </p>
          </div>
        </details>
      </section>

      <section id="preco-justo" aria-labelledby="titulo-preco-justo" className="grid max-w-3xl scroll-mt-4 gap-3">
        <TituloSecao id="titulo-preco-justo">Preço justo</TituloSecao>
        {faixa ? (
          <PrecoJusto faixa={faixa} precoInicial={carro.preco} />
        ) : (
          <p className="text-sm text-muted">Sem FIPE, tabela ou anúncios levantados para este carro.</p>
        )}
      </section>

      <section id="ficha" aria-labelledby="titulo-ficha" className="grid scroll-mt-4 gap-4">
        <TituloSecao id="titulo-ficha">Ficha técnica</TituloSecao>
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <Bloco
            titulo="Motor e câmbio"
            itens={[
              ["Motor", carro.motor],
              ["Potência", `${carro.potenciaCv} cv`],
              ["Torque", carro.torqueKgfm ? `${formatarNumero(carro.torqueKgfm)} kgfm` : <NaoLevantado />],
              ["Câmbio", carro.cambio],
            ]}
          />
          <Bloco
            titulo="Consumo (cidade / estrada)"
            itens={[
              ["Gasolina", consumo(carro.consumoGasolina)],
              ["Etanol", consumo(carro.consumoEtanol)],
            ]}
          />
          <Bloco
            titulo="Dimensões"
            itens={[
              ["Altura", `${carro.alturaMm} mm`],
              ["Vão livre", carro.vaoLivreMm === null ? <NaoLevantado /> : `${carro.vaoLivreMm} mm`],
              ["Porta-malas", carro.portaMalasL ? `${carro.portaMalasL} L` : <NaoLevantado />],
            ]}
          />
          <Bloco
            titulo="Equipamentos"
            itens={[
              ["Câmera 360°", <SimNao key="c" valor={carro.equipamentos.camera360} />],
              ["Banco de couro", <SimNao key="b" valor={carro.equipamentos.couro} />],
              ["Chave presencial", <SimNao key="p" valor={carro.equipamentos.chavePresencial} />],
              ["Freio de mão eletrônico", <SimNao key="f" valor={carro.equipamentos.freioEletronico} />],
              ["Carregador por indução", <SimNao key="i" valor={carro.equipamentos.inducao} />],
            ]}
          />
          <Bloco
            titulo="Preço e garantia"
            itens={[
              ["Preço levantado", formatarReais(carro.preco)],
              ["Preço de tabela", carro.precoTabela ? formatarReais(carro.precoTabela) : <NaoLevantado />],
              ["Garantia", `${carro.garantiaAnos} anos`],
            ]}
          />
        </div>
      </section>

      <section id="fontes" aria-labelledby="titulo-fontes" className="grid scroll-mt-4 gap-2 border-t border-line pt-4">
        <Rotulo id="titulo-fontes">Fontes</Rotulo>
        <ul className="grid gap-1 text-sm text-muted">
          <li>Preço: {carro.precoFonte}</li>
          {carro.fontes.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
