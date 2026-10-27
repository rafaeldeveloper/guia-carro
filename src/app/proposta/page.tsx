import { AnaliseDeProposta } from "@/components/AnaliseDeProposta";
import { Topo } from "@/components/Topo";

export const metadata = { title: "Proposta e pagamento · Guia do Carro" };

export default function PaginaProposta() {
  return (
    <main className="conteudo grid gap-6 py-6 md:py-8">
      <Topo titulo="Quanto de juros tem nessa proposta?">
        Fotografe ou digite a proposta; a conta usa o preço à vista e mostra o juro embutido mesmo com taxa zero.
      </Topo>
      <div className="max-w-3xl">
        <AnaliseDeProposta />
      </div>
    </main>
  );
}
