export function Topo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <header className="grid gap-1">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{titulo}</h1>
      <p className="text-muted">{children}</p>
    </header>
  );
}
