export function NaoLevantado({ texto = "não levantado" }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted" title="Ainda não temos esse dado">
      <span aria-hidden="true">–</span>
      <span className="italic">{texto}</span>
    </span>
  );
}
