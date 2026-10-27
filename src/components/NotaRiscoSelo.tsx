import { LIMITES_FAIXA, NOTA_MAX, NOTA_MIN, nivelRisco } from "@/lib/apresentacao";
import { formatarNota } from "@/lib/formato";
import { faixaRisco } from "@/lib/risco";

const corSelo = {
  1: "bg-nivel-bg-1 text-nivel-1 border-nivel-1",
  2: "bg-nivel-bg-2 text-nivel-2 border-nivel-2",
  3: "bg-nivel-bg-3 text-nivel-3 border-nivel-3",
  4: "bg-nivel-bg-4 text-nivel-4 border-nivel-4",
};

export const corTextoNivel = { 1: "text-nivel-1", 2: "text-nivel-2", 3: "text-nivel-3", 4: "text-nivel-4" };

const corFaixa = ["bg-nivel-faixa-1", "bg-nivel-faixa-2", "bg-nivel-faixa-3", "bg-nivel-faixa-4"];

export function IconeRisco({ nivel, className = "" }: { nivel: 1 | 2 | 3 | 4; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={`size-3 shrink-0 ${className}`} fill="currentColor">
      {nivel === 1 && <circle cx="6" cy="6" r="5" />}
      {nivel === 2 && (
        <>
          <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 1a5 5 0 0 1 0 10z" />
        </>
      )}
      {nivel === 3 && <path d="M6 0.8 11.2 6 6 11.2 0.8 6z" />}
      {nivel === 4 && <path d="M6 0.6 11.6 11H0.4z" />}
    </svg>
  );
}

export function IconeAlerta({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={`size-3 shrink-0 ${className}`}>
      <circle cx="6" cy="6" r="5.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3v3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6" cy="8.7" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function NotaRiscoSelo({ nota, incerto = false }: { nota: number; incerto?: boolean }) {
  const nivel = nivelRisco(nota);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-sm font-medium ${corSelo[nivel]} ${incerto ? "border-dashed" : "border-transparent"}`}
    >
      <IconeRisco nivel={nivel} />
      <span className="font-semibold">{incerto ? "~" : ""}{formatarNota(nota)}</span>
      <span>Risco {faixaRisco(nota)}</span>
    </span>
  );
}

const posicao = (v: number) => ((Math.min(Math.max(v, NOTA_MIN), NOTA_MAX) - NOTA_MIN) / (NOTA_MAX - NOTA_MIN)) * 100;

export function ReguaRisco({
  nota,
  incerteza = 0,
  compacta = false,
}: {
  nota: number;
  incerteza?: number;
  compacta?: boolean;
}) {
  const limites = [NOTA_MIN, ...LIMITES_FAIXA, NOTA_MAX];
  return (
    <div
      role="img"
      aria-label={`Nota ${formatarNota(nota)} numa escala de 2 a 10,5; menor é melhor${incerteza > 0 ? `; incerteza de mais ou menos ${formatarNota(incerteza)}` : ""}`}
      className={compacta ? "flex w-full max-w-56 items-center gap-1.5 text-xs text-muted" : "w-full"}
    >
      {compacta && <span>2</span>}
      <div className={`relative ${compacta ? "h-3 flex-1" : "h-5"}`}>
        <div className="absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 gap-px overflow-hidden rounded-full">
          {limites.slice(0, -1).map((de, i) => (
            <div
              key={de}
              className={corFaixa[i]}
              style={{ width: `${posicao(limites[i + 1]) - posicao(de)}%` }}
            />
          ))}
        </div>
        {incerteza > 0 && (
          <div
            className="hachura absolute inset-y-0 rounded-sm border border-muted/60"
            style={{ left: `${posicao(nota - incerteza)}%`, width: `${posicao(nota + incerteza) - posicao(nota - incerteza)}%` }}
          />
        )}
        <div
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface ${incerteza > 0 ? "bg-surface outline-2 outline-ink" : "bg-ink"} ${compacta ? "size-3" : "size-4"}`}
          style={{ left: `${posicao(nota)}%` }}
        />
      </div>
      {compacta && <span>10,5</span>}
      {!compacta && (
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>2</span>
          <span className="font-sans">menor é melhor</span>
          <span>10,5</span>
        </div>
      )}
    </div>
  );
}

export function ReguaLinha({ nota, incerto = false }: { nota: number; incerto?: boolean }) {
  const limites = [NOTA_MIN, ...LIMITES_FAIXA, NOTA_MAX];
  const nivel = nivelRisco(nota);
  return (
    <div className="relative h-3.5 w-full" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 gap-px overflow-hidden rounded-full opacity-40">
        {limites.slice(0, -1).map((de, i) => (
          <div key={de} className={corFaixa[i]} style={{ width: `${posicao(limites[i + 1]) - posicao(de)}%` }} />
        ))}
      </div>
      {incerto && (
        <div
          className="hachura absolute inset-y-0 rounded-sm"
          style={{ left: `${posicao(nota - 0.5)}%`, width: `${posicao(nota + 0.5) - posicao(nota - 0.5)}%` }}
        />
      )}
      <div
        className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${incerto ? "border-ink bg-bg" : `border-bg ${corFaixa[nivel - 1]}`}`}
        style={{ left: `${posicao(nota)}%` }}
      />
    </div>
  );
}

export function NotaForma({ nota, incerto = false, className = "" }: { nota: number; incerto?: boolean; className?: string }) {
  const nivel = nivelRisco(nota);
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${corTextoNivel[nivel]} ${className}`}>
      <IconeRisco nivel={nivel} />
      {incerto ? "~" : ""}
      {formatarNota(nota)}
      <span className="sr-only">, risco {faixaRisco(nota)}</span>
    </span>
  );
}
