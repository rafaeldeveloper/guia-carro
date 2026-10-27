"use client";

import { useEffect, useRef, useState } from "react";
import { formatarReais } from "@/lib/formato";
import {
  DESCONTO_ALVO,
  DESCONTO_MAXIMO,
  DESCONTO_MINIMO,
  MESES_VALIDADE_TABELA,
  avaliarPreco,
  distribuirRotulos,
  rotuloVeredito,
  type FaixaPrecoJusto,
  type Veredito,
} from "@/lib/precoJusto";

const cores: Record<Veredito, string> = {
  otimo: "bg-nivel-bg-1 text-nivel-1",
  bom: "bg-nivel-bg-2 text-nivel-2",
  media: "bg-nivel-bg-3 text-nivel-3",
  caro: "bg-nivel-bg-4 text-nivel-4",
};

const lerReais = (texto: string) => Number(texto.replace(/\D/g, "")) || 0;

const SELO = 20;

export function PrecoJusto({ faixa, precoInicial }: { faixa: FaixaPrecoJusto; precoInicial: number }) {
  const [preco, setPreco] = useState(String(precoInicial));
  const [opcionais, setOpcionais] = useState("");
  const regua = useRef<HTMLDivElement>(null);
  const [larguraRegua, setLarguraRegua] = useState(0);

  useEffect(() => {
    const el = regua.current;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => setLarguraRegua(e.contentRect.width));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const valorPreco = lerReais(preco);
  const avaliacao = valorPreco > 0 ? avaliarPreco(faixa, valorPreco, lerReais(opcionais)) : null;

  const valores = [...faixa.marcadores.map((m) => m.valor), faixa.min, faixa.max, faixa.base];
  if (avaliacao) valores.push(avaliacao.precoComparado);
  const inicio = Math.min(...valores) * 0.98;
  const fim = Math.max(...valores) * 1.02;
  const fracao = (v: number) => (v - inicio) / (fim - inicio);
  const pos = (v: number) => `${fracao(v) * 100}%`;
  const largura = (a: number, b: number) => `${((b - a) / (fim - inicio)) * 100}%`;
  const marcadores = [...faixa.marcadores].sort((a, b) => a.valor - b.valor);
  const centros = marcadores.map((m) => fracao(m.valor) * larguraRegua);
  const esquerdas = distribuirRotulos(centros, larguraRegua, SELO);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1 text-sm">
        <p>
          Faixa justa: <span>{formatarReais(faixa.min)}</span> a{" "}
          <span>{formatarReais(faixa.max)}</span>, alvo{" "}
          <span className="font-semibold">{formatarReais(faixa.alvo)}</span>.
        </p>
      </div>

      <div className="grid gap-2">
        <div ref={regua} className="relative h-[3.25rem]" aria-hidden>
          {larguraRegua > 0 && (
            <svg className="absolute inset-x-0 top-0 h-8 w-full overflow-visible text-muted">
              {marcadores.map((m, i) => (
                <line
                  key={m.rotulo}
                  x1={esquerdas[i] + SELO / 2}
                  y1={SELO}
                  x2={centros[i]}
                  y2={32}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
            </svg>
          )}
          {larguraRegua > 0 &&
            marcadores.map((m, i) => (
              <span
                key={m.rotulo}
                className="absolute top-0 flex size-5 items-center justify-center rounded-full border border-ink bg-surface text-[11px] leading-none"
                style={{ left: esquerdas[i] }}
              >
                {i + 1}
              </span>
            ))}
          <div className="absolute inset-x-0 top-8 h-3 overflow-hidden rounded bg-nivel-faixa-4">
            <div className="absolute inset-y-0 bg-nivel-faixa-1" style={{ left: 0, width: pos(faixa.min) }} />
            <div
              className="absolute inset-y-0 bg-nivel-faixa-2"
              style={{ left: pos(faixa.min), width: largura(faixa.min, faixa.alvo) }}
            />
            <div
              className="absolute inset-y-0 bg-nivel-faixa-3"
              style={{ left: pos(faixa.alvo), width: largura(faixa.alvo, faixa.max) }}
            />
            {marcadores.map((m) => (
              <div
                key={m.rotulo}
                className="absolute inset-y-0 w-px -translate-x-1/2 bg-surface"
                style={{ left: pos(m.valor) }}
              />
            ))}
          </div>
          {avaliacao && (
            <div
              className="absolute top-6 h-7 w-1 -translate-x-1/2 rounded bg-ink"
              style={{ left: pos(avaliacao.precoComparado) }}
            />
          )}
        </div>
        <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {marcadores.map((m, i) => (
            <li key={m.rotulo} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span
                aria-hidden
                className="flex size-4 items-center justify-center rounded-full border border-ink text-[10px] leading-none"
              >
                {i + 1}
              </span>
              {m.rotulo} <span className="text-muted">{formatarReais(m.valor)}</span>
            </li>
          ))}
          {avaliacao && (
            <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden className="h-3.5 w-1 rounded bg-ink" />
              Seu preço <span className="text-muted">{formatarReais(avaliacao.precoComparado)}</span>
            </li>
          )}
        </ol>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Preço que você recebeu (R$)</span>
          <input
            inputMode="numeric"
            className="w-44 rounded-md border border-line-forte bg-campo px-2.5 py-1.5"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Opcionais incluídos (R$)</span>
          <input
            inputMode="numeric"
            placeholder="0"
            className="w-44 rounded-md border border-line-forte bg-campo px-2.5 py-1.5"
            value={opcionais}
            onChange={(e) => setOpcionais(e.target.value)}
          />
        </label>
      </div>

      {avaliacao && (
        <p className="text-sm" aria-live="polite">
          <span className={`mr-2 inline-block rounded px-2 py-0.5 font-medium ${cores[avaliacao.veredito]}`}>
            {rotuloVeredito[avaliacao.veredito]}
          </span>
          {avaliacao.explicacao}
        </p>
      )}

      <div className="grid gap-2">
        <details>
          <summary className="link cursor-pointer text-sm font-medium">Ver referências</summary>
          <ul className="grid gap-2 pt-2 text-sm">
            {faixa.referencias.map((r, i) => (
              <li key={i} className={r.usada ? "" : "text-muted"}>
                <span className="font-medium">{r.nome}</span>
                {r.valor !== null && <span> {formatarReais(r.valor)}</span>}
                {r.usada && <span className="ml-1 text-xs">(usada)</span>}: {r.explicacao}
              </li>
            ))}
          </ul>
        </details>

        <details>
          <summary className="link cursor-pointer text-sm font-medium">Como calculamos o preço justo</summary>
          <p className="pt-2 text-sm text-muted">
            A base é o preço de tabela da montadora, se tiver até {MESES_VALIDADE_TABELA} meses; senão a FIPE 0 km; senão
            a mediana dos anúncios. Uma promoção vigente aberta a todos (sem exigir usado na troca) substitui a base
            quando é menor. Alvo = base menos {DESCONTO_ALVO * 100}% (desconto à vista realista fica entre 3% e 5%). Teto
            da faixa = base menos {DESCONTO_MINIMO * 100}%. Piso = base menos {DESCONTO_MAXIMO * 100}% (o que se consegue
            em fim de ano ou estoque parado), elevado até a FIPE do ano-modelo, já que pagar abaixo dela num 0 km é raro.
            Veredito: até o piso, ótimo; até o alvo, bom; até o teto, na média; acima, caro. Opcionais informados são
            descontados do preço antes de comparar.
          </p>
        </details>
      </div>
    </div>
  );
}
