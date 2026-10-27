import { MinhaFicha } from "@/components/MinhaFicha";
import { Topo } from "@/components/Topo";

export const metadata = { title: "Minha ficha · Guia do Carro" };

export default function PaginaMinhaFicha() {
  return (
    <main className="conteudo grid gap-6 py-6 md:py-8">
      <Topo titulo="Como está o carro que você comprou">
        Valor pela FIPE, próxima revisão, garantia e o que observar; os dados ficam só neste navegador.
      </Topo>
      <div className="max-w-4xl">
        <MinhaFicha />
      </div>
    </main>
  );
}
