import Image from "next/image";
import type { Carro } from "@/data/carros";
import { fotos } from "@/data/fotos";

type Silhueta = { corpo: string; vidro: string; rodas: [number, number]; raio: number; cy: number; extra?: string };

const silhuetas: Record<Carro["tipo"], Silhueta> = {
  Hatch: {
    corpo: "M34 80 L37 63 Q41 55 55 53 L86 49 Q104 31 124 29 L168 29 Q184 30 192 44 L203 58 Q207 64 207 72 L207 80 Z",
    vidro: "M94 49 Q108 35 124 34 L165 34 Q178 35 185 49 Z",
    rodas: [70, 174],
    raio: 13,
    cy: 82,
  },
  Sedã: {
    corpo: "M16 80 L22 63 Q28 55 46 53 L82 49 Q100 31 122 30 L156 30 Q172 32 186 47 L214 51 Q226 54 226 65 L226 80 Z",
    vidro: "M90 48 Q106 35 122 34 L154 34 Q166 36 178 47 Z",
    rodas: [60, 186],
    raio: 13,
    cy: 82,
  },
  SUV: {
    corpo: "M22 76 L24 57 Q26 49 40 47 L72 43 Q84 23 104 21 L194 21 Q206 21 210 33 L217 53 Q220 59 220 67 L220 76 Z",
    vidro: "M80 43 Q90 27 106 26 L190 26 Q200 26 203 35 L206 43 Z",
    rodas: [64, 180],
    raio: 16,
    cy: 80,
  },
  Picape: {
    corpo: "M14 78 L16 59 Q18 51 32 49 L64 45 Q76 25 94 23 L130 23 Q139 23 141 31 L145 47 L228 47 L228 78 Z",
    vidro: "M70 45 Q80 29 95 28 L127 28 Q134 28 136 35 L139 45 Z",
    rodas: [52, 192],
    raio: 15,
    cy: 80,
    extra: "M149 47 L149 74",
  },
};

export function FotoCarro({
  id,
  tipo,
  foto,
  grande = false,
  className = "",
}: {
  id: string;
  tipo: Carro["tipo"];
  foto?: string;
  grande?: boolean;
  className?: string;
}) {
  const credito = fotos[id];
  if (foto && credito) {
    return (
      <div
        className={`relative overflow-hidden bg-foto ${className}`}
        title={grande ? undefined : `Foto: ${credito.autor}, ${credito.licenca}`}
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH}${grande ? foto : credito.thumb}`}
          alt={credito.alt}
          fill
          unoptimized
          sizes={grande ? "(min-width: 48rem) 48rem, 100vw" : "(min-width: 48rem) 25vw, 100vw"}
          className={grande ? "object-contain" : "object-cover"}
        />
      </div>
    );
  }
  const s = silhuetas[tipo];
  return (
    <div className={`grid place-items-center overflow-hidden bg-foto ${className}`}>
      <svg viewBox="0 0 240 104" aria-hidden="true" className="h-auto w-[78%]">
        <ellipse cx="120" cy={s.cy + s.raio + 1} rx="104" ry="3" fill="var(--carro-traco)" opacity="0.18" />
        <path d={s.corpo} fill="var(--carro-corpo)" stroke="var(--carro-traco)" strokeWidth="2" strokeLinejoin="round" />
        <path d={s.vidro} fill="var(--carro-vidro)" stroke="var(--carro-traco)" strokeWidth="1.5" strokeLinejoin="round" />
        {s.extra && <path d={s.extra} stroke="var(--carro-traco)" strokeWidth="1.5" />}
        {s.rodas.map((x) => (
          <g key={x}>
            <circle cx={x} cy={s.cy} r={s.raio} fill="var(--carro-roda)" />
            <circle cx={x} cy={s.cy} r={s.raio * 0.43} fill="var(--carro-aro)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
